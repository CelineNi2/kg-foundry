"use client";

import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import expandCollapse from 'cytoscape-expand-collapse';
import contextMenus from 'cytoscape-context-menus';
import navigator from 'cytoscape-navigator';

if (typeof window !== 'undefined') {
    cytoscape.use(expandCollapse);
    cytoscape.use(contextMenus);
    cytoscape.use(navigator);
}

import { FilterState } from './ControlPanel';

interface GraphProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    elements: any[];
    filters?: FilterState;
    layout?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onElementClick?: (data: any) => void;
}

const GraphVisualization: React.FC<GraphProps> = ({ elements, filters, layout = 'cose', onElementClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            const cy = cytoscape({
                container: containerRef.current,
                elements: elements,
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#666',
                            'label': 'data(label)',
                            'color': '#fff',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'width': 60,
                            'height': 60
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 3,
                            'line-color': '#ccc',
                            'target-arrow-color': '#ccc',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'label': 'data(label)',
                            'font-size': 12,
                            'color': '#ffffff',
                            'text-outline-color': '#000000',
                            'text-outline-width': 2,
                            'text-background-opacity': 1,
                            'text-background-color': '#1a1a1a',
                            'text-background-padding': '3px',
                            'text-background-shape': 'roundrectangle'
                        }
                    },
                    {
                        selector: '.highlighted',
                        style: {
                            'background-color': '#3b82f6',
                            'line-color': '#3b82f6',
                            'target-arrow-color': '#3b82f6',
                            'transition-property': 'background-color, line-color, target-arrow-color',
                            'transition-duration': 300
                        }
                    },
                    {
                        selector: '.dimmed',
                        style: {
                            'opacity': 0.2,
                            'label': '',
                            'transition-property': 'opacity',
                            'transition-duration': 300
                        }
                    },
                    {
                        selector: '.hidden',
                        style: {
                            'display': 'none'
                        }
                    }
                ],
                layout: {
                    name: layout,
                    animate: true,
                    // Tuning for better spacing
                    idealEdgeLength: 100,
                    nodeOverlap: 20,
                    refresh: 20,
                    fit: true,
                    padding: 30,
                    randomize: false,
                    componentSpacing: 100,
                    nodeRepulsion: 400000,
                    edgeElasticity: 100,
                    nestingFactor: 5,
                    gravity: 80,
                    numIter: 1000,
                    initialTemp: 200,
                    coolingFactor: 0.95,
                    minTemp: 1.0
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
            });

            cyRef.current = cy;

            // Initialize expand-collapse
            // @ts-expect-error - extension method
            const api = cy.expandCollapse({
                layoutBy: {
                    name: "cose",
                    animate: true,
                    randomize: false,
                    fit: true
                },
                fisheye: false,
                animate: true,
                undoable: false
            });

            // Initialize context menus
            // @ts-expect-error - extension method
            cy.contextMenus({
                menuItems: [
                    {
                        id: 'expand',
                        content: 'Expand',
                        tooltipText: 'Expand',
                        selector: 'node.cy-expand-collapse-collapsed-node',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClickFunction: function (event: any) {
                            api.expand(event.target);
                        },
                        hasTrailingDivider: true
                    },
                    {
                        id: 'collapse',
                        content: 'Collapse',
                        tooltipText: 'Collapse',
                        selector: 'node:not(.cy-expand-collapse-collapsed-node)',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClickFunction: function (event: any) {
                            api.collapse(event.target);
                        },
                        hasTrailingDivider: true
                    }
                ]
            });

            // Initialize navigator
            // @ts-expect-error - extension method
            cy.navigator({
                container: false, // can be a HTML or jQuery element or jQuery selector
                viewLiveFramerate: 0, // set to 0 to update graph sooner; set to >0 to update graph less frequently
                thumbnailEventFramerate: 30, // max thumbnail's updates per second triggered by graph updates
                thumbnailLiveFramerate: false, // max thumbnail's updates per second. Set to false to disable
                dblClickDelay: 200, // milliseconds
                removeCustomContainer: true, // destroy the container specified by user on plugin destroy
                rerenderDelay: 100 // ms to throttle rerender updates to the panzoom for performance
            });

            // Event listeners for highlighting
            cy.on('tap', 'node', (evt) => {
                const node = evt.target;
                const neighborhood = node.neighborhood().add(node);

                cy.elements().addClass('dimmed');
                neighborhood.removeClass('dimmed').addClass('highlighted');

                if (onElementClick) {
                    onElementClick(node.data());
                }
            });

            cy.on('tap', 'edge', (evt) => {
                const edge = evt.target;

                cy.elements().addClass('dimmed');
                edge.addClass('highlighted');
                edge.source().addClass('highlighted');
                edge.target().addClass('highlighted');

                if (onElementClick) {
                    onElementClick(edge.data());
                }
            });

            cy.on('tap', (evt) => {
                if (evt.target === cy) {
                    cy.elements().removeClass('dimmed highlighted');
                    if (onElementClick) {
                        onElementClick(null);
                    }
                }
            });

            return () => {
                cy.destroy();
                cyRef.current = null;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements, onElementClick]);

    // Apply Layout Changes
    useEffect(() => {
        if (cyRef.current && layout) {
            const cy = cyRef.current;
            cy.layout({
                name: layout,
                animate: true,
                fit: true
            } as any).run();
        }
    }, [layout]);

    // Apply Filters
    useEffect(() => {
        if (cyRef.current && filters) {
            const cy = cyRef.current;

            cy.batch(() => {
                // Reset visibility
                cy.elements().removeClass('hidden');

                // Filter by Entity Type
                Object.entries(filters.entityTypes).forEach(([type, isVisible]) => {
                    if (!isVisible) {
                        cy.nodes(`[type = "${type}"]`).addClass('hidden');
                    }
                });

                // Filter by Relation Type
                Object.entries(filters.relationTypes).forEach(([type, isVisible]) => {
                    if (!isVisible) {
                        cy.edges(`[label = "${type}"]`).addClass('hidden');
                    }
                });

                // Filter by Confidence
                if (filters.minConfidence > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    cy.elements().filter((ele: any) => {
                        const confidence = ele.data('confidence');
                        return confidence !== undefined && confidence < filters.minConfidence;
                    }).addClass('hidden');
                }
            });
        }
    }, [filters]);

    return <div ref={containerRef} className="w-full h-full bg-gray-900" />;
};

export default GraphVisualization;

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
import { getEntityTypeColor } from '../utils/colors';

interface GraphProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    elements: any[];
    filters?: FilterState;
    layout?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onElementClick?: (data: any) => void;
    focusedNodeId?: string | null;
    onFocusReset?: () => void;
}

const GraphVisualization: React.FC<GraphProps> = ({ elements, filters, layout = 'cose', onElementClick, focusedNodeId, onFocusReset }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const navigatorRef = useRef<any>(null);
    const contextMenuRef = useRef<any>(null);
    const isDestroyedRef = useRef(false);

    const onElementClickRef = useRef(onElementClick);
    const onFocusResetRef = useRef(onFocusReset);

    // Prepare elements with colors
    const coloredElements = React.useMemo(() => {
        return elements.map(el => {
            if (el.group === 'nodes' || (!el.group && el.data && !el.data.source)) {
                const color = getEntityTypeColor(el.data.type || 'UNKNOWN');
                return {
                    ...el,
                    data: {
                        ...el.data,
                        color: color
                    }
                };
            }
            return el;
        });
    }, [elements]);

    // Update refs when props change
    useEffect(() => {
        onElementClickRef.current = onElementClick;
        onFocusResetRef.current = onFocusReset;
    }, [onElementClick, onFocusReset]);

    useEffect(() => {
        if (containerRef.current) {
            isDestroyedRef.current = false;
            const cy = cytoscape({
                container: containerRef.current,
                elements: coloredElements,
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': 'data(color)',
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
                        selector: 'node.highlighted',
                        style: {
                            'border-width': 4,
                            'border-color': '#ffffff',
                            'transition-property': 'border-width, border-color',
                            'transition-duration': 300
                        }
                    },
                    {
                        selector: 'edge.highlighted',
                        style: {
                            'line-color': '#3b82f6',
                            'target-arrow-color': '#3b82f6',
                            'transition-property': 'line-color, target-arrow-color',
                            'transition-duration': 300
                        }
                    },
                    {
                        selector: 'node.dimmed',
                        style: {
                            'opacity': 0.2,
                            'label': '',
                            'transition-property': 'opacity',
                            'transition-duration': 300
                        }
                    },
                    {
                        selector: 'edge.dimmed',
                        style: {
                            'opacity': 0.3,
                            'text-opacity': 0.5,
                            'transition-property': 'opacity, text-opacity',
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
                    idealEdgeLength: 250,
                    nodeOverlap: 50,
                    refresh: 20,
                    fit: true,
                    padding: 30,
                    randomize: false,
                    componentSpacing: 200,
                    nodeRepulsion: 2000000,
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
            // DISABLED: Suspected cause of persistent errors
            // const api = cy.expandCollapse({
            //     layoutBy: {
            //         name: "cose",
            //         animate: true,
            //         randomize: false,
            //         fit: true
            //     },
            //     fisheye: false,
            //     animate: true,
            //     undoable: false
            // });

            // Initialize context menus
            // DISABLED: Suspected cause of persistent errors
            // cy.contextMenus({
            //     menuItems: [
            //         {
            //             id: 'expand',
            //             content: 'Expand',
            //             tooltipText: 'Expand',
            //             selector: 'node.cy-expand-collapse-collapsed-node',
            //             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            //             onClickFunction: function (event: any) {
            //                 api.expand(event.target);
            //             },
            //             hasTrailingDivider: true
            //         },
            //         {
            //             id: 'collapse',
            //             content: 'Collapse',
            //             tooltipText: 'Collapse',
            //             selector: 'node:not(.cy-expand-collapse-collapsed-node)',
            //             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            //             onClickFunction: function (event: any) {
            //                 api.collapse(event.target);
            //             },
            //             hasTrailingDivider: true
            //         }
            //     ]
            // });

            // Initialize navigator
            // DISABLED: Navigator plugin causes persistent null reference errors
            // const nav = cy.navigator({
            //     container: false,
            //     viewLiveFramerate: 0,
            //     thumbnailEventFramerate: 30,
            //     thumbnailLiveFramerate: false,
            //     dblClickDelay: 200,
            //     removeCustomContainer: true,
            //     rerenderDelay: 100
            // });
            // navigatorRef.current = nav;

            // Event listeners for highlighting
            cy.on('tap', 'node', (evt) => {
                if (isDestroyedRef.current) return;
                const node = evt.target;

                // Highlighting and layout is now handled by the focusedNodeId effect
                // which is triggered by onElementClick -> setFocusedNodeId in parent

                if (onElementClickRef.current) {
                    onElementClickRef.current(node.data());
                }
            });

            cy.on('tap', 'edge', (evt) => {
                if (isDestroyedRef.current) return;
                const edge = evt.target;

                cy.elements().addClass('dimmed');
                edge.addClass('highlighted');
                edge.source().addClass('highlighted');
                edge.target().addClass('highlighted');

                if (onElementClickRef.current) {
                    onElementClickRef.current(edge.data());
                }
            });

            cy.on('tap', (evt) => {
                if (isDestroyedRef.current) return;
                if (evt.target === cy) {
                    // Stop any ongoing animations
                    cy.stop(); // Don't jump to end, just stop

                    cy.elements().removeClass('dimmed highlighted');

                    // Re-run the global layout to restore structure and fit
                    const currentLayout = layout || 'cose';
                    cy.layout({
                        name: currentLayout,
                        animate: true,
                        fit: true,
                        padding: 30
                    } as any).run();

                    if (onFocusResetRef.current) {
                        onFocusResetRef.current();
                    }
                    if (onElementClickRef.current) {
                        onElementClickRef.current(null);
                    }
                }
            });

            return () => {
                isDestroyedRef.current = true;

                // Stop all animations first
                if (cy && !cy.destroyed()) {
                    cy.stop(true, true);

                    // Remove all event listeners
                    cy.removeAllListeners();

                    // Destroy navigator explicitly
                    if (navigatorRef.current && typeof navigatorRef.current.destroy === 'function') {
                        try {
                            navigatorRef.current.destroy();
                        } catch (e) {
                            console.warn('Navigator cleanup warning:', e);
                        }
                    }

                    // Destroy cytoscape instance
                    try {
                        cy.destroy();
                    } catch (e) {
                        console.warn('Cytoscape cleanup warning:', e);
                    }
                }

                cyRef.current = null;
                navigatorRef.current = null;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coloredElements]);

    // Apply Layout Changes
    useEffect(() => {
        if (cyRef.current && layout && !isDestroyedRef.current) {
            const cy = cyRef.current;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!cy.destroyed() && !(cy as any).headless()) {
                cy.layout({
                    name: layout,
                    animate: true,
                    fit: true
                } as any).run();
            }
        }
    }, [layout]);

    // Apply Filters
    useEffect(() => {
        if (cyRef.current && filters && !isDestroyedRef.current) {
            const cy = cyRef.current;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!cy.destroyed() && !(cy as any).headless()) {
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
        }
    }, [filters]);

    // Handle focused node (from search)
    useEffect(() => {
        if (cyRef.current && focusedNodeId && !isDestroyedRef.current) {
            const cy = cyRef.current;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!cy.destroyed() && !(cy as any).headless()) {
                const focusedNode = cy.getElementById(focusedNodeId);

                if (focusedNode.length > 0) {
                    // Stop any ongoing animations
                    cy.stop();

                    // Get neighborhood
                    const neighborhood = focusedNode.neighborhood().add(focusedNode);

                    // Dim everything, highlight neighborhood
                    cy.elements().addClass('dimmed');
                    neighborhood.removeClass('dimmed').addClass('highlighted');

                    // Simply zoom to the neighborhood without changing layout
                    cy.animate({
                        fit: {
                            eles: neighborhood,
                            padding: 50
                        },
                        duration: 500,
                        easing: 'ease-in-out-cubic'
                    });
                }
            }
        }
    }, [focusedNodeId]);

    return <div ref={containerRef} className="w-full h-full bg-gray-900" />;
};

export default GraphVisualization;

"use client";

import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface GraphProps {
    elements: any[];
}

const GraphVisualization: React.FC<GraphProps> = ({ elements }) => {
    const containerRef = useRef<HTMLDivElement>(null);

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
                    }
                ],
                layout: {
                    name: 'cose',
                    animate: true
                }
            });

            return () => {
                cy.destroy();
            }
        }
    }, [elements]);

    return <div ref={containerRef} className="w-full h-[600px] border border-gray-700 rounded-lg bg-gray-900" />;
};

export default GraphVisualization;

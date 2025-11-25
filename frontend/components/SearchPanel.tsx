import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface GraphNode {
    data: {
        id: string;
        label: string;
        type?: string;
    };
}

interface SearchPanelProps {
    nodes: GraphNode[];
    onNodeSelect: (nodeId: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ nodes, onNodeSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredNodes, setFilteredNodes] = useState<GraphNode[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Filter nodes based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredNodes([]);
            setSelectedIndex(-1);
            return;
        }

        const query = searchQuery.toLowerCase();
        const matches = nodes.filter(node => {
            const label = node.data.label?.toLowerCase() || '';
            const type = node.data.type?.toLowerCase() || '';
            return label.includes(query) || type.includes(query);
        });

        setFilteredNodes(matches.slice(0, 10)); // Limit to 10 results
        setSelectedIndex(-1);
    }, [searchQuery, nodes]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle node selection
    const handleSelectNode = (node: GraphNode) => {
        onNodeSelect(node.data.id);
        setSearchQuery('');
        setFilteredNodes([]);
        setIsOpen(false);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (filteredNodes.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredNodes.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredNodes.length) {
                    handleSelectNode(filteredNodes[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchQuery('');
                break;
        }
    };

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as HTMLElement)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={panelRef} className="absolute top-4 left-4 z-[1000] pointer-events-auto">
            {/* Search Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
                title={isOpen ? 'Close Search' : 'Search Nodes'}
            >
                {isOpen ? <X size={20} /> : <Search size={20} />}
                {!isOpen && <span className="text-sm font-medium">Search</span>}
            </button>

            {/* Collapsible Search Panel */}
            {isOpen && (
                <div className="mt-2 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700/50 w-80 animate-in slide-in-from-top duration-200">
                    <div className="p-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search nodes by name or type..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Search Results */}
                        {filteredNodes.length > 0 && (
                            <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-700">
                                {filteredNodes.map((node, index) => (
                                    <button
                                        key={node.data.id}
                                        onClick={() => handleSelectNode(node)}
                                        className={`w-full text-left px-3 py-2 transition-colors ${index === selectedIndex
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-900 hover:bg-gray-700 text-gray-200'
                                            } ${index === 0 ? 'rounded-t-lg' : ''} ${index === filteredNodes.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-700'
                                            }`}
                                    >
                                        <div className="font-medium">{node.data.label}</div>
                                        {node.data.type && (
                                            <div className="text-xs mt-1 opacity-75">
                                                Type: {node.data.type}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No Results Message */}
                        {searchQuery && filteredNodes.length === 0 && (
                            <div className="mt-2 p-3 text-center text-gray-400 text-sm">
                                No nodes found matching &quot;{searchQuery}&quot;
                            </div>
                        )}

                        {/* Help Text */}
                        {!searchQuery && (
                            <div className="mt-3 text-xs text-gray-500">
                                <p>💡 Start typing to search for nodes</p>
                                <p className="mt-1">Use ↑↓ to navigate, Enter to select</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPanel;

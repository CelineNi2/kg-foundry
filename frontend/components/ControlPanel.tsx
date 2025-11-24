import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface FilterState {
    entityTypes: Record<string, boolean>;
    relationTypes: Record<string, boolean>;
    minConfidence: number;
}

interface ControlPanelProps {
    entityTypes: string[];
    relationTypes: string[];
    onFilterChange: (filters: FilterState) => void;
    onLayoutChange: (layout: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ entityTypes, relationTypes, onFilterChange, onLayoutChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        entityTypes: entityTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {}),
        relationTypes: relationTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {}),
        minConfidence: 0
    });

    // Initialize filters when types change
    useEffect(() => {
        const newFilters = {
            entityTypes: entityTypes.reduce((acc, type) => ({ ...acc, [type]: filters.entityTypes[type] ?? true }), {}),
            relationTypes: relationTypes.reduce((acc, type) => ({ ...acc, [type]: filters.relationTypes[type] ?? true }), {}),
            minConfidence: filters.minConfidence
        };
        setFilters(newFilters);
        onFilterChange(newFilters);
    }, [entityTypes, relationTypes]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleEntityTypeChange = (type: string) => {
        const newFilters = {
            ...filters,
            entityTypes: { ...filters.entityTypes, [type]: !filters.entityTypes[type] }
        };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleRelationTypeChange = (type: string) => {
        const newFilters = {
            ...filters,
            relationTypes: { ...filters.relationTypes, [type]: !filters.relationTypes[type] }
        };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        const newFilters = { ...filters, minConfidence: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className={`bg-gray-800 border-r border-gray-700 text-white h-full overflow-y-auto shrink-0 transition-all duration-300 relative ${isCollapsed ? 'w-12' : 'w-64'}`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-4 -right-3 z-10 bg-gray-700 hover:bg-gray-600 rounded-full p-1 border border-gray-600 shadow-lg transition-colors"
                title={isCollapsed ? 'Expand Controls' : 'Collapse Controls'}
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {!isCollapsed && (
                <div className="p-4">
                    <h3 className="font-bold mb-4">Controls</h3>

                    <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-2 text-gray-400">Layout</h4>
                        <div className="flex gap-2">
                            <button onClick={() => onLayoutChange('cose')} className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500">Cose</button>
                            <button onClick={() => onLayoutChange('grid')} className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500">Grid</button>
                            <button onClick={() => onLayoutChange('concentric')} className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500">Radial</button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-2 text-gray-400">Confidence Threshold</h4>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={filters.minConfidence}
                            onChange={handleConfidenceChange}
                            className="w-full"
                        />
                        <div className="text-xs text-right">{filters.minConfidence}</div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-2 text-gray-400">Entity Types</h4>
                        {entityTypes.map(type => (
                            <div key={type} className="flex items-center mb-1">
                                <input
                                    type="checkbox"
                                    checked={filters.entityTypes[type] ?? true}
                                    onChange={() => handleEntityTypeChange(type)}
                                    className="mr-2"
                                />
                                <span className="text-sm">{type}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-400">Relation Types</h4>
                        {relationTypes.map(type => (
                            <div key={type} className="flex items-center mb-1">
                                <input
                                    type="checkbox"
                                    checked={filters.relationTypes[type] ?? true}
                                    onChange={() => handleRelationTypeChange(type)}
                                    className="mr-2"
                                />
                                <span className="text-sm">{type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ControlPanel;

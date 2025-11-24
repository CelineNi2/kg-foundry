import React from 'react';
import { X } from 'lucide-react';

interface DetailsPanelProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ data, onClose }) => {
    if (!data) return null;

    const isNode = data.source === undefined && data.target === undefined;

    return (
        <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-md p-4 rounded-lg border border-gray-700/50 text-white z-50 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-blue-400">
                    {isNode ? 'Entity Details' : 'Relation Details'}
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold">Label</label>
                    <div className="text-lg font-medium">{data.label || data.id}</div>
                </div>

                {isNode && (
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Type</label>
                        <div className="inline-block px-2 py-1 bg-blue-900/50 text-blue-200 rounded text-sm mt-1">
                            {data.type}
                        </div>
                    </div>
                )}

                {!isNode && (
                    <>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Source</label>
                            <div className="text-sm">{data.source}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Target</label>
                            <div className="text-sm">{data.target}</div>
                        </div>
                    </>
                )}

                {data.description && (
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Description</label>
                        <p className="text-sm text-gray-300 mt-1">{data.description}</p>
                    </div>
                )}

                {data.confidence !== undefined && (
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Confidence</label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${data.confidence * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-400">{Math.round(data.confidence * 100)}%</span>
                        </div>
                    </div>
                )}

                {/* Provenance Placeholder - to be connected to backend if available */}
                {data.provenance && (
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Provenance</label>
                        <div className="text-xs text-gray-400 mt-1 italic border-l-2 border-gray-600 pl-2">
                            &quot;{data.provenance}&quot;
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailsPanel;

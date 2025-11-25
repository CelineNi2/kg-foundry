"use client";

import { useState, useMemo } from "react";
import dynamic from 'next/dynamic';
import ControlPanel, { FilterState } from "@/components/ControlPanel";
import DetailsPanel from "@/components/DetailsPanel";
import SearchPanel from "@/components/SearchPanel";
import { Upload, FileText, Loader2 } from "lucide-react";

const GraphVisualization = dynamic(() => import('@/components/GraphVisualization'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900">Loading Graph...</div>
});

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [layout, setLayout] = useState('cose');
  const [filters, setFilters] = useState<FilterState | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedElement, setSelectedElement] = useState<any | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    graphData.forEach(el => {
      if (el.data.type) types.add(el.data.type);
    });
    return Array.from(types);
  }, [graphData]);

  const relationTypes = useMemo(() => {
    const types = new Set<string>();
    graphData.forEach(el => {
      if (el.data.source && el.data.target && el.data.label) types.add(el.data.label);
    });
    return Array.from(types);
  }, [graphData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setIsProcessing(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Start Ingestion Job
      const res = await fetch("http://localhost:8000/ingest", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const { job_id } = await res.json();

      // 2. Poll for Progress
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:8000/jobs/${job_id}`);
          const statusData = await statusRes.json();

          if (statusData.status === "processing") {
            setUploadProgress(statusData.progress);
          } else if (statusData.status === "completed") {
            clearInterval(pollInterval);
            setUploadProgress(100);

            // Transform data for Cytoscape
            const data = statusData.result;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nodes = data.entities.map((e: any) => ({
              data: { id: e.name, label: e.name, type: e.type }
            }));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const edges = data.relations.map((r: any, i: number) => ({
              data: {
                id: `e${i}`,
                source: r.source,
                target: r.target,
                label: r.type
              }
            }));

            setGraphData([...nodes, ...edges]);
            setLoading(false);
            setIsProcessing(false);
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            throw new Error(statusData.error || "Processing failed");
          }
        } catch (err) {
          clearInterval(pollInterval);
          setError(err instanceof Error ? err.message : "Polling error");
          setLoading(false);
          setIsProcessing(false);
        }
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleLoadFromDB = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/graph");

      if (!res.ok) {
        throw new Error("Failed to load graph from database");
      }

      const data = await res.json();

      // Transform data for Cytoscape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodes = data.entities.map((e: any) => ({
        data: { id: e.name, label: e.name, type: e.type }
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const edges = data.relations.map((r: any, i: number) => ({
        data: {
          id: `e${i}`,
          source: r.source,
          target: r.target,
          label: r.type
        }
      }));

      setGraphData([...nodes, ...edges]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };


  const handleChat = async () => {
    if (!chatMessage) return;
    setChatLoading(true);
    setChatResponse(null);
    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage }),
      });
      const data = await res.json();
      setChatResponse(data.response);
    } catch {
      setChatResponse("Error getting answer.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="flex h-screen flex-col items-center p-2 bg-black text-white overflow-hidden">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text shrink-0">
        kg-foundry
      </h1>

      <div className="w-full flex-1 flex flex-col overflow-hidden">
        <div className="mb-4 p-4 border border-gray-800 rounded-xl bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept=".txt,.pdf,.md"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
            >
              <Upload size={20} />
              Choose File
            </label>
            <span className="text-gray-400">
              {file ? file.name : "No file chosen"}
            </span>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="ml-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <FileText />}
              Process
            </button>

            <button
              onClick={handleLoadFromDB}
              disabled={loading}
              className="ml-2 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <FileText />}
              Load from DB
            </button>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Processing...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>

        {graphData.length > 0 && (
          <div className="animate-in fade-in duration-700 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4 shrink-0">Knowledge Graph</h2>

            {/* Main Graph Container with Sidebar Layout */}
            <div className="flex flex-1 border border-gray-800 rounded-xl bg-gray-900/50 overflow-hidden relative min-h-0">
              <ControlPanel
                entityTypes={entityTypes}
                relationTypes={relationTypes}
                onFilterChange={setFilters}
                onLayoutChange={setLayout}
              />

              <div className="flex-1 relative h-full">
                <SearchPanel
                  nodes={graphData.filter(el => !el.data.source && !el.data.target)}
                  onNodeSelect={(nodeId) => setFocusedNodeId(nodeId)}
                />
                <GraphVisualization
                  elements={graphData}
                  filters={filters}
                  layout={layout}
                  onElementClick={(element) => {
                    setSelectedElement(element);
                    // If it's a node (has id but no source/target), set it as focused
                    if (element && !element.source && !element.target) {
                      setFocusedNodeId(element.id);
                    }
                  }}
                  focusedNodeId={focusedNodeId}
                  onFocusReset={() => setFocusedNodeId(null)}
                />
                <DetailsPanel
                  data={selectedElement}
                  onClose={() => setSelectedElement(null)}
                />
              </div>
            </div>

            <div className="mt-4 p-4 border border-gray-800 rounded-xl bg-gray-900/50 shrink-0">
              <h2 className="text-xl font-semibold mb-3">Ask the Graph (RAG)</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask a question about the document..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                />
                <button
                  onClick={handleChat}
                  disabled={!chatMessage || chatLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {chatLoading ? <Loader2 className="animate-spin" /> : "Ask"}
                </button>
              </div>
              {chatResponse && (
                <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700 max-h-32 overflow-y-auto">
                  <p className="text-gray-300 text-sm">{chatResponse}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}



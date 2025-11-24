"use client";

import { useState, useMemo } from "react";
import dynamic from 'next/dynamic';
import ControlPanel, { FilterState } from "@/components/ControlPanel";
import DetailsPanel from "@/components/DetailsPanel";
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

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/ingest", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
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
    <main className="flex min-h-screen flex-col items-center p-24 bg-black text-white">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
        kg-foundry
      </h1>

      <div className="w-full max-w-4xl">
        <div className="mb-8 p-6 border border-gray-800 rounded-xl bg-gray-900/50">
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
          </div>
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>

        {graphData.length > 0 && (
          <div className="animate-in fade-in duration-700">
            <h2 className="text-2xl font-semibold mb-4">Knowledge Graph</h2>

            {/* Main Graph Container with Sidebar Layout */}
            <div className="flex h-[700px] border border-gray-800 rounded-xl bg-gray-900/50 overflow-hidden relative">
              <ControlPanel
                entityTypes={entityTypes}
                relationTypes={relationTypes}
                onFilterChange={setFilters}
                onLayoutChange={setLayout}
              />

              <div className="flex-1 relative h-full">
                <GraphVisualization
                  elements={graphData}
                  filters={filters}
                  layout={layout}
                  onElementClick={setSelectedElement}
                />
                <DetailsPanel
                  data={selectedElement}
                  onClose={() => setSelectedElement(null)}
                />
              </div>
            </div>

            <div className="mt-8 p-6 border border-gray-800 rounded-xl bg-gray-900/50">
              <h2 className="text-2xl font-semibold mb-4">Ask the Graph (RAG)</h2>
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
                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-gray-300">{chatResponse}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}



import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  Connection,
  addEdge,
  MarkerType,
  getIncomers,
  getOutgoers
} from 'reactflow';
import { 
  Play, 
  Box, 
  Hash, 
  Activity, 
  CalendarClock, 
  Calendar, 
  Plus, 
  ChevronDown, 
  Database, 
  BarChart3, 
  Layers, 
  Globe, 
  ScanEye, 
  RotateCcw 
} from 'lucide-react';
import PipelineEditor from './components/pipeline/PipelineEditor';
import ResourceConfig from './components/resources/ResourceConfig';
import ScheduleModal from './components/scheduler/ScheduleModal';
import { AppNode, NodeData, JobStatus, ResourceTier, ScheduleConfig, NodeType } from './types';
import { RESOURCE_PRESETS, INITIAL_PREP_PATH, DEFAULT_OUTPUT_PATH } from './constants';

const initialNodes: AppNode[] = [
  {
    id: 'node-prep',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: {
      label: 'Data Preparation',
      type: 'prep',
      status: JobStatus.IDLE,
      resource: RESOURCE_PRESETS[ResourceTier.MEDIUM],
      config: {
        outputPath: DEFAULT_OUTPUT_PATH,
        scriptName: 'clean_raw_data.py'
      },
      progress: 0,
    },
  },
  {
    id: 'node-analysis',
    type: 'custom',
    position: { x: 500, y: 100 },
    data: {
      label: 'Analysis Model',
      type: 'analysis',
      status: JobStatus.IDLE,
      resource: RESOURCE_PRESETS[ResourceTier.GPU_SMALL],
      config: {
        inputPath: DEFAULT_OUTPUT_PATH,
        scriptName: 'train_model.py',
        outputPath: 's3://bucket/models/v1.pt'
      },
      progress: 0,
    },
  },
  {
    id: 'node-post-process',
    type: 'custom',
    position: { x: 900, y: 100 },
    data: {
      label: 'Data Post Process',
      type: 'post-process',
      status: JobStatus.IDLE,
      resource: RESOURCE_PRESETS[ResourceTier.MEDIUM],
      config: {
        inputPath: 's3://bucket/models/v1.pt',
        scriptName: 'evaluate_model.py',
        outputPath: 's3://bucket/reports/eval.json'
      },
      progress: 0,
    },
  },
  {
    id: 'node-serving',
    type: 'custom',
    position: { x: 1300, y: 100 },
    data: {
      label: 'Serving',
      type: 'serving',
      status: JobStatus.IDLE,
      resource: RESOURCE_PRESETS[ResourceTier.LARGE],
      config: {
        inputPath: 's3://bucket/reports/eval.json',
        scriptName: 'deploy_service.py',
        outputPath: 'endpoint://api.model-mesh.svc'
      },
      progress: 0,
    },
  },
  {
    id: 'node-drift',
    type: 'custom',
    position: { x: 1300, y: 400 },
    data: {
      label: 'Drift Detection',
      type: 'drift',
      status: JobStatus.IDLE,
      resource: RESOURCE_PRESETS[ResourceTier.SMALL],
      config: {
        inputPath: 'endpoint://api.model-mesh.svc',
        scriptName: 'monitor_drift.py',
        outputPath: 's3://bucket/alerts/drift.log'
      },
      progress: 0,
    },
  },
  {
    id: 'node-retraining',
    type: 'custom',
    position: { x: 900, y: 400 },
    data: {
      label: 'Retraining Trigger',
      type: 'retraining',
      status: JobStatus.IDLE,
      resource: RESOURCE_PRESETS[ResourceTier.GPU_LARGE],
      config: {
        inputPath: 's3://bucket/alerts/drift.log',
        scriptName: 'trigger_retrain.py',
        outputPath: 'trigger://pipeline-restart'
      },
      progress: 0,
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'node-prep', target: 'node-analysis', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e2-3', source: 'node-analysis', target: 'node-post-process', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e3-4', source: 'node-post-process', target: 'node-serving', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e4-5', source: 'node-serving', target: 'node-drift', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e5-6', source: 'node-drift', target: 'node-retraining', animated: true, style: { stroke: '#94a3b8' } },
  { 
    id: 'e-retrain-prep', 
    source: 'node-retraining', 
    target: 'node-prep', 
    animated: true, 
    type: 'smoothstep',
    style: { stroke: '#f97316', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' }
  },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [jobName, setJobName] = useState(`Job-${new Date().toISOString().slice(0, 10)}`);
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Scheduling State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    mode: 'IMMEDIATE',
    isActive: false
  });

  // Dropdown state for Add Node
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as globalThis.Node)) {
        setIsAddNodeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ 
        ...params, 
        animated: true, 
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        type: 'smoothstep' 
    }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((node: Node<NodeData>) => {
    setSelectedNodeId(node.id);
  }, []);

  const updateNodeData = (nodeId: string, updates: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );
  };

  const getUpstreamOutputPath = (nodeId: string): string | undefined => {
    const incomingEdges = edges.filter(e => e.target === nodeId);
    if (incomingEdges.length === 0) return undefined;
    // Just take the first one for simplicity in this demo
    const sourceNodeId = incomingEdges[0].source;
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    return sourceNode?.data.config.outputPath;
  };

  const runNodeSimulation = async (nodeId: string) => {
     updateNodeData(nodeId, { status: JobStatus.QUEUED, progress: 0 });
     await new Promise(r => setTimeout(r, 800)); // Queue time
     
     updateNodeData(nodeId, { status: JobStatus.INITIALIZING });
     await new Promise(r => setTimeout(r, 1500)); // Init time

     updateNodeData(nodeId, { status: JobStatus.PROCESSING });

     // Simulate progress
     for (let i = 0; i <= 100; i += 10) {
        updateNodeData(nodeId, { progress: i });
        await new Promise(r => setTimeout(r, 200));
     }

     updateNodeData(nodeId, { status: JobStatus.COMPLETED });
  };

  const runJob = async () => {
    setIsRunning(true);
    setJobId(`JOB-${Math.floor(Math.random() * 100000)}`);

    // Reset all statuses first
    setNodes((nds) => nds.map(n => ({
        ...n, 
        data: { ...n.data, status: JobStatus.IDLE, progress: 0 }
    })));

    // Simple execution engine: 
    // 1. Find nodes with no incoming edges (roots) - excluding feedback loops for simplicity or handling them carefully.
    // 2. Or, just topological sort.
    // For this demo, we will use a naive dependency walker.
    
    // Helper to get unfinished dependencies
    const getUnfinishedDeps = (nodeId: string, allNodes: AppNode[], allEdges: Edge[]) => {
        const incoming = allEdges.filter(e => e.target === nodeId);
        // We need to ignore "backwards" edges (feedback loops) to avoid deadlocks in a DAG assumption
        // For this demo, let's assume 'retraining' -> 'prep' is a feedback loop and ignore it for the initial run.
        const effectiveIncoming = incoming.filter(e => {
            const source = allNodes.find(n => n.id === e.source);
            return source && source.data.type !== 'retraining'; 
        });

        return effectiveIncoming.filter(e => {
            const source = allNodes.find(n => n.id === e.source);
            return source?.data.status !== JobStatus.COMPLETED;
        });
    };

    const processingQueue = new Set<string>();
    let activeNodes = 0;

    // Simulation Loop
    while (true) {
        let allComplete = true;
        let madeProgress = false;

        const currentNodes = await new Promise<AppNode[]>(resolve => {
            setNodes(prev => {
                resolve(prev);
                return prev;
            });
        });

        for (const node of currentNodes) {
            if (node.data.status === JobStatus.COMPLETED) continue;
            allComplete = false;

            if (node.data.status === JobStatus.PROCESSING || node.data.status === JobStatus.INITIALIZING || node.data.status === JobStatus.QUEUED) {
                activeNodes++;
                continue;
            }

            // Check dependencies
            const unfinished = getUnfinishedDeps(node.id, currentNodes, edges);
            
            if (unfinished.length === 0 && !processingQueue.has(node.id)) {
                // Dependencies met, start node
                processingQueue.add(node.id);
                madeProgress = true;
                
                // Fire and forget (the simulation updates state)
                runNodeSimulation(node.id).then(() => {
                    processingQueue.delete(node.id);
                });
            }
        }

        if (allComplete) break;
        await new Promise(r => setTimeout(r, 500));
    }

    setIsRunning(false);
  };

  const addNewNode = (type: NodeType) => {
    const id = `node-${Date.now()}`;
    const position = { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
    };
    
    let label = 'New Node';
    let resource = RESOURCE_PRESETS[ResourceTier.MEDIUM];
    let icon = Activity;

    switch(type) {
        case 'prep':
            label = 'Data Preparation';
            resource = RESOURCE_PRESETS[ResourceTier.MEDIUM];
            icon = Database;
            break;
        case 'analysis':
            label = 'Analysis Model';
            resource = RESOURCE_PRESETS[ResourceTier.GPU_SMALL];
            icon = BarChart3;
            break;
        case 'post-process': 
            label = 'Post Process'; 
            resource = RESOURCE_PRESETS[ResourceTier.MEDIUM];
            icon = Layers;
            break;
        case 'serving': 
            label = 'Model Serving'; 
            resource = RESOURCE_PRESETS[ResourceTier.LARGE];
            icon = Globe;
            break;
        case 'drift': 
            label = 'Drift Check'; 
            resource = RESOURCE_PRESETS[ResourceTier.SMALL];
            icon = ScanEye;
            break;
        case 'retraining': 
            label = 'Retrain Trigger'; 
            resource = RESOURCE_PRESETS[ResourceTier.GPU_LARGE];
            icon = RotateCcw;
            break;
    }

    const newNode: AppNode = {
        id,
        type: 'custom',
        position,
        data: {
            label,
            type,
            status: JobStatus.IDLE,
            resource,
            config: {
                outputPath: type === 'prep' ? 's3://new/output' : undefined,
                inputPath: type !== 'prep' ? 's3://upstream/input' : undefined
            },
            progress: 0
        }
    };

    setNodes((nds) => [...nds, newNode]);
    setIsAddNodeOpen(false);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const upstreamPath = selectedNodeId ? getUpstreamOutputPath(selectedNodeId) : undefined;

  const handleJobSubmit = () => {
    if (scheduleConfig.isActive && scheduleConfig.mode !== 'IMMEDIATE') {
        // Just show a toast or alert for demo
        alert(`Job Scheduled! Mode: ${scheduleConfig.mode}`);
    } else {
        runJob();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Box className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">PodFlow</h1>
            <p className="text-xs text-gray-500 font-medium">Orchestrator Demo</p>
          </div>
        </div>

        {/* Job Config Section */}
        <div className="flex items-center gap-4 flex-1 justify-center max-w-2xl">
             <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                <Hash size={14} className="text-gray-400" />
                <span className="text-xs font-mono text-gray-500">JOB NAME</span>
                <input 
                    type="text" 
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium text-gray-800 focus:ring-0 p-0 w-48"
                />
             </div>
             {jobId && (
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-100 animate-fade-in">
                    <Activity size={14} className="text-blue-500" />
                    <span className="text-xs font-mono text-blue-700 font-bold">{jobId}</span>
                 </div>
             )}
        </div>

        <div className="flex items-center gap-3">
          {/* Add Step Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsAddNodeOpen(!isAddNodeOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Plus size={16} />
                Add Step
                <ChevronDown size={14} className={`transition-transform ${isAddNodeOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isAddNodeOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in origin-top-right">
                    <div className="p-2 space-y-1">
                        <button onClick={() => addNewNode('prep')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                            <div className="p-1.5 bg-purple-100 text-purple-600 rounded-md"><Database size={16} /></div>
                            Data Preparation
                        </button>
                        <button onClick={() => addNewNode('analysis')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md"><BarChart3 size={16} /></div>
                            Analysis Model
                        </button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button onClick={() => addNewNode('post-process')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                            <div className="p-1.5 bg-teal-100 text-teal-600 rounded-md"><Layers size={16} /></div>
                            Data Post Process
                        </button>
                        <button onClick={() => addNewNode('serving')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                             <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md"><Globe size={16} /></div>
                            Serving
                        </button>
                        <button onClick={() => addNewNode('drift')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                             <div className="p-1.5 bg-rose-100 text-rose-600 rounded-md"><ScanEye size={16} /></div>
                            Drift Detection
                        </button>
                         <button onClick={() => addNewNode('retraining')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                             <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md"><RotateCcw size={16} /></div>
                            Retraining
                        </button>
                    </div>
                </div>
            )}
          </div>

          <button 
             onClick={() => setIsScheduleOpen(true)}
             className={`p-2 rounded-lg border transition-colors relative ${
                 scheduleConfig.isActive 
                 ? 'bg-blue-50 border-blue-200 text-blue-600' 
                 : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
             }`}
             title="Configure Schedule"
          >
             {scheduleConfig.isActive ? <CalendarClock size={20} /> : <Calendar size={20} />}
             {scheduleConfig.isActive && (
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
             )}
          </button>

          <button
            onClick={handleJobSubmit}
            disabled={isRunning}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white shadow-sm transition-all
              ${isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : scheduleConfig.isActive
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }
            `}
          >
            {isRunning ? (
                <>Running...</>
            ) : scheduleConfig.isActive ? (
                <>
                  <CalendarClock size={18} /> Schedule Job
                </>
            ) : (
                <>
                  <Play size={18} /> Submit Job
                </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <PipelineEditor
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onConnect={onConnect}
          />
        </div>
        
        {/* Resource Config Sidebar */}
        {selectedNode && (
          <div className="absolute right-0 top-16 bottom-0 z-20">
             <ResourceConfig 
                selectedNode={selectedNode} 
                onClose={() => setSelectedNodeId(null)}
                onUpdateNode={updateNodeData}
                upstreamOutputPath={upstreamPath}
                onRunNode={() => runNodeSimulation(selectedNode.id)}
                isGlobalRunning={isRunning}
             />
          </div>
        )}
      </div>

      <ScheduleModal 
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSave={setScheduleConfig}
        initialConfig={scheduleConfig}
      />
    </div>
  );
}
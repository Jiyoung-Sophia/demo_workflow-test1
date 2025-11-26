import React from 'react';
import { X, Server, Database, Activity, Cpu, FileCode, Play, Layers, Globe, ScanEye, RotateCcw } from 'lucide-react';
import { AppNode, ResourceTier, NodeType } from '../../types';
import { RESOURCE_PRESETS } from '../../constants';

interface ResourceConfigProps {
  selectedNode: AppNode | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<AppNode['data']>) => void;
  upstreamOutputPath?: string; // Generic upstream path
  onRunNode?: () => void;
  isGlobalRunning?: boolean;
}

const ResourceConfig: React.FC<ResourceConfigProps> = ({ 
  selectedNode, 
  onClose, 
  onUpdateNode,
  upstreamOutputPath,
  onRunNode,
  isGlobalRunning = false
}) => {
  if (!selectedNode) return null;

  const { data } = selectedNode;
  const isSource = data.type === 'prep'; // Prep is the main source
  const presets = Object.values(RESOURCE_PRESETS);

  const getIcon = (type: NodeType) => {
    switch (type) {
        case 'prep': return <Database size={20} />;
        case 'analysis': return <Activity size={20} />;
        case 'post-process': return <Layers size={20} />;
        case 'serving': return <Globe size={20} />;
        case 'drift': return <ScanEye size={20} />;
        case 'retraining': return <RotateCcw size={20} />;
        default: return <Activity size={20} />;
    }
  };

  const handleResourceChange = (tier: ResourceTier) => {
    onUpdateNode(selectedNode.id, {
      resource: RESOURCE_PRESETS[tier]
    });
  };

  const handleConfigChange = (value: string, key: 'inputPath' | 'outputPath' | 'scriptName') => {
    onUpdateNode(selectedNode.id, {
      config: { ...data.config, [key]: value }
    });
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 shadow-xl w-96 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gray-100 text-gray-600`}>
                {getIcon(data.type)}
            </div>
            <div>
                <h2 className="font-semibold text-gray-800">{data.label}</h2>
                <p className="text-xs text-gray-500">ID: {selectedNode.id}</p>
            </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Resource Selection */}
        <section>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Server size={16} /> Compute Resources
          </h3>
          <div className="grid gap-3">
            {presets.map((preset) => (
              <button
                key={preset.tier}
                onClick={() => handleResourceChange(preset.tier)}
                className={`
                  relative flex flex-col p-3 rounded-lg border-2 text-left transition-all
                  ${data.resource.tier === preset.tier 
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <span className="font-semibold text-sm text-gray-700">
                    {preset.tier.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono text-gray-500">${preset.costPerHour}/hr</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Cpu size={12}/> {preset.cpu}</span>
                  <span>{preset.memory}</span>
                  {preset.gpu && (
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {preset.gpu}
                    </span>
                  )}
                </div>
                {data.resource.tier === preset.tier && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Configuration */}
        <section>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
             Configuration
          </h3>
          <div className="space-y-4">
             {/* Script Name Input */}
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <FileCode size={12} /> Script Name
                </label>
                <input 
                    type="text" 
                    value={data.config.scriptName || ''}
                    onChange={(e) => handleConfigChange(e.target.value, 'scriptName')}
                    placeholder="e.g. process_data.py"
                    className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-gray-700"
                />
            </div>

            {isSource ? (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                        Output Data Path
                    </label>
                    <input 
                        type="text" 
                        value={data.config.outputPath || ''}
                        onChange={(e) => handleConfigChange(e.target.value, 'outputPath')}
                        className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                        Downstream nodes will read from this location.
                    </p>
                </div>
            ) : (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                        Input Data Path
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={data.config.inputPath || ''}
                            onChange={(e) => handleConfigChange(e.target.value, 'inputPath')}
                            className={`w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                upstreamOutputPath && data.config.inputPath === upstreamOutputPath 
                                ? 'border-green-300 bg-green-50 text-green-700' 
                                : 'border-gray-300'
                            }`}
                        />
                         {upstreamOutputPath && data.config.inputPath === upstreamOutputPath && (
                            <div className="absolute right-2 top-2.5 text-green-600 pointer-events-none">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-200 rounded">LINKED</span>
                            </div>
                        )}
                    </div>
                    {upstreamOutputPath && data.config.inputPath !== upstreamOutputPath && (
                        <button 
                            onClick={() => handleConfigChange(upstreamOutputPath, 'inputPath')}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                            Sync with Upstream Output
                        </button>
                    )}
                    
                    {/* Allow output path for intermediate nodes too, if they are not sinks */}
                    {data.type !== 'serving' && (
                        <div className="mt-4">
                             <label className="block text-xs font-medium text-gray-500 mb-1">
                                Output Data Path (Optional)
                            </label>
                            <input 
                                type="text" 
                                value={data.config.outputPath || ''}
                                onChange={(e) => handleConfigChange(e.target.value, 'outputPath')}
                                placeholder="Generated automatically if empty"
                                className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
          {onRunNode && (
             <button
               onClick={onRunNode}
               disabled={isGlobalRunning}
               className={`
                 flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 transition-colors flex items-center justify-center gap-1
                 ${isGlobalRunning 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                 }
               `}
             >
               <Play size={14} /> Test Run
             </button>
          )}
          <button 
            onClick={onClose}
            className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
      </div>
    </div>
  );
};

export default ResourceConfig;
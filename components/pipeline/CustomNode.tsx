import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Database, 
  BarChart3, 
  Settings, 
  Play, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Hourglass, 
  RefreshCw,
  Layers,
  Globe,
  ScanEye,
  RotateCcw
} from 'lucide-react';
import { NodeData, JobStatus, NodeType } from '../../types';

const StatusIcon = ({ status }: { status: JobStatus }) => {
  switch (status) {
    case JobStatus.QUEUED:
      return <Hourglass className="w-4 h-4 text-amber-500 animate-pulse" />;
    case JobStatus.INITIALIZING:
      return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />;
    case JobStatus.PROCESSING:
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    case JobStatus.COMPLETED:
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case JobStatus.FAILED:
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Play className="w-4 h-4 text-gray-300" />;
  }
};

const StatusLabel = ({ status }: { status: JobStatus }) => {
  const styles = {
    [JobStatus.IDLE]: 'text-gray-400',
    [JobStatus.QUEUED]: 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded',
    [JobStatus.INITIALIZING]: 'text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded',
    [JobStatus.PROCESSING]: 'text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded',
    [JobStatus.COMPLETED]: 'text-green-600 bg-green-50 px-1.5 py-0.5 rounded',
    [JobStatus.FAILED]: 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded',
  };

  if (status === JobStatus.IDLE) return null;

  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
};

const getNodeStyles = (type: NodeType) => {
  switch (type) {
    case 'prep':
      return { bg: 'bg-purple-100', text: 'text-purple-600', icon: Database };
    case 'analysis':
      return { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: BarChart3 };
    case 'post-process':
      return { bg: 'bg-teal-100', text: 'text-teal-600', icon: Layers };
    case 'serving':
      return { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: Globe };
    case 'drift':
      return { bg: 'bg-rose-100', text: 'text-rose-600', icon: ScanEye };
    case 'retraining':
      return { bg: 'bg-orange-100', text: 'text-orange-600', icon: RotateCcw };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', icon: Database };
  }
};

const CustomNode = ({ data, selected }: NodeProps<NodeData>) => {
  const style = getNodeStyles(data.type);
  const Icon = style.icon;

  return (
    <div 
      className={`
        relative w-64 bg-white rounded-lg shadow-sm border-2 transition-all duration-200
        ${selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${style.bg} ${style.text}`}>
            <Icon size={16} />
          </div>
          <span className="font-semibold text-gray-700 text-sm">{data.label}</span>
        </div>
        <div className="flex items-center gap-2">
            <StatusLabel status={data.status} />
            <StatusIcon status={data.status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Resource Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <span>{data.resource.cpu} / {data.resource.memory}</span>
          {data.resource.gpu && <span className="text-orange-600 font-medium">GPU</span>}
        </div>

        {/* Progress Bar (Visible when processing) */}
        {data.status === JobStatus.PROCESSING && (
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${data.progress}%` }}
            ></div>
          </div>
        )}
         {/* Initializing Spinner Bar (Indeterminate) */}
         {data.status === JobStatus.INITIALIZING && (
          <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden relative">
            <div className="absolute top-0 left-0 bottom-0 bg-indigo-400 w-1/3 animate-[shimmer_1s_infinite_linear] rounded-full"></div>
          </div>
        )}

        {/* Config Summary */}
        <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
          {data.type === 'prep' 
            ? `Out: ${data.config.outputPath}` 
            : `In: ${data.config.inputPath}`}
        </div>
      </div>

      {/* Action Footer */}
      <button 
        className="w-full py-2 text-xs font-medium text-gray-500 border-t border-gray-100 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 rounded-b-lg"
        onClick={(e) => {
          e.stopPropagation(); 
        }}
      >
        <Settings size={12} />
        Configure Resource
      </button>

      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-blue-400 !top-1/2 !-translate-y-1/2 !-left-1.5 border-2 border-white" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-blue-400 !top-1/2 !-translate-y-1/2 !-right-1.5 border-2 border-white" 
      />
      
      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default memo(CustomNode);
import { Node, Edge } from 'reactflow';

export enum JobStatus {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  INITIALIZING = 'INITIALIZING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ResourceTier {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  GPU_SMALL = 'GPU_SMALL',
  GPU_LARGE = 'GPU_LARGE',
}

export interface ResourceConfig {
  tier: ResourceTier;
  cpu: string;
  memory: string;
  gpu?: string;
  costPerHour: number;
}

export type NodeType = 'prep' | 'analysis' | 'post-process' | 'serving' | 'drift' | 'retraining';

export interface NodeData {
  label: string;
  type: NodeType;
  status: JobStatus;
  resource: ResourceConfig;
  config: {
    inputPath?: string;
    outputPath?: string;
    scriptName?: string;
  };
  progress: number; // 0-100
  // Helper to trigger UI updates
  onConfigClick?: (nodeId: string) => void;
}

export type AppNode = Node<NodeData>;
export type AppEdge = Edge;

// Scheduling Types
export type ScheduleMode = 'IMMEDIATE' | 'RECURRING' | 'SPECIFIC_TIME';

export interface ScheduleConfig {
  mode: ScheduleMode;
  recurring?: {
    intervalValue: number;
    intervalUnit: 'HOURS' | 'DAYS' | 'WEEKS';
    cronExpression?: string; // Optional for advanced users
  };
  specificTime?: string; // ISO Date String
  isActive: boolean;
}
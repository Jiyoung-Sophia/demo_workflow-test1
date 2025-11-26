import { ResourceConfig, ResourceTier } from './types';

export const RESOURCE_PRESETS: Record<ResourceTier, ResourceConfig> = {
  [ResourceTier.SMALL]: {
    tier: ResourceTier.SMALL,
    cpu: '2 vCPU',
    memory: '4 GB',
    costPerHour: 0.05,
  },
  [ResourceTier.MEDIUM]: {
    tier: ResourceTier.MEDIUM,
    cpu: '4 vCPU',
    memory: '16 GB',
    costPerHour: 0.20,
  },
  [ResourceTier.LARGE]: {
    tier: ResourceTier.LARGE,
    cpu: '8 vCPU',
    memory: '32 GB',
    costPerHour: 0.40,
  },
  [ResourceTier.GPU_SMALL]: {
    tier: ResourceTier.GPU_SMALL,
    cpu: '4 vCPU',
    memory: '16 GB',
    gpu: '1x NVIDIA T4',
    costPerHour: 0.90,
  },
  [ResourceTier.GPU_LARGE]: {
    tier: ResourceTier.GPU_LARGE,
    cpu: '16 vCPU',
    memory: '64 GB',
    gpu: '1x NVIDIA A100',
    costPerHour: 3.50,
  },
};

export const INITIAL_PREP_PATH = "s3://bucket/raw/data.csv";
export const DEFAULT_OUTPUT_PATH = "s3://bucket/processed/clean_data.parquet";

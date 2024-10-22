type CloudPlatform = 'gcp' | 'azure';
interface StorageResourceModel {
  region: string;
  cloudResource: string;
  cloudPlatform: CloudPlatform;
}

interface ResourceLocks {
  exclusive?: string;
  shared?: string[];
}

export interface SnapshotSummaryModel {
  id: string;
  name: string;
  description?: string;
  createdDate?: string;
  profileId?: string;
  storage?: StorageResourceModel[];
  secureMonitoringEnabled?: boolean;
  consentCode?: string;
  phsId?: string;
  cloudPlatform: CloudPlatform;
  dataProject?: string;
  storageAccount?: string;
  selfHosted?: boolean;
  globalFileIds?: boolean;
  tags?: string[];
  resourceLocks: ResourceLocks;
  duosId: string;
}

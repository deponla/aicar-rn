export interface CheckVersionRequest {
  platform: string;
  currentVersion: string;
}

export interface CheckVersionResponse {
  updateAvailable: boolean;
  latestVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
}

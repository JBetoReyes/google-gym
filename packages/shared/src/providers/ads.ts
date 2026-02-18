export interface AdProvider {
  initialize(): Promise<void>;
  showInterstitial(): Promise<void>;
  isReady(): boolean;
}

export interface AdConfig {
  clicksBetweenAds: number;
}

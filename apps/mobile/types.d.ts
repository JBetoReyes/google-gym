// Expose process.env for Expo (replaced at build time by Metro bundler)
declare const process: { env: Record<string, string | undefined> };

// Stub for deprecated expo-ads-admob (replaced by react-native-google-mobile-ads in a future migration)
declare module 'expo-ads-admob' {
  export const AdMobInterstitial: {
    setAdUnitID(id: string): void;
    requestAdAsync(opts?: { servePersonalizedAds?: boolean }): Promise<void>;
    showAdAsync(): Promise<void>;
  };
}

// Stub for lucide-react-native until @types package is available
declare module 'lucide-react-native' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';

  interface IconProps extends SvgProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }

  type Icon = (props: IconProps) => React.ReactElement;

  export const BarChart3: Icon;
  export const Dumbbell: Icon;
  export const History: Icon;
  export const Settings: Icon;
  export const Plus: Icon;
  export const X: Icon;
  export const Trash2: Icon;
  export const Pencil: Icon;
  export const Play: Icon;
  export const CheckCircle: Icon;
  export const Timer: Icon;
  export const Trophy: Icon;
  export const Zap: Icon;
  export const Search: Icon;
  export const ListFilter: Icon;
  export const GripVertical: Icon;
  export const Save: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Target: Icon;
  export const Activity: Icon;
  export const Clock: Icon;
  export const TrendingUp: Icon;
  export const LogIn: Icon;
  export const LogOut: Icon;
  // add more as needed
}

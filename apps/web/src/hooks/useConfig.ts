import { useEffect, useState } from 'react';
import { api } from '@/services/api';

interface AppConfig {
  ad_frequency: { clicks_between_ads: number };
  free_routine_limit: { max_routines: number };
  free_stats_limit: { basic_only: boolean };
}

const DEFAULTS: AppConfig = {
  ad_frequency: { clicks_between_ads: 5 },
  free_routine_limit: { max_routines: 3 },
  free_stats_limit: { basic_only: true },
};

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULTS);

  useEffect(() => {
    api
      .get<AppConfig>('/config')
      .then(setConfig)
      .catch(() => {/* use defaults */});
  }, []);

  return config;
}

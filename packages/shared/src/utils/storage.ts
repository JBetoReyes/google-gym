/** localStorage / AsyncStorage key constants */
export const STORAGE_KEYS = {
  LANG:             'gym_lang',
  ROUTINES:         'gym_routines',
  HISTORY:          'gym_history',
  WEEKLY_GOAL:      'gym_weekly_goal',
  CUSTOM_EXERCISES: 'gym_custom_exercises',
  ACTIVE_WORKOUT:   'gym_active_workout',
  REST_TIMER:       'gym_rest_timer',
  EXERCISE_BUTTONS: 'gym_exercise_btns',
  AD_CLICK_COUNT:   'gym_ad_clicks',
  SYNCED:           'gym_synced',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

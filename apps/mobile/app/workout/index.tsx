/**
 * Active workout screen — full screen modal.
 * TODO: Migrate ActiveWorkoutView to React Native.
 * Mobile-specific: expo-haptics for vibration, useRestTimer for push notifications.
 * Reference: FEATURES.md §8 Active Workout View
 */
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function WorkoutScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-400">Active Workout — migration in progress</Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * Routines tab.
 * TODO: Migrate RoutinesView to React Native.
 * Reference: FEATURES.md §6 Routines View
 */
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function RoutinesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-400">Routines — migration in progress</Text>
      </View>
    </SafeAreaView>
  );
}

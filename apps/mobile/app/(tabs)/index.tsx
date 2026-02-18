/**
 * Dashboard tab.
 * TODO: Migrate DashboardView to React Native using Victory Native charts.
 * Reference: FEATURES.md §5 Dashboard View
 */
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-400">Dashboard — migration in progress</Text>
      </View>
    </SafeAreaView>
  );
}

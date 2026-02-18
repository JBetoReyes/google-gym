/**
 * History tab.
 * TODO: Migrate HistoryView to React Native.
 * Reference: FEATURES.md §9 History View
 */
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-400">History — migration in progress</Text>
      </View>
    </SafeAreaView>
  );
}

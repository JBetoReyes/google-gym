/**
 * CelebrationModal — shown when the user meets their weekly workout goal.
 * Trophy bounces via Animated API (native driver — no layout pass).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Lang } from '@shared/types/user';

interface Props {
  visible: boolean;
  lang: Lang;
  weeklyGoal: number;
  onClose: () => void;
}

export default function CelebrationModal({ visible, lang, weeklyGoal, onClose }: Props) {
  const bounce = useRef(new Animated.Value(0)).current;
  const fade   = useRef(new Animated.Value(0)).current;

  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  };

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      bounce.setValue(0);
      return;
    }
    // Fade in backdrop + card
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();

    // Bounce trophy: drop in from above then settle
    bounce.setValue(-60);
    Animated.spring(bounce, {
      toValue: 0,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          opacity: fade,
        }}
      >
        <Pressable
          style={{ position: 'absolute', inset: 0 } as never}
          onPress={onClose}
        />

        <View
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: '#0f172a',
            borderRadius: 28,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(234,179,8,0.25)',
          }}
        >
          {/* Close */}
          <Pressable
            onPress={onClose}
            style={{ position: 'absolute', top: 16, right: 16, padding: 6 }}
          >
            <X size={20} color="#64748b" />
          </Pressable>

          {/* Bouncing trophy */}
          <Animated.Text
            style={{
              fontSize: 72,
              marginBottom: 16,
              transform: [{ translateY: bounce }],
            }}
          >
            🏆
          </Animated.Text>

          {/* Title */}
          <Text
            style={{
              color: '#fbbf24',
              fontWeight: '900',
              fontSize: 22,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {t('goal_met_title')}
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              color: '#94a3b8',
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            {t('goal_met_desc')}
          </Text>

          {/* Achievement pill */}
          <View
            style={{
              backgroundColor: 'rgba(234,179,8,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(234,179,8,0.3)',
              borderRadius: 999,
              paddingHorizontal: 20,
              paddingVertical: 8,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: '#fbbf24', fontWeight: '700', fontSize: 13 }}>
              🎯 {weeklyGoal}/{weeklyGoal} {t('workouts_completed')}
            </Text>
          </View>

          {/* CTA button */}
          <Pressable
            onPress={onClose}
            style={{
              width: '100%',
              backgroundColor: '#ca8a04',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {t('confirm')} 💪
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

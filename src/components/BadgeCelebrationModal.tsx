import { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { GAME_CONFIG } from '@/game/config';
import type { BadgeDef } from '@/game/config';

function getBadgeName(id: BadgeDef['id']): string {
  return t.goals[`badge_${id}` as keyof typeof t.goals] as string;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface BadgeCelebrationModalProps {
  visible: boolean;
  badgeId: BadgeDef['id'] | null;
  achievedAt: number;
  onDismiss: () => void;
}

export function BadgeCelebrationModal({
  visible,
  badgeId,
  achievedAt,
  onDismiss,
}: BadgeCelebrationModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const def = badgeId ? GAME_CONFIG.badges.find((b) => b.id === badgeId) : null;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!def) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Corner sparkles */}
          <Text style={[styles.sparkle, styles.sparkleTL]}>🎉</Text>
          <Text style={[styles.sparkle, styles.sparkleTR]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkleBL]}>⭐</Text>
          <Text style={[styles.sparkle, styles.sparkleBR]}>🎊</Text>

          {/* Badge emoji over medal backdrop */}
          <View style={styles.emojiStack}>
            <Text style={styles.medalEmoji}>🏅</Text>
            <Text style={styles.badgeEmoji}>{def.emoji}</Text>
          </View>

          {/* Headline */}
          <Text style={styles.title}>{t.badge.unlocked}</Text>

          {/* Badge name */}
          <Text style={styles.badgeName}>{getBadgeName(def.id)}</Text>

          {/* Token reward pill */}
          <View style={styles.rewardPill}>
            <Text style={styles.rewardText}>{t.badge.tokensEarned(def.tokenReward)}</Text>
          </View>

          {/* Achievement date */}
          <Text style={styles.dateText}>
            {t.goals.badgeAchievedAt(formatDate(achievedAt))}
          </Text>

          {/* CTA */}
          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{t.badge.celebrate}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFDE7',
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: '#FFD54F',
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#F9A825',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 14,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 22,
  },
  sparkleTL: { top: 14, left: 18 },
  sparkleTR: { top: 14, right: 18 },
  sparkleBL: { bottom: 64, left: 14 },
  sparkleBR: { bottom: 64, right: 14 },
  emojiStack: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  medalEmoji: {
    fontSize: 72,
  },
  badgeEmoji: {
    fontSize: 32,
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  title: {
    ...typography.heading1,
    color: '#E65100',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  badgeName: {
    ...typography.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  rewardPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  rewardText: {
    ...typography.bodyBold,
    color: '#2E7D32',
    fontSize: 16,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: '#E65100',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 18,
  },
});

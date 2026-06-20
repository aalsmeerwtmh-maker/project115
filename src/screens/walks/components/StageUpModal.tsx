import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

interface StageDisplay {
  emoji: string;
  bg: string;
  accent: string;
  border: string;
}

const STAGE_DISPLAY: Record<string, StageDisplay> = {
  child: { emoji: '🌱', bg: '#F1F8E9', accent: '#33691E', border: '#AED581' },
  adult: { emoji: '🌟', bg: '#FFFDE7', accent: '#E65100', border: '#FFE082' },
  elder: { emoji: '👑', bg: '#FFF8E1', accent: '#BF360C', border: '#FFCC02' },
};

export interface StageUpModalProps {
  visible: boolean;
  newStage: 'child' | 'adult' | 'elder';
  petName: string;
  onDismiss: () => void;
}

function getStageMessage(stage: 'child' | 'adult' | 'elder'): string {
  if (stage === 'child') return t.stageUp.child;
  if (stage === 'adult') return t.stageUp.adult;
  return t.stageUp.elder;
}

export function StageUpModal({ visible, newStage, petName, onDismiss }: StageUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const display = STAGE_DISPLAY[newStage] ?? STAGE_DISPLAY['child']!;
  const stageName = t.profile.petStage(newStage);

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
            { backgroundColor: display.bg, borderColor: display.border },
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={[styles.sparkle, styles.sparkleTL]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkleTR]}>⭐</Text>
          <Text style={[styles.sparkle, styles.sparkleBL]}>🌟</Text>
          <Text style={[styles.sparkle, styles.sparkleBR]}>✨</Text>

          <Text style={styles.stageEmoji}>{display.emoji}</Text>

          <Text style={[styles.levelUpTitle, { color: display.accent }]}>
            {t.stageUp.levelUp}
          </Text>

          <Text style={styles.evolvedText}>
            {t.stageUp.evolvedInto(petName, stageName)}
          </Text>

          <Text style={styles.message}>{getStageMessage(newStage)}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: display.accent }]}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{t.stageUp.celebrate}</Text>
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
    borderRadius: radius.lg,
    borderWidth: 3,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  sparkleTL: { top: 12, left: 16 },
  sparkleTR: { top: 12, right: 16 },
  sparkleBL: { bottom: 60, left: 12 },
  sparkleBR: { bottom: 60, right: 12 },
  stageEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  levelUpTitle: {
    ...typography.heading1,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  evolvedText: {
    ...typography.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  button: {
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

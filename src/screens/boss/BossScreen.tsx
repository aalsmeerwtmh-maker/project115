import { useState, useEffect, useCallback, useRef } from 'react';
import { Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePetStore } from '@/stores/petStore';
import { useProgressStore } from '@/stores/progressStore';
import { getAvailableBosses, attemptBoss } from '@/game/bosses';
import {
  getBossEvents,
  insertBossEvent,
  insertStoryEvent,
  resolveEvent,
} from '@/db/repositories/events';
import { generateId } from '@/utils/id';
import { BossCard } from './components/BossCard';
import { BossResultModal } from './components/BossResultModal';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { en } from '@/i18n/en';
import type { BossDefinition } from '@/game/config';
import type { Event } from '@/db/schema';
import type { BossPayload } from '@/db/repositories/events';

interface ModalState {
  visible: boolean;
  won: boolean;
  tokensEarned: number;
  dialogueLine: string;
  storyEventId: string | null;
}

const EMPTY_MODAL: ModalState = {
  visible: false,
  won: false,
  tokensEarned: 0,
  dialogueLine: '',
  storyEventId: null,
};

export function BossScreen() {
  const activePet = usePetStore((s) => s.activePet);
  const streakCurrent = useProgressStore((s) => s.streakCurrent);
  const addTokens = useProgressStore((s) => s.addTokens);

  const [bossEvents, setBossEvents] = useState<Event[]>([]);
  const [modal, setModal] = useState<ModalState>(EMPTY_MODAL);
  const [challengingId, setChallengingId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refresh the "current time" every 30 seconds so cooldown countdowns stay accurate.
  useEffect(() => {
    clockRef.current = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  const loadBossEvents = useCallback(async () => {
    try {
      const rows = await getBossEvents();
      setBossEvents(rows);
    } catch {
      setBossEvents([]);
    }
  }, []);

  useEffect(() => {
    getBossEvents()
      .then(setBossEvents)
      .catch(() => setBossEvents([]));
  }, []);

  function isDefeated(bossId: string): boolean {
    return bossEvents.some((e) => {
      const p = JSON.parse(e.payload) as BossPayload;
      return p.bossId === bossId && e.resolved === true;
    });
  }

  function getRetryUntil(bossId: string): number | null {
    const lossRow = bossEvents.find((e) => {
      const p = JSON.parse(e.payload) as BossPayload;
      return p.bossId === bossId && e.resolved === false;
    });
    if (!lossRow) return null;
    const p = JSON.parse(lossRow.payload) as BossPayload;
    return p.retryUntil ?? null;
  }

  async function handleChallenge(boss: BossDefinition): Promise<void> {
    if (!activePet) return;
    setChallengingId(boss.id);

    try {
      const result = attemptBoss(boss, activePet, streakCurrent);
      const eventId = generateId();

      const payload: BossPayload = {
        bossId: boss.id,
        won: result.won,
        tokensEarned: result.tokensEarned,
        ...(!result.won && {
          retryUntil: Date.now() + boss.retryBlockHours * 3_600_000,
        }),
        petSnapshot: {
          stamina: activePet.stamina,
          growthValue: activePet.growthValue,
          stage: activePet.stage,
          streakDays: streakCurrent,
        },
      };

      await insertBossEvent(eventId, payload, result.won);

      let storyEventId: string | null = null;

      if (result.won) {
        await addTokens(result.tokensEarned);
        storyEventId = generateId();
        await insertStoryEvent(storyEventId, {
          bossId: boss.id,
          dialogueLine: result.dialogueLine,
        });
      }

      await loadBossEvents();

      setModal({
        visible: true,
        won: result.won,
        tokensEarned: result.tokensEarned,
        dialogueLine: result.dialogueLine,
        storyEventId,
      });
    } finally {
      setChallengingId(null);
    }
  }

  async function handleModalClose(): Promise<void> {
    // Mark the transient story event as resolved when the player dismisses the modal.
    if (modal.storyEventId) {
      try {
        await resolveEvent(modal.storyEventId);
      } catch {
        // Non-fatal: the permanent boss event is unaffected.
      }
    }
    setModal(EMPTY_MODAL);
  }

  if (!activePet) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.heading}>{en.boss.title}</Text>
        <Text style={styles.emptyText}>No active pet found.</Text>
      </SafeAreaView>
    );
  }

  const bosses = getAvailableBosses(activePet);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={bosses}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.heading}>{en.boss.title}</Text>}
        renderItem={({ item: boss }) => (
          <BossCard
            boss={boss}
            pet={activePet}
            streakDays={streakCurrent}
            defeated={isDefeated(boss.id)}
            retryUntilMs={getRetryUntil(boss.id)}
            nowMs={nowMs}
            onChallenge={() => {
              handleChallenge(boss);
            }}
            loading={challengingId === boss.id}
          />
        )}
      />

      <BossResultModal
        visible={modal.visible}
        won={modal.won}
        tokensEarned={modal.tokensEarned}
        dialogueLine={modal.dialogueLine}
        onClose={handleModalClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heading: {
    ...typography.heading1,
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    margin: spacing.md,
  },
});

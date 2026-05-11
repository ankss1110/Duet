import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SectionList,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useDuet } from "@/hooks/useDuet";
import { PROMPTS } from "@/constants/prompts";
import type { HistoryItem } from "@/lib/api";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

type DayData = {
  date: Date;
  dateKey: string;
  rounds: HistoryItem[];
  isToday: boolean;
  isBeforeStart: boolean;
  isFuture: boolean;
};

type WeekRow = DayData[];

type MonthSection = {
  title: string;
  monthKey: string;
  data: WeekRow[];
};

function buildCalendar(createdAt: string, history: HistoryItem[]): MonthSection[] {
  // Group rounds by date — multiple rounds can land on the same calendar day
  const roundsByDate = new Map<string, HistoryItem[]>();
  for (const item of history) {
    if (item.completedAt) {
      const key = item.completedAt.slice(0, 10);
      if (!roundsByDate.has(key)) roundsByDate.set(key, []);
      roundsByDate.get(key)!.push(item);
    }
  }

  const startDate = startOfDay(new Date(createdAt));
  const today = startOfDay(new Date());

  // Extend 6 months into the future
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 6);
  // Always end on a Saturday to complete the last week row
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  // Rewind to Sunday before the duet start
  const calStart = new Date(startDate);
  calStart.setDate(calStart.getDate() - calStart.getDay());

  const months: MonthSection[] = [];
  let currentMonth: MonthSection | null = null;
  let currentWeek: WeekRow = [];

  const cur = new Date(calStart);
  const todayKey = toDateKey(today);

  while (cur <= endDate) {
    const monthKey = `${cur.getFullYear()}-${cur.getMonth()}`;

    if (!currentMonth || currentMonth.monthKey !== monthKey) {
      // Pad current week to 7 before starting new month
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          const pad = new Date(cur);
          currentWeek.push({
            date: pad,
            dateKey: toDateKey(pad),
            rounds: [],
            isToday: toDateKey(pad) === todayKey,
            isBeforeStart: pad < startDate,
            isFuture: pad > today,
          });
          cur.setDate(cur.getDate() + 1);
        }
        currentMonth!.data.push(currentWeek);
        currentWeek = [];
      }
      currentMonth = {
        title: new Date(cur).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        monthKey,
        data: [],
      };
      months.push(currentMonth);
    }

    const dateKey = toDateKey(cur);
    const isBeforeStart = cur < startDate;
    const isFuture = cur > today;
    const isToday = dateKey === todayKey;

    currentWeek.push({
      date: new Date(cur),
      dateKey,
      rounds: isBeforeStart || isFuture ? [] : (roundsByDate.get(dateKey) ?? []),
      isToday,
      isBeforeStart,
      isFuture,
    });

    if (currentWeek.length === 7) {
      currentMonth.data.push(currentWeek);
      currentWeek = [];
    }

    cur.setDate(cur.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    currentMonth?.data.push(currentWeek);
  }

  return months;
}

export default function CalendarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: duet, isLoading } = useDuet(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const sections = useMemo(() => {
    if (!duet) return [];
    return buildCalendar(duet.duetCreatedAt, duet.history);
  }, [duet]);

  if (isLoading || !duet) return null;

  const totalAnswered = duet.history.length;

  const renderDayCell = (day: DayData) => {
    const count = day.rounds.length;
    const hasRound = count > 0;
    const { isToday, isBeforeStart, isFuture } = day;
    const isInvisible = isBeforeStart;
    const tappable = hasRound && !isBeforeStart && !isFuture;

    // Visual state
    let circleStyle: object = {};
    let numberColor = colors.mutedForeground;
    let numberWeight = "Inter_400Regular";

    if (isInvisible) {
      // Cells before duet started: completely hidden
    } else if (isToday) {
      // Today: sage/secondary filled, bolder number
      circleStyle = { backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.primary };
      numberColor = colors.primary;
      numberWeight = "Inter_700Bold";
    } else if (hasRound) {
      // Answered day: terracotta primary fill
      circleStyle = { backgroundColor: colors.primary };
      numberColor = colors.primaryForeground;
      numberWeight = "Inter_600SemiBold";
    } else if (isFuture) {
      // Future: no fill, very faint number
      numberColor = colors.border;
    }
    // else: past unanswered — just muted number, no fill

    return (
      <Pressable
        key={day.dateKey}
        onPress={() => tappable && setSelectedDay(day)}
        style={styles.dayCell}
        disabled={!tappable}
      >
        <View
          style={[
            styles.dayCircle,
            circleStyle,
            isInvisible && { opacity: 0 },
          ]}
        >
          <Text style={[styles.dayNumber, { color: numberColor, fontFamily: numberWeight as any }]}>
            {day.date.getDate()}
          </Text>

          {/* Prompt count badge — shown when > 1 round on the same day */}
          {hasRound && count > 1 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primaryForeground }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>{count}</Text>
            </View>
          )}
        </View>

        {/* Single dot under answered days */}
        {hasRound && !isToday && (
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        )}
        {/* Today indicator dot (different color) */}
        {isToday && !hasRound && (
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (isWeb ? 67 : 20), borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.miniAvatar, { backgroundColor: duet.partnerAvatarColor }]}>
            <Feather name={duet.partnerAvatarIcon as any} size={14} color="#fff" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {duet.partnerName}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats row */}
      <Animated.View
        entering={FadeIn.delay(80)}
        style={[styles.statsRow, { borderBottomColor: colors.border }]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{duet.streak}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>streak</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{totalAnswered}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>answered</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {Math.floor(
              (Date.now() - new Date(duet.duetCreatedAt).getTime()) / (1000 * 60 * 60 * 24) + 1,
            )}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>days together</Text>
        </View>
      </Animated.View>

      {/* Day-of-week header — sticky */}
      <View style={[styles.dowRow, { borderBottomColor: colors.border }]}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={[styles.dowLabel, { color: colors.mutedForeground }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar */}
      <SectionList
        sections={sections}
        keyExtractor={(week, idx) => `week-${idx}`}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        renderSectionHeader={({ section }) => (
          <View style={[styles.monthHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item: week }) => (
          <View style={styles.weekRow}>{week.map(renderDayCell)}</View>
        )}
      />

      {/* Legend */}
      <View
        style={[
          styles.legend,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>answered</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendCircle,
              {
                backgroundColor: colors.secondary,
                borderWidth: 2,
                borderColor: colors.primary,
              },
            ]}
          />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: "transparent" }]}>
            <Text style={[styles.legendFutureNum, { color: colors.border }]}>9</Text>
          </View>
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>upcoming</Text>
        </View>
      </View>

      {/* Day detail modal */}
      <Modal
        visible={!!selectedDay}
        transparent
        animationType="none"
        onRequestClose={() => setSelectedDay(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDay(null)}>
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            style={[
              styles.modalSheet,
              { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHandleRow}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              </View>

              <Text style={[styles.sheetDate, { color: colors.mutedForeground }]}>
                {selectedDay?.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 420 }}
                contentContainerStyle={{ gap: 20, paddingBottom: 8 }}
              >
                {selectedDay?.rounds.map((round, i) => {
                  const prompt = PROMPTS[round.promptIndex % PROMPTS.length];
                  return (
                    <View key={round.roundId} style={styles.sheetRound}>
                      {selectedDay.rounds.length > 1 && (
                        <Text style={[styles.sheetRoundNum, { color: colors.mutedForeground }]}>
                          Prompt {i + 1}
                        </Text>
                      )}
                      <Text style={[styles.sheetPrompt, { color: colors.foreground }]}>
                        {prompt.prompt}
                      </Text>

                      <View
                        style={[styles.responseCard, { backgroundColor: colors.secondary }]}
                      >
                        <Text
                          style={[styles.responseOwner, { color: colors.secondaryForeground }]}
                        >
                          You
                        </Text>
                        <Text style={[styles.responseText, { color: colors.foreground }]}>
                          {round.myResponse}
                        </Text>
                        {round.myReaction && (
                          <Text style={styles.reactionText}>{round.myReaction}</Text>
                        )}
                      </View>

                      <View style={[styles.responseCard, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.responseOwner, { color: colors.mutedForeground }]}>
                          {duet.partnerName}
                        </Text>
                        <Text style={[styles.responseText, { color: colors.foreground }]}>
                          {round.partnerResponse}
                        </Text>
                        {round.partnerReaction && (
                          <Text style={styles.reactionText}>{round.partnerReaction}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <Pressable
                onPress={() => setSelectedDay(null)}
                style={[styles.closeButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.closeButtonText, { color: colors.primaryForeground }]}>
                  Close
                </Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const CELL_SIZE = 42;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Fraunces_600SemiBold", fontSize: 18 },

  statsRow: {
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontFamily: "Fraunces_700Bold", fontSize: 30 },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },

  dowRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dowLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  monthHeader: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 6,
  },
  monthTitle: { fontFamily: "Fraunces_600SemiBold", fontSize: 19 },

  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    gap: 4,
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 14,
  },
  countBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendCircle: { width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  legendFutureNum: { fontFamily: "Inter_400Regular", fontSize: 9 },
  legendText: { fontFamily: "Inter_400Regular", fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    gap: 16,
  },
  sheetHandleRow: { alignItems: "center", marginBottom: 8 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2 },
  sheetDate: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sheetRound: { gap: 10 },
  sheetRoundNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sheetPrompt: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 21,
    lineHeight: 29,
  },
  responseCard: {
    padding: 14,
    borderRadius: 14,
    gap: 6,
  },
  responseOwner: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  responseText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  reactionText: { fontSize: 18 },
  closeButton: {
    padding: 16,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 4,
  },
  closeButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
});

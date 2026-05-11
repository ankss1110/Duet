import React, { useMemo, useRef, useState } from "react";
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
import Animated, { FadeIn, FadeInUp, SlideInDown } from "react-native-reanimated";

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
  round: HistoryItem | null;
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
  const roundByDate = new Map<string, HistoryItem>();
  for (const item of history) {
    if (item.completedAt) {
      roundByDate.set(item.completedAt.slice(0, 10), item);
    }
  }

  const startDate = startOfDay(new Date(createdAt));
  const today = startOfDay(new Date());

  // Extend a bit into the future so today is always visible
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 6);

  // Rewind to Sunday before start
  const calStart = new Date(startDate);
  calStart.setDate(calStart.getDate() - calStart.getDay());

  const months: MonthSection[] = [];
  let currentMonth: MonthSection | null = null;
  let currentWeek: WeekRow = [];

  const cur = new Date(calStart);

  while (cur <= endDate) {
    const monthKey = `${cur.getFullYear()}-${cur.getMonth()}`;

    if (!currentMonth || currentMonth.monthKey !== monthKey) {
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          const pad = new Date(cur);
          currentWeek.push({
            date: pad,
            dateKey: toDateKey(pad),
            round: null,
            isToday: false,
            isBeforeStart: true,
            isFuture: true,
          });
          cur.setDate(cur.getDate() + 1);
        }
        currentMonth!.data.push(currentWeek);
        currentWeek = [];
      }
      currentMonth = {
        title: cur.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        monthKey,
        data: [],
      };
      months.push(currentMonth);
    }

    const dateKey = toDateKey(cur);
    const isBeforeStart = cur < startDate;
    const isFuture = cur > today;
    const isToday = toDateKey(cur) === toDateKey(today);

    currentWeek.push({
      date: new Date(cur),
      dateKey,
      round: isBeforeStart || isFuture ? null : (roundByDate.get(dateKey) ?? null),
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

  const selectedPrompt = selectedDay?.round
    ? PROMPTS[selectedDay.round.promptIndex % PROMPTS.length]
    : null;

  const totalDays = duet.history.length;

  const renderDayCell = (day: DayData) => {
    const hasRound = !!day.round;
    const isToday = day.isToday;
    const isBlank = day.isBeforeStart || day.isFuture;

    return (
      <Pressable
        key={day.dateKey}
        onPress={() => !isBlank && hasRound && setSelectedDay(day)}
        style={[styles.dayCell]}
        disabled={isBlank || !hasRound}
      >
        <View
          style={[
            styles.dayCircle,
            hasRound && { backgroundColor: colors.primary },
            isToday && !hasRound && { borderWidth: 2, borderColor: colors.primary },
            isBlank && { opacity: 0 },
          ]}
        >
          {!isBlank && (
            <Text
              style={[
                styles.dayNumber,
                { color: hasRound ? colors.primaryForeground : colors.mutedForeground },
                isToday && !hasRound && { color: colors.primary, fontFamily: "Inter_700Bold" },
              ]}
            >
              {day.date.getDate()}
            </Text>
          )}
        </View>
        {hasRound && (
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
        entering={FadeIn.delay(100)}
        style={[styles.statsRow, { borderBottomColor: colors.border }]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{duet.streak}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>streak</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{totalDays}</Text>
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

      {/* Day of week header */}
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
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
        }}
        renderSectionHeader={({ section }) => (
          <View style={[styles.monthHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item: week }) => (
          <View style={styles.weekRow}>
            {week.map(renderDayCell)}
          </View>
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
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
            prompt answered
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.primary },
            ]}
          />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>today</Text>
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
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Handle */}
              <View style={styles.sheetHandleRow}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              </View>

              {/* Date */}
              <Text style={[styles.sheetDate, { color: colors.mutedForeground }]}>
                {selectedDay?.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>

              {/* Prompt */}
              {selectedPrompt && (
                <Text style={[styles.sheetPrompt, { color: colors.foreground }]}>
                  {selectedPrompt.prompt}
                </Text>
              )}

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 360 }}
                contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
              >
                {/* Your response */}
                <View style={[styles.responseCard, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.responseOwner, { color: colors.secondaryForeground }]}>
                    You
                  </Text>
                  <Text style={[styles.responseText, { color: colors.foreground }]}>
                    {selectedDay?.round?.myResponse}
                  </Text>
                  {selectedDay?.round?.myReaction && (
                    <Text style={styles.reactionText}>{selectedDay.round.myReaction}</Text>
                  )}
                </View>

                {/* Partner response */}
                <View style={[styles.responseCard, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.responseOwner, { color: colors.mutedForeground }]}>
                    {duet.partnerName}
                  </Text>
                  <Text style={[styles.responseText, { color: colors.foreground }]}>
                    {selectedDay?.round?.partnerResponse}
                  </Text>
                  {selectedDay?.round?.partnerReaction && (
                    <Text style={styles.reactionText}>{selectedDay.round.partnerReaction}</Text>
                  )}
                </View>
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

const CELL_SIZE = 44;

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
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontFamily: "Fraunces_700Bold", fontSize: 32 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },

  dowRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
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
    paddingTop: 24,
    paddingBottom: 8,
  },
  monthTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 20,
  },

  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    gap: 3,
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontFamily: "Inter_400Regular", fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
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
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sheetPrompt: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 22,
    lineHeight: 30,
  },
  responseCard: {
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  responseOwner: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  responseText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  reactionText: { fontSize: 20 },
  closeButton: {
    padding: 16,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
});

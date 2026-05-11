import { useRouter } from "expo-router";
import { StyleSheet, Text, View, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDuets } from "@/hooks/useDuet";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { formatTimeLeft } from "@/utils/time";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  const { data: duets, isLoading } = useDuets();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isWeb = Platform.OS === "web";

  if (authLoading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!user) {
    return <Redirect href="/setup" />;
  }

  if (isLoading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.secondary }]}>
        <Feather name="feather" size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No duets yet</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        Start a shared journal with someone you care about, or join one they started.
      </Text>
      <View style={styles.emptyActions}>
        <Pressable
          onPress={() => router.push("/new")}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            Start a duet
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/join")}
          style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="link" size={20} color={colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            Join with a code
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={duets || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (isWeb ? 34 : 20),
          paddingTop: 16,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          duets && duets.length > 0 ? (
            <Pressable
              onPress={() => router.push("/join")}
              style={[styles.joinBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="link" size={16} color={colors.primary} />
              <Text style={[styles.joinBannerText, { color: colors.primary }]}>
                Join with a code
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const isYourTurn = !item.myResponse;
          const isWaiting = item.myResponse && !item.revealed;
          const isRevealed = item.revealed;
          const waitingForPartner = !item.partnerJoined;

          let statusText = "Your turn";
          if (waitingForPartner) statusText = "Waiting for them to join";
          else if (isWaiting) statusText = "Waiting for their answer";
          else if (isRevealed) statusText = "Ready to read";

          return (
            <Pressable
              onPress={() => router.push(`/session/${item.id}`)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarRow}>
                  <View style={[styles.avatar, { backgroundColor: item.partnerAvatarColor }]}>
                    <Feather name={item.partnerAvatarIcon as any} size={20} color="#fff" />
                  </View>
                  <Text style={[styles.partnerName, { color: colors.foreground }]}>
                    {item.partnerName}
                  </Text>
                </View>
                {item.streak > 0 && (
                  <View style={[styles.streakBadge, { backgroundColor: colors.secondary }]}>
                    <Feather name="zap" size={14} color={colors.primary} />
                    <Text style={[styles.streakText, { color: colors.primary }]}>
                      {item.streak}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        isYourTurn && !waitingForPartner ? colors.primary : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          isYourTurn && !waitingForPartner
                            ? colors.primaryForeground
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {statusText}
                  </Text>
                </View>
                {!waitingForPartner && (
                  <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                    {formatTimeLeft(new Date(item.currentPromptStartedAt).getTime())}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      {duets && duets.length > 0 && (
        <Pressable
          onPress={() => router.push("/new")}
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              bottom: insets.bottom + 24,
            },
          ]}
        >
          <Feather name="plus" size={24} color={colors.primaryForeground} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyActions: {
    gap: 12,
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  joinBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  joinBannerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerName: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 20,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 4,
  },
  streakText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  timeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
});

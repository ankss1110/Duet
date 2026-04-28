import { useRouter } from "expo-router";
import { StyleSheet, Text, View, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSessions } from "@/hooks/useDuet";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { formatTimeLeft } from "@/utils/time";

export default function HomeScreen() {
  const { data: sessions, isLoading } = useSessions();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      </View>
    );
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.secondary }]}>
        <Feather name="feather" size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No sessions yet</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        Start a shared journal with someone you care about.
      </Text>
      <Pressable
        onPress={() => router.push("/new")}
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
      >
        <Feather name="plus" size={20} color={colors.primaryForeground} />
        <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Start a duet</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sessions || []}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (isWeb ? 34 : 20),
          paddingTop: 16,
          flexGrow: 1
        }}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => {
          const isYourTurn = !item.currentPromptUserResponse;
          const isWaiting = item.currentPromptUserResponse && !item.currentPromptPartnerResponse;
          const isRevealed = item.revealed;
          
          let statusText = "Waiting for you";
          if (isWaiting) statusText = "They're thinking...";
          if (isRevealed) statusText = "Ready to reveal";
          
          return (
            <Pressable
              onPress={() => router.push(`/session/${item.id}`)}
              style={({pressed}) => [
                styles.card,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1
                }
              ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarRow}>
                    <View style={[styles.avatar, { backgroundColor: item.partnerAvatarColor }]}>
                      <Feather name={item.partnerAvatarIcon as any} size={20} color="#fff" />
                    </View>
                    <Text style={[styles.partnerName, { color: colors.foreground }]}>{item.partnerName}</Text>
                  </View>
                  {item.streak > 0 && (
                    <View style={[styles.streakBadge, { backgroundColor: colors.secondary }]}>
                      <Feather name="zap" size={14} color={colors.primary} />
                      <Text style={[styles.streakText, { color: colors.primary }]}>{item.streak}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardFooter}>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: isYourTurn ? colors.primary : colors.muted 
                  }]}>
                    <Text style={[styles.statusText, { 
                      color: isYourTurn ? colors.primaryForeground : colors.mutedForeground 
                    }]}>
                      {statusText}
                    </Text>
                  </View>
                  <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                    {formatTimeLeft(item.currentPromptStartedAt)}
                  </Text>
                </View>
              </Pressable>
          );
        }}
      />
      
      {sessions && sessions.length > 0 && (
        <Pressable
          onPress={() => router.push("/new")}
          style={[
            styles.fab, 
            { 
              backgroundColor: colors.primary,
              bottom: insets.bottom + 24
            }
          ]}
        >
          <Feather name="plus" size={24} color={colors.primaryForeground} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  }
});
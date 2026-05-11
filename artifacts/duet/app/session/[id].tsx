import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useDuet,
  useSubmitResponse,
  useNextPrompt,
  useAddReaction,
} from "@/hooks/useDuet";
import { PROMPTS, REACTIONS } from "@/constants/prompts";
import { formatTimeLeft } from "@/utils/time";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: duet, isLoading } = useDuet(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const submitResponse = useSubmitResponse();
  const nextPrompt = useNextPrompt();
  const addReaction = useAddReaction();

  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading || !duet) return null;

  const currentPrompt = PROMPTS[duet.currentPromptIndex % PROMPTS.length];
  const isWaitingForPartner = !duet.partnerJoined;
  const isYourTurn = !isWaitingForPartner && !duet.myResponse;
  const isWaiting = !isWaitingForPartner && duet.myResponse && !duet.revealed;
  const isRevealed = duet.revealed;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (currentPrompt.type === "photo") {
      if (!selectedImage) return;
      submitResponse.mutate({ duetId: duet.id, response: selectedImage });
    } else {
      if (!inputText.trim()) return;
      submitResponse.mutate({ duetId: duet.id, response: inputText.trim() });
      setInputText("");
      Keyboard.dismiss();
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + (isWeb ? 67 : 20) }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={colors.foreground} />
      </Pressable>
      <View style={styles.headerCenter}>
        <View style={[styles.miniAvatar, { backgroundColor: duet.partnerAvatarColor }]}>
          <Feather name={duet.partnerAvatarIcon as any} size={14} color="#fff" />
        </View>
        <Text style={[styles.headerName, { color: colors.foreground }]}>{duet.partnerName}</Text>
      </View>
      <View style={styles.headerRight}>
        {duet.streak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: colors.secondary }]}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.streakText, { color: colors.primary }]}>{duet.streak}</Text>
          </View>
        )}
        <Pressable
          onPress={() => router.push(`/session/calendar/${id}`)}
          style={[styles.calendarButton, { backgroundColor: colors.secondary }]}
        >
          <Feather name="calendar" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );

  const renderInviteState = () => {
    if (!isWaitingForPartner) return null;
    return (
      <Animated.View
        entering={FadeInDown.springify()}
        style={[styles.inviteCard, { backgroundColor: colors.secondary }]}
      >
        <Feather name="link" size={28} color={colors.primary} />
        <Text style={[styles.inviteTitle, { color: colors.primary }]}>Share this code</Text>
        <Text style={[styles.inviteCode, { color: colors.primary }]}>{duet.inviteCode}</Text>
        <Text style={[styles.inviteText, { color: colors.secondaryForeground }]}>
          Tell {duet.partnerName} to open Duet and tap{" "}
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>Join with a code</Text>. The first
          prompt will appear once they join.
        </Text>
      </Animated.View>
    );
  };

  const renderPromptCard = () => {
    if (isWaitingForPartner) return null;
    return (
      <Animated.View
        layout={Layout.springify()}
        style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.promptCategory, { color: colors.mutedForeground }]}>
          PROMPT {duet.currentPromptIndex + 1}
        </Text>
        <Text style={[styles.promptText, { color: colors.foreground }]}>
          {currentPrompt.prompt}
        </Text>
        <View style={styles.promptFooter}>
          <View style={styles.timerBadge}>
            <Feather name="clock" size={14} color={colors.mutedForeground} />
            <Text style={[styles.timerText, { color: colors.mutedForeground }]}>
              {formatTimeLeft(new Date(duet.currentPromptStartedAt).getTime())}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderInput = () => {
    if (!isYourTurn) return null;

    if (currentPrompt.type === "photo") {
      return (
        <Animated.View entering={FadeInDown.springify()} style={styles.inputContainer}>
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                contentFit="cover"
              />
              <Pressable
                style={[styles.removeImageBtn, { backgroundColor: colors.destructive }]}
                onPress={() => setSelectedImage(null)}
              >
                <Feather name="x" size={16} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[
                styles.photoUploadBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={pickImage}
            >
              <Feather name="camera" size={32} color={colors.mutedForeground} />
              <Text style={[styles.photoUploadText, { color: colors.mutedForeground }]}>
                Tap to add a photo
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              !selectedImage && { opacity: 0.5 },
            ]}
            onPress={handleSubmit}
            disabled={!selectedImage || submitResponse.isPending}
          >
            <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
              Send Response
            </Text>
            <Feather name="send" size={16} color={colors.primaryForeground} />
          </Pressable>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.springify()} style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Write your response..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          value={inputText}
          onChangeText={setInputText}
          textAlignVertical="top"
        />
        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            !inputText.trim() && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!inputText.trim() || submitResponse.isPending}
        >
          <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
            Send Response
          </Text>
          <Feather name="send" size={16} color={colors.primaryForeground} />
        </Pressable>
      </Animated.View>
    );
  };

  const renderWaitingState = () => {
    if (!isWaiting) return null;
    return (
      <Animated.View
        entering={FadeIn}
        style={[styles.waitingCard, { backgroundColor: colors.secondary }]}
      >
        <Feather name="edit-2" size={24} color={colors.primary} />
        <Text style={[styles.waitingTitle, { color: colors.primary }]}>
          They're thinking...
        </Text>
        <Text style={[styles.waitingText, { color: colors.secondaryForeground }]}>
          Your answer is sealed until {duet.partnerName} responds or the 48 hours are up.
        </Text>
      </Animated.View>
    );
  };

  const renderRevealedState = () => {
    if (!isRevealed) return null;

    return (
      <Animated.View
        entering={FadeInDown.springify().delay(300)}
        style={styles.revealedContainer}
      >
        <View style={styles.responsesRow}>
          <View
            style={[styles.responseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.responseOwner, { color: colors.mutedForeground }]}>You</Text>
            {currentPrompt.type === "photo" && duet.myResponse?.startsWith("file://") ? (
              <Image
                source={{ uri: duet.myResponse }}
                style={styles.responseImage}
                contentFit="cover"
              />
            ) : (
              <Text style={[styles.responseText, { color: colors.foreground }]}>
                {duet.myResponse}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.responseCard,
              { backgroundColor: colors.secondary, borderColor: "transparent" },
            ]}
          >
            <Text style={[styles.responseOwner, { color: colors.secondaryForeground }]}>
              {duet.partnerName}
            </Text>
            {currentPrompt.type === "photo" ? (
              <View style={[styles.photoPlaceholder, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
                <Text style={[styles.photoPlaceholderText, { color: colors.secondaryForeground }]}>
                  {duet.partnerResponse}
                </Text>
              </View>
            ) : (
              <Text style={[styles.responseText, { color: colors.secondaryForeground }]}>
                {duet.partnerResponse}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={() => nextPrompt.mutate({ duetId: duet.id })}
          disabled={nextPrompt.isPending}
        >
          <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>
            Next Prompt
          </Text>
          <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
        </Pressable>
      </Animated.View>
    );
  };

  const renderHistory = () => {
    if (!duet.history || duet.history.length === 0) return null;

    return (
      <View style={styles.historyContainer}>
        <Text style={[styles.historyTitle, { color: colors.mutedForeground }]}>Past Memories</Text>
        {duet.history.map((hist) => {
          const prompt = PROMPTS[hist.promptIndex % PROMPTS.length];
          return (
            <View
              key={hist.roundId}
              style={[
                styles.historyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.historyPromptText, { color: colors.foreground }]}>
                {prompt.prompt}
              </Text>

              <View style={styles.historyResponses}>
                <View style={styles.historyResponseItem}>
                  <Text style={[styles.historyResponseOwner, { color: colors.mutedForeground }]}>
                    You
                  </Text>
                  {prompt.type === "photo" && hist.myResponse.startsWith("file://") ? (
                    <Image
                      source={{ uri: hist.myResponse }}
                      style={styles.historyImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={[styles.historyResponseText, { color: colors.foreground }]}>
                      {hist.myResponse}
                    </Text>
                  )}
                </View>

                <View style={styles.historyDivider} />

                <View style={styles.historyResponseItem}>
                  <Text style={[styles.historyResponseOwner, { color: colors.mutedForeground }]}>
                    {duet.partnerName}
                  </Text>
                  {prompt.type === "photo" ? (
                    <View
                      style={[
                        styles.photoPlaceholder,
                        { backgroundColor: "rgba(0,0,0,0.05)", padding: 12 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.photoPlaceholderText,
                          { color: colors.foreground, fontSize: 13 },
                        ]}
                      >
                        {hist.partnerResponse}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.historyResponseText, { color: colors.foreground }]}>
                      {hist.partnerResponse}
                    </Text>
                  )}

                  <View style={styles.reactionRow}>
                    {!hist.myReaction ? (
                      <View style={styles.reactionPicker}>
                        {REACTIONS.map((emoji) => (
                          <Pressable
                            key={emoji}
                            onPress={() =>
                              addReaction.mutate({
                                duetId: duet.id,
                                roundId: hist.roundId,
                                reaction: emoji,
                              })
                            }
                            style={styles.reactionEmoji}
                          >
                            <Text style={styles.emojiText}>{emoji}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <View style={[styles.reactionBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={styles.emojiText}>{hist.myReaction}</Text>
                      </View>
                    )}
                    {hist.partnerReaction && (
                      <View
                        style={[
                          styles.reactionBadge,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text style={styles.emojiText}>{hist.partnerReaction}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 40,
            paddingTop: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {renderInviteState()}
          {renderPromptCard()}
          {renderInput()}
          {renderWaitingState()}
          {renderRevealedState()}
          {renderHistory()}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
  },
  streakText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  inviteCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  inviteTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 20,
  },
  inviteCode: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    letterSpacing: 8,
  },
  inviteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  promptCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  promptCategory: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 16,
  },
  promptText: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 24,
  },
  promptFooter: { flexDirection: "row" },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  inputContainer: { gap: 16 },
  textInput: {
    minHeight: 120,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  photoUploadBtn: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  photoUploadText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  imagePreviewContainer: {
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: "100%" },
  removeImageBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 100,
    gap: 8,
  },
  submitButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  waitingCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  waitingTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 20,
  },
  waitingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  revealedContainer: { gap: 24 },
  responsesRow: { gap: 16 },
  responseCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  responseOwner: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  responseText: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 18,
    lineHeight: 26,
  },
  responseImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  photoPlaceholder: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  photoPlaceholderText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    fontStyle: "italic",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 100,
    gap: 8,
    marginTop: 16,
  },
  nextButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  historyContainer: {
    marginTop: 48,
    gap: 16,
  },
  historyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  historyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  historyPromptText: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    lineHeight: 24,
  },
  historyResponses: { gap: 12 },
  historyResponseItem: { gap: 6 },
  historyResponseOwner: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  historyResponseText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  historyImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  historyDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 4,
  },
  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  reactionPicker: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 100,
    padding: 4,
    gap: 4,
  },
  reactionEmoji: {
    padding: 6,
    borderRadius: 100,
  },
  reactionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  emojiText: { fontSize: 16 },
});

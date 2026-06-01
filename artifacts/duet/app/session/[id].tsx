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
  Modal,
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
  useSuggestPrompt,
  useRemoveSuggestion,
} from "@/hooks/useDuet";
import { PROMPTS, REACTIONS } from "@/constants/prompts";
import { formatTimeLeft } from "@/utils/time";
import Animated, { FadeIn, FadeInDown, Layout, SlideInDown } from "react-native-reanimated";
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
  const suggestPrompt = useSuggestPrompt();
  const removeSuggestion = useRemoveSuggestion();

  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestText, setSuggestText] = useState("");
  const [suggestType, setSuggestType] = useState<"text" | "photo">("text");

  if (isLoading || !duet) return null;

  const currentPrompt = duet.customPrompt
    ? { prompt: duet.customPrompt, type: (duet.customPromptType ?? "text") as "text" | "photo" }
    : PROMPTS[duet.currentPromptIndex % PROMPTS.length];
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
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor:
                  duet.todayCompletedCount >= 3 ? colors.primary : colors.secondary,
              },
            ]}
          >
            <Feather
              name="zap"
              size={14}
              color={duet.todayCompletedCount >= 3 ? colors.primaryForeground : colors.primary}
            />
            <Text
              style={[
                styles.streakText,
                {
                  color:
                    duet.todayCompletedCount >= 3 ? colors.primaryForeground : colors.primary,
                },
              ]}
            >
              {duet.streak}
            </Text>
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

        {duet.todayCompletedCount >= 3 ? (
          <View style={[styles.dailyLimitCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="zap" size={20} color={colors.primary} />
            <Text style={[styles.dailyLimitTitle, { color: colors.primary }]}>
              You've done 3 today!
            </Text>
            <Text style={[styles.dailyLimitText, { color: colors.secondaryForeground }]}>
              Come back tomorrow for the next prompt.
            </Text>
          </View>
        ) : (
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
        )}
      </Animated.View>
    );
  };

  const renderSuggestButton = () => {
    if (isWaitingForPartner) return null;
    const queue = duet.pendingSuggestions;
    return (
      <View style={styles.suggestRow}>
        <Pressable
          onPress={() => setShowSuggestModal(true)}
          style={[styles.suggestBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Feather name="plus-circle" size={16} color={colors.primary} />
          <Text style={[styles.suggestBtnText, { color: colors.primary }]}>
            Suggest a prompt
          </Text>
        </Pressable>
        {queue.length > 0 && (
          <View style={[styles.queueBadge, { backgroundColor: colors.secondary }]}>
            <Feather name="list" size={13} color={colors.primary} />
            <Text style={[styles.queueBadgeText, { color: colors.primary }]}>
              {queue.length} queued
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSuggestModal = () => (
    <Modal
      visible={showSuggestModal}
      transparent
      animationType="none"
      onRequestClose={() => setShowSuggestModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => { setShowSuggestModal(false); Keyboard.dismiss(); }}
      >
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandleRow}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            </View>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Suggest a prompt
            </Text>
            <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
              It'll be used as the next question once you both move on.
            </Text>

            {/* Queue peek */}
            {duet.pendingSuggestions.length > 0 && (
              <View style={[styles.queuePeek, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.queuePeekLabel, { color: colors.mutedForeground }]}>
                  Already queued
                </Text>
                {duet.pendingSuggestions.map((s) => (
                  <View key={s.id} style={styles.queueItem}>
                    <Feather
                      name={s.type === "photo" ? "camera" : "type"}
                      size={13}
                      color={colors.mutedForeground}
                    />
                    <Text style={[styles.queueItemText, { color: colors.foreground }]} numberOfLines={1}>
                      {s.text}
                    </Text>
                    {s.suggestedByMe && (
                      <Pressable
                        onPress={() =>
                          removeSuggestion.mutate({ duetId: duet.id, suggestionId: s.id })
                        }
                        hitSlop={8}
                      >
                        <Feather name="x" size={14} color={colors.mutedForeground} />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Type toggle */}
            <View style={styles.typeToggle}>
              {(["text", "photo"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setSuggestType(t)}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor:
                        suggestType === t ? colors.primary : colors.background,
                      borderColor: suggestType === t ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={t === "photo" ? "camera" : "type"}
                    size={14}
                    color={suggestType === t ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      {
                        color:
                          suggestType === t ? colors.primaryForeground : colors.mutedForeground,
                      },
                    ]}
                  >
                    {t === "photo" ? "Photo" : "Written"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Text input */}
            <TextInput
              style={[
                styles.suggestInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
              ]}
              placeholder="What's a question you'd love to answer together?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={suggestText}
              onChangeText={setSuggestText}
              autoFocus
            />

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                (suggestText.trim().length < 5 || suggestPrompt.isPending) && { opacity: 0.5 },
              ]}
              onPress={() => {
                if (suggestText.trim().length < 5) return;
                suggestPrompt.mutate(
                  { duetId: duet.id, text: suggestText.trim(), type: suggestType },
                  {
                    onSuccess: () => {
                      setSuggestText("");
                      setSuggestType("text");
                      setShowSuggestModal(false);
                    },
                  },
                );
              }}
              disabled={suggestText.trim().length < 5 || suggestPrompt.isPending}
            >
              <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
                {suggestPrompt.isPending ? "Adding..." : "Add to queue"}
              </Text>
              <Feather name="check" size={16} color={colors.primaryForeground} />
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );

  const renderHistory = () => {
    if (!duet.history || duet.history.length === 0) return null;

    return (
      <View style={styles.historyContainer}>
        <Text style={[styles.historyTitle, { color: colors.mutedForeground }]}>Past Memories</Text>
        {duet.history.map((hist) => {
          const prompt = hist.customPrompt
            ? { prompt: hist.customPrompt, type: (hist.customPromptType ?? "text") as "text" | "photo" }
            : PROMPTS[hist.promptIndex % PROMPTS.length];
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
          {renderSuggestButton()}
          {renderInput()}
          {renderWaitingState()}
          {renderRevealedState()}
          {renderHistory()}
        </ScrollView>
      </View>
      {renderSuggestModal()}
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

  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  suggestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
  },
  suggestBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  queueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  queueBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
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
  sheetHandleRow: { alignItems: "center", marginBottom: 4 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2 },
  sheetTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 22,
  },
  sheetSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: -8,
  },
  queuePeek: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  queuePeekLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  queueItemText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
  },
  typeToggle: {
    flexDirection: "row",
    gap: 10,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  typeOptionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  suggestInput: {
    minHeight: 100,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  dailyLimitCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  dailyLimitTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    textAlign: "center",
  },
  dailyLimitText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

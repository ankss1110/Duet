import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { AVATAR_COLORS, AVATAR_ICONS } from "@/constants/prompts";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[2]);
  const [selectedIcon, setSelectedIcon] = useState(AVATAR_ICONS[0]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!name.trim()) return;
    setIsPending(true);
    setError("");
    try {
      await signUp(name.trim(), selectedColor, selectedIcon);
      router.replace("/");
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Text style={[styles.title, { color: colors.foreground }]}>Duet</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          A quiet ritual for two people who want to stay close.
        </Text>
      </View>

      <View style={styles.avatarPreview}>
        <View style={[styles.avatar, { backgroundColor: selectedColor }]}>
          <Feather name={selectedIcon as any} size={40} color="#fff" />
        </View>
        <Text style={[styles.previewName, { color: colors.foreground }]}>
          {name || "You"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Your name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="What do they call you?"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
          autoFocus={Platform.OS !== "web"}
          returnKeyType="done"
          onSubmitEditing={handleStart}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Color</Text>
        <View style={styles.row}>
          {AVATAR_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setSelectedColor(c)}
              style={[
                styles.colorOption,
                { backgroundColor: c },
                selectedColor === c && [styles.selectedRing, { borderColor: colors.foreground }],
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Symbol</Text>
        <View style={styles.row}>
          {AVATAR_ICONS.map((icon) => (
            <Pressable
              key={icon}
              onPress={() => setSelectedIcon(icon)}
              style={[
                styles.iconOption,
                {
                  backgroundColor: selectedIcon === icon ? colors.secondary : colors.card,
                  borderColor: selectedIcon === icon ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather
                name={icon as any}
                size={20}
                color={selectedIcon === icon ? colors.primary : colors.mutedForeground}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          (!name.trim() || isPending) && { opacity: 0.5 },
        ]}
        onPress={handleStart}
        disabled={!name.trim() || isPending}
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          {isPending ? "Setting up..." : "Start Duet"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 48,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
  avatarPreview: {
    alignItems: "center",
    marginBottom: 40,
    gap: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 20,
  },
  section: {
    width: "100%",
    marginBottom: 28,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "transparent",
  },
  selectedRing: {
    borderWidth: 3,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    padding: 18,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});

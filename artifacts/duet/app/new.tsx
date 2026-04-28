import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { AVATAR_COLORS, AVATAR_ICONS } from "@/constants/prompts";
import { Feather } from "@expo/vector-icons";
import { useCreateSession } from "@/hooks/useDuet";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewSessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVATAR_ICONS[0]);
  
  const createSession = useCreateSession();

  const handleCreate = () => {
    if (!name.trim()) return;
    createSession.mutate(
      { name: name.trim(), color: selectedColor, icon: selectedIcon },
      {
        onSuccess: (session) => {
          router.replace(`/session/${session.id}`);
        }
      }
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: 24,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
      bottomOffset={20}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Who are you writing with?</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Create a private space for just the two of you.
        </Text>
      </View>

      <View style={styles.previewContainer}>
        <View style={[styles.previewAvatar, { backgroundColor: selectedColor }]}>
          <Feather name={selectedIcon as any} size={40} color="#fff" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Their Name</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground
          }]}
          placeholder="e.g. Sarah"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {AVATAR_COLORS.map(c => (
            <Pressable
              key={c}
              onPress={() => setSelectedColor(c)}
              style={[
                styles.colorOption,
                { backgroundColor: c },
                selectedColor === c && styles.selectedRing,
                selectedColor === c && { borderColor: colors.foreground }
              ]}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Symbol</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {AVATAR_ICONS.map(icon => (
            <Pressable
              key={icon}
              onPress={() => setSelectedIcon(icon)}
              style={[
                styles.iconOption,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedIcon === icon && { borderColor: colors.primary, backgroundColor: colors.secondary }
              ]}
            >
              <Feather name={icon as any} size={24} color={selectedIcon === icon ? colors.primary : colors.mutedForeground} />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Pressable 
        style={[
          styles.submitButton, 
          { backgroundColor: colors.primary },
          (!name.trim() || createSession.isPending) && { opacity: 0.5 }
        ]}
        onPress={handleCreate}
        disabled={!name.trim() || createSession.isPending}
      >
        <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
          {createSession.isPending ? "Creating..." : "Start Duet"}
        </Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 28,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  previewAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  row: {
    gap: 16,
    paddingRight: 20,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  selectedRing: {
    borderWidth: 3,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    padding: 18,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  }
});
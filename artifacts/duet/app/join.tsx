import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function JoinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleJoin = async () => {
    const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleaned.length !== 6) {
      setError("Please enter the full 6-character code.");
      return;
    }
    setIsPending(true);
    setError("");
    try {
      const duet = await api.joinDuet(cleaned);
      queryClient.invalidateQueries({ queryKey: ["duets"] });
      router.replace(`/session/${duet.id}`);
    } catch (e: any) {
      setError(e?.message || "Could not find a duet with that code.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Join a Duet</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Enter the 6-character code your friend shared with you.
      </Text>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.codeContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.codeInput,
            {
              backgroundColor: colors.card,
              borderColor: code.length === 6 ? colors.primary : colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="A B C 1 2 3"
          placeholderTextColor={colors.mutedForeground}
          value={code}
          onChangeText={(v) => {
            setError("");
            setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          autoFocus
          returnKeyType="join"
          onSubmitEditing={handleJoin}
        />
      </Pressable>

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          (code.length !== 6 || isPending) && { opacity: 0.5 },
        ]}
        onPress={handleJoin}
        disabled={code.length !== 6 || isPending}
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          {isPending ? "Joining..." : "Join"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  title: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 28,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  codeContainer: {
    width: "100%",
    marginBottom: 16,
  },
  codeInput: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: 12,
    textAlign: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    width: "100%",
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

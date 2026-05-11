import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const API_BASE =
  Platform.OS === "web"
    ? "/api"
    : `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const TOKEN_KEY = "@duet_device_token";

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Device-Token": token } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export type UserResponse = {
  id: string;
  displayName: string;
  avatarColor: string;
  avatarIcon: string;
};

export type CreateUserResponse = UserResponse & { deviceToken: string };

export type HistoryItem = {
  roundId: string;
  promptIndex: number;
  customPrompt: string | null;
  customPromptType: string | null;
  myResponse: string;
  partnerResponse: string;
  myReaction: string | null;
  partnerReaction: string | null;
  completedAt: string;
};

export type PromptSuggestion = {
  id: string;
  text: string;
  type: string;
  suggestedByMe: boolean;
};

export type DuetState = {
  id: string;
  inviteCode: string;
  partnerName: string;
  partnerAvatarColor: string;
  partnerAvatarIcon: string;
  isCreator: boolean;
  partnerJoined: boolean;
  streak: number;
  currentPromptIndex: number;
  currentPromptStartedAt: string;
  duetCreatedAt: string;
  customPrompt: string | null;
  customPromptType: string | null;
  myResponse: string | null;
  partnerResponse: string | null;
  revealed: boolean;
  history: HistoryItem[];
  pendingSuggestions: PromptSuggestion[];
};

export const api = {
  createUser: (data: {
    displayName: string;
    avatarColor: string;
    avatarIcon: string;
  }) =>
    request<CreateUserResponse>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<UserResponse>("/users/me"),

  getDuets: () => request<DuetState[]>("/duets"),

  getDuet: (id: string) => request<DuetState>(`/duets/${id}`),

  createDuet: (data: {
    partnerName: string;
    partnerAvatarColor: string;
    partnerAvatarIcon: string;
  }) =>
    request<DuetState>("/duets", { method: "POST", body: JSON.stringify(data) }),

  joinDuet: (code: string) =>
    request<DuetState>("/duets/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  submitResponse: (id: string, response: string) =>
    request<DuetState>(`/duets/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),

  nextPrompt: (id: string, reaction?: string) =>
    request<DuetState>(`/duets/${id}/next`, {
      method: "POST",
      body: JSON.stringify({ reaction }),
    }),

  addReaction: (id: string, roundId: string, reaction: string) =>
    request<DuetState>(`/duets/${id}/react`, {
      method: "POST",
      body: JSON.stringify({ roundId, reaction }),
    }),

  suggestPrompt: (id: string, text: string, type: "text" | "photo") =>
    request<DuetState>(`/duets/${id}/suggest`, {
      method: "POST",
      body: JSON.stringify({ text, type }),
    }),

  removeSuggestion: (id: string, suggestionId: string) =>
    request<DuetState>(`/duets/${id}/suggest/${suggestionId}`, { method: "DELETE" }),
};

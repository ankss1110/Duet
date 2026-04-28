import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROMPTS, SIMULATED_RESPONSES } from '@/constants/prompts';

export type CompletedPrompt = {
  promptId: number;
  userResponse: string;
  partnerResponse: string;
  userReaction: string | null;
  partnerReaction: string | null;
  completedAt: number;
};

export type Session = {
  id: string;
  partnerName: string;
  partnerAvatarIcon: string;
  partnerAvatarColor: string;
  createdAt: number;
  streak: number;
  currentPromptIndex: number;
  currentPromptStartedAt: number;
  currentPromptUserResponse: string | null;
  currentPromptPartnerResponse: string | null;
  revealed: boolean;
  history: CompletedPrompt[];
  lastActivityAt: number;
};

const STORAGE_KEY = '@duet_sessions';

export const storage = {
  async getSessions(): Promise<Session[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as Session[];
    } catch (e) {
      console.error('Failed to get sessions', e);
      return [];
    }
  },

  async saveSessions(sessions: Session[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
  },

  async createSession(partnerName: string, partnerAvatarColor: string, partnerAvatarIcon: string): Promise<Session> {
    const sessions = await this.getSessions();
    const newSession: Session = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      partnerName,
      partnerAvatarColor,
      partnerAvatarIcon,
      createdAt: Date.now(),
      streak: 0,
      currentPromptIndex: 0,
      currentPromptStartedAt: Date.now(),
      currentPromptUserResponse: null,
      currentPromptPartnerResponse: null,
      revealed: false,
      history: [],
      lastActivityAt: Date.now(),
    };
    await this.saveSessions([newSession, ...sessions]);
    return newSession;
  },

  async getSession(id: string): Promise<Session | null> {
    const sessions = await this.getSessions();
    return sessions.find(s => s.id === id) || null;
  },

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
    const sessions = await this.getSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) return null;

    const updatedSession = { ...sessions[index], ...updates, lastActivityAt: Date.now() };
    sessions[index] = updatedSession;
    await this.saveSessions(sessions);
    return updatedSession;
  },

  async deleteSession(id: string): Promise<void> {
    const sessions = await this.getSessions();
    await this.saveSessions(sessions.filter(s => s.id !== id));
  }
};

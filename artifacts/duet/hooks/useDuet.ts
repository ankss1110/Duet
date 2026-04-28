import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage, Session, CompletedPrompt } from '@/lib/storage';
import { PROMPTS, SIMULATED_RESPONSES, REACTIONS } from '@/constants/prompts';
import * as Haptics from 'expo-haptics';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => storage.getSessions(),
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => (id ? storage.getSession(id) : null),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color, icon }: { name: string; color: string; icon: string }) => 
      storage.createSession(name, color, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}

export function useSubmitResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, response }: { sessionId: string; response: string }) => {
      const session = await storage.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      return storage.updateSession(sessionId, {
        currentPromptUserResponse: response,
      });
    },
    onSuccess: (updatedSession) => {
      if (!updatedSession) return;
      queryClient.setQueryData(['session', updatedSession.id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useSimulatePartnerResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const session = await storage.getSession(sessionId);
      if (!session || session.currentPromptPartnerResponse) return null;

      const currentPrompt = PROMPTS[session.currentPromptIndex % PROMPTS.length];
      const possibleResponses = SIMULATED_RESPONSES[currentPrompt.id] || ["Sounds interesting!"];
      const randomResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];

      return storage.updateSession(sessionId, {
        currentPromptPartnerResponse: randomResponse,
      });
    },
    onSuccess: (updatedSession) => {
      if (!updatedSession) return;
      queryClient.setQueryData(['session', updatedSession.id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useRevealResponses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const session = await storage.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Check if both responded before timer (48h)
      const isWithinTimer = (Date.now() - session.currentPromptStartedAt) < 48 * 60 * 60 * 1000;
      const newStreak = isWithinTimer ? session.streak + 1 : 0; // Simple logic: if they didn't both answer, streak breaks? Wait, if they are revealing, they both answered. So it's about the time.

      return storage.updateSession(sessionId, {
        revealed: true,
        streak: newStreak,
      });
    },
    onSuccess: (updatedSession) => {
      if (!updatedSession) return;
      queryClient.setQueryData(['session', updatedSession.id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, reaction, historyIndex }: { sessionId: string; reaction: string; historyIndex: number }) => {
      const session = await storage.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const updatedHistory = [...session.history];
      if (updatedHistory[historyIndex]) {
        updatedHistory[historyIndex].userReaction = reaction;
      }

      return storage.updateSession(sessionId, {
        history: updatedHistory
      });
    },
    onSuccess: (updatedSession) => {
      if (!updatedSession) return;
      queryClient.setQueryData(['session', updatedSession.id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useNextPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, userReaction }: { sessionId: string; userReaction?: string }) => {
      const session = await storage.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      const currentPrompt = PROMPTS[session.currentPromptIndex % PROMPTS.length];
      
      const historyItem: CompletedPrompt = {
        promptId: currentPrompt.id,
        userResponse: session.currentPromptUserResponse || "",
        partnerResponse: session.currentPromptPartnerResponse || "",
        userReaction: userReaction || null,
        partnerReaction: Math.random() > 0.5 ? REACTIONS[Math.floor(Math.random() * REACTIONS.length)] : null, // Simulate partner reaction
        completedAt: Date.now(),
      };

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      return storage.updateSession(sessionId, {
        currentPromptIndex: session.currentPromptIndex + 1,
        currentPromptStartedAt: Date.now(),
        currentPromptUserResponse: null,
        currentPromptPartnerResponse: null,
        revealed: false,
        history: [historyItem, ...session.history],
      });
    },
    onSuccess: (updatedSession) => {
      if (!updatedSession) return;
      queryClient.setQueryData(['session', updatedSession.id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

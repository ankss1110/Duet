import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";

export function useDuets() {
  return useQuery({
    queryKey: ["duets"],
    queryFn: () => api.getDuets(),
  });
}

export function useDuet(id: string | undefined) {
  return useQuery({
    queryKey: ["duet", id],
    queryFn: () => api.getDuet(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (!data.partnerJoined) return 5000;
      if (data.myResponse && !data.revealed) return 6000;
      return false;
    },
  });
}

export function useCreateDuet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      partnerName: string;
      partnerAvatarColor: string;
      partnerAvatarIcon: string;
    }) => api.createDuet(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duets"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}

export function useJoinDuet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.joinDuet(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duets"] });
    },
  });
}

export function useSubmitResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ duetId, response }: { duetId: string; response: string }) =>
      api.submitResponse(duetId, response),
    onSuccess: (data) => {
      queryClient.setQueryData(["duet", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["duets"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });
}

export function useNextPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ duetId, reaction }: { duetId: string; reaction?: string }) =>
      api.nextPrompt(duetId, reaction),
    onSuccess: (data) => {
      queryClient.setQueryData(["duet", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["duets"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      duetId,
      roundId,
      reaction,
    }: {
      duetId: string;
      roundId: string;
      reaction: string;
    }) => api.addReaction(duetId, roundId, reaction),
    onSuccess: (data) => {
      queryClient.setQueryData(["duet", data.id], data);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });
}

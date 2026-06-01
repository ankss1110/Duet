import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(userId: string | undefined) {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (Platform.OS === "web") return;

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const duetId = response.notification.request.content.data?.duetId as string | undefined;
      if (duetId) {
        router.push(`/session/${duetId}`);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);

  async function registerForPushNotifications() {
    if (!Device.isDevice) return;

    const existing = (await Notifications.getPermissionsAsync()) as unknown as { granted: boolean };
    let granted = existing.granted;

    if (!granted) {
      const requested = (await Notifications.requestPermissionsAsync()) as unknown as { granted: boolean };
      granted = requested.granted;
    }

    if (!granted) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("duet", {
        name: "Duet",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#C86B5E",
        sound: "default",
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    try {
      await api.registerPushToken(token);
    } catch {
    }
  }
}

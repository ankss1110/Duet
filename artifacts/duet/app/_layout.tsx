import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from "@expo-google-fonts/inter";
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts as useFrauncesFonts,
} from "@expo-google-fonts/fraunces";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColors } from "@/hooks/useColors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.foreground,
      headerTitleStyle: { fontFamily: "Fraunces_600SemiBold" },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background }
    }}>
      <Stack.Screen name="index" options={{ title: "Duet", headerTitleStyle: { fontFamily: "Fraunces_700Bold", fontSize: 24 } }} />
      <Stack.Screen name="new" options={{ title: "New Session", presentation: "modal" }} />
      <Stack.Screen name="session/[id]" options={{ title: "", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [interLoaded, interError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [frauncesLoaded, frauncesError] = useFrauncesFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  const fontsLoaded = interLoaded && frauncesLoaded;
  const fontError = interError || frauncesError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

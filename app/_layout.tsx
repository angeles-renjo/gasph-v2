import "expo-dev-client";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { queryClient } from "@/lib/query-client";
import { useAuth } from "@/hooks/useAuth";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Separate auth-aware navigation component
function AuthenticatedNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inAuthScreens = segments[0] === "auth";

    console.log("Navigation check:", {
      user,
      inAuthGroup,
      inAuthScreens,
      segments,
    });

    if (!user && inAuthGroup) {
      console.log("Should redirect to sign-in");
      router.replace("/auth/sign-in");
    } else if (user && inAuthScreens) {
      console.log("Should redirect to home");
      router.replace("/");
    }
  }, [user, loading, segments]);
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2a9d8f",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="station/[id]"
        options={{
          title: "Station Details",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="auth/sign-in"
        options={{
          title: "Sign In",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/sign-up"
        options={{
          title: "Sign Up",
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

// Splash screen handler component
function SplashScreenHandler({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return children;
}

// Main app layout
export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: createAsyncStoragePersister({
          storage: AsyncStorage,
          key: "GASPH_QUERY_CACHE",
          throttleTime: 1000,
        }),
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const queryKey = query.queryKey as string[];
            return (
              !queryKey.includes("realtime") && !queryKey.includes("session")
            );
          },
        },
      }}
    >
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <SplashScreenHandler>
          <AuthenticatedNavigator />
        </SplashScreenHandler>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

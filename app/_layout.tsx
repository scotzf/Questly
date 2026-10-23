import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StoreProvider, useStore } from "../src/store";
import { Button, C, ErrorText, Icon, s } from "../src/ui";
import { listenForReminder } from "../src/reminders";
function Shell() {
  const { ready, error, retry, state, notice, clearNotice } = useStore();
  useEffect(() => {
    if (ready && state.settings.onboarded)
      return listenForReminder((id) =>
        router.push({ pathname: "/task/[id]", params: { id } }),
      );
  }, [ready, state.settings.onboarded]);
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 32, backgroundColor: C.bg }}>
        {error ? (
          <>
            <ErrorText message={error} />
            <Button label="Retry" icon="refresh" onPress={retry} />
          </>
        ) : (
          <ActivityIndicator color={C.primary} />
        )}
      </View>
    );
  const sheet = { presentation: "modal", headerShown: false } as const;
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.ink,
          headerTitleStyle: { fontWeight: "800" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task/[id]" options={{ title: "" }} />
        <Stack.Screen name="editor" options={sheet} />
        <Stack.Screen
          name="quick-add"
          options={{
            presentation: "transparentModal",
            animation: "fade",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="plan" options={{ title: "Plan today", presentation: "modal" }} />
        <Stack.Screen name="rescue" options={{ title: "Stuck?", presentation: "modal" }} />
        <Stack.Screen name="stats" options={{ title: "Statistics" }} />
        <Stack.Screen name="rewards" options={{ title: "Rewards" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="focus-settings" options={{ title: "Focus settings" }} />
      </Stack>
      {notice && (
        <View
          style={[
            s.row,
            { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.warningPale },
          ]}
        >
          <Icon name="notifications-off-outline" color={C.warning} />
          <Text style={[s.h3, { flex: 1 }]}>{notice}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openSettings().catch(() => {})}
            style={{ minHeight: 48, justifyContent: "center" }}
          >
            <Text style={{ color: C.primary, fontWeight: "700" }}>Fix</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={clearNotice}
            style={{ minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="close" color={C.muted} />
          </Pressable>
        </View>
      )}
    </>
  );
}
export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

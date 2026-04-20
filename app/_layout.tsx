import { NotificationProvider } from "@/components/Notification";
import AuthProvider from "@/providers/AuthProvider";
import NetInfoProvider from "@/providers/NetInfoProviders";
import { queryClient } from "@/utils/queryClient";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <AuthProvider>
                <NetInfoProvider>
                  <NotificationProvider>
                    <Stack>
                      <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="auth"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="warehouse/[id]"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="profile"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="chat/[conversationId]"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="notifications"
                        options={{ headerShown: false }}
                      />
                    </Stack>
                    <StatusBar style="dark" />
                  </NotificationProvider>
                </NetInfoProvider>
              </AuthProvider>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

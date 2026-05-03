import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="phone-number" />
      <Stack.Screen name="email-address" />
      <Stack.Screen name="freeze-account" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="feedback-history" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="active-sessions" />
      <Stack.Screen name="language" />
      <Stack.Screen name="notification-preferences" />
      <Stack.Screen name="support" />
      <Stack.Screen name="about" />
    </Stack>
  );
}

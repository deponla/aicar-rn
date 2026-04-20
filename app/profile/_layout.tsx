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
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="blog" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function CompanyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="collection-detail" />
      <Stack.Screen name="new-collection-continue" />
    </Stack>
  );
}
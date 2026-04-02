import { Stack } from 'expo-router';

export default function CreatorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tab screens group */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* Detail screens */}
      <Stack.Screen name="collection-detail" options={{ headerShown: false }} />
      <Stack.Screen name="collection-detail-listed" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-collection"
        options={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#F6F1E8' },
        }}
      />
      <Stack.Screen
        name="new-collection-continue"
        options={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#F6F1E8' },
        }}
      />
      <Stack.Screen name="edit-collection" options={{ headerShown: false }} />
      <Stack.Screen name="item-orders-dynamic" options={{ headerShown: false }} />
      <Stack.Screen name="item-detail" options={{ headerShown: false }} />
      <Stack.Screen name="add-variation" options={{ headerShown: false }} />
      <Stack.Screen name="generate-all-qr-collections" options={{ headerShown: false }} />
    </Stack>
  );
}
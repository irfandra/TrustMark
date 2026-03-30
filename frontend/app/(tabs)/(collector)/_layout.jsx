import { Tabs, useSegments } from 'expo-router';
import { HapticTab } from '@/components/shared/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();

  // Hide tab bar on detail screens
  const isDetailScreen =
    segments.includes('brand') ||
    segments.includes('product') ||
    (segments.includes('collection') && segments.length >= 4);

  const tabBarStyle = isDetailScreen
    ? { display: 'none', height: 0, opacity: 0 }
    : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rack"
        options={{
          title: 'Your Rack',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="cube.box.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="authcheck"
        options={{
          title: 'Authenticate',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="qrcode.viewfinder" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
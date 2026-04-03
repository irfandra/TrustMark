import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HapticTab } from '@/components/shared/haptic-tab';

const VISIBLE_TAB_ROUTES = new Set([
  '(collection)/collection',
  '(order)/order',
  '(authcheck)/authcheck',
  '(profile)/creatorProfile',
]);

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          borderRadius: 22,
          backgroundColor: '#FFF9F0',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: '#12253A',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 18,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        tabBarItemStyle: VISIBLE_TAB_ROUTES.has(route.name)
          ? undefined
          : { display: 'none' },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="(collection)/collection"
        options={{
          title: 'Collection',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(order)/order"
        options={{
          title: 'Shipment',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="cube" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(authcheck)/authcheck"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="qr-code-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)/creatorProfile"
        options={{
          title: 'Creator',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="person-circle" color={color} />
          ),
        }}
      />
   
    </Tabs>
  );
}

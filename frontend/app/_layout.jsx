'use client';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoleProvider } from '../components/context/RoleContext';

// Toggle code kept for future reuse:
// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { Tabs, useRouter, useSegments } from 'expo-router';
// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = require('react-native').Dimensions.get('window');
const isTablet = width >= 768;

function RootLayout() {
  const segments = useSegments();
  const normalizedSegments = segments.map((segment) =>
    segment.replace(/[()]/g, '')
  );
  const lastSegment = segments[segments.length - 1];
  const isRoleTabsScreen =
    normalizedSegments.includes('creator') || normalizedSegments.includes('collector');

  // Toggle code kept for future reuse:
  // const [active, setActive] = useState('collector');
  // const router = useRouter();
  // const isCollectorActive = active === 'collector';
  // const isCreatorActive = active === 'creator';
  // const currentRole = segments[1] === '(creator)' ? 'creator' : 'collector';
  // useEffect(() => {
  //   setActive(currentRole);
  // }, [currentRole]);
  // const switchToCollector = () => {
  //   setActive('collector');
  //   router.push('/(tabs)/(collector)');
  // };
  // const switchToCreator = () => {
  //   setActive('creator');
  //   router.push('/(tabs)/(creator)');
  // };

  const detailRoutes = new Set([
    'collection-detail',
    'collection-detail-listed',
    'new-collection',
    'new-collection-continue',
    'item-orders-dynamic',
    'item-detail',
    'add-variation',
    'generate-all-qr-collections',
    '[itemId]',
    'brand',
    'product',
    'item',
  ]);

  const isDetailScreen = detailRoutes.has(lastSegment);

  return (
    <RoleProvider>
      <>
        {isRoleTabsScreen && !isDetailScreen && (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
              <View style={styles.content}>
                <Text style={styles.logo}>ZEAL</Text>
                {/*
                Toggle code kept for future reuse:
                <View style={styles.toggleOuter}>
                  <TouchableOpacity
                    style={[styles.side, isCollectorActive && styles.sideActiveLeft]}
                    onPress={switchToCollector}
                  >
                    <Ionicons
                      name="card-outline"
                      size={isTablet ? 20 : 18}
                      color={isCollectorActive ? '#fff' : '#666'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.side, isCreatorActive && styles.sideActiveRight]}
                    onPress={switchToCreator}
                  >
                    <MaterialCommunityIcons
                      name="office-building-outline"
                      size={isTablet ? 20 : 18}
                      color={isCreatorActive ? '#fff' : '#666'}
                    />
                  </TouchableOpacity>
                </View>
                */}
              </View>
            </View>
          </SafeAreaView>
        )}

        <Slot />
      </>
    </RoleProvider>
  );
}

export default function RootLayoutWrapper() {
  return <RootLayout />;
}

// Toggle constants kept for future reuse:
// const PILL_HEIGHT = isTablet ? 44 : 40;
// const PILL_RADIUS = PILL_HEIGHT / 2;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    paddingBottom: 0,
  },
  container: { backgroundColor: '#fff' },
  content: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logo: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#000',
    textTransform: 'uppercase',
  },
  /*
  Toggle styles kept for future reuse:
  toggleOuter: {
    height: PILL_HEIGHT,
    width: isTablet ? 118 : 108,
    borderRadius: PILL_RADIUS,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  side: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  sideActiveLeft: {
    backgroundColor: '#000',
    borderTopLeftRadius: PILL_RADIUS,
    borderBottomLeftRadius: PILL_RADIUS,
  },
  sideActiveRight: {
    backgroundColor: '#000',
    borderTopRightRadius: PILL_RADIUS,
    borderBottomRightRadius: PILL_RADIUS,
  },
  */
});
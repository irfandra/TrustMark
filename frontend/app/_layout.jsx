'use client';
import React from 'react';
import { View, Text } from 'react-native';
import { Slot, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoleProvider } from '../components/context/RoleContext';
import { Fonts } from '../constants/theme';
import { createAppLayoutStyles } from '../constants/styles/app-layout-styles.js';


const { width } = require('react-native').Dimensions.get('window');
const isTablet = width >= 768;

function RootLayout() {
  const segments = useSegments();
  const normalizedSegments = segments.map((segment) =>
    segment.replace(/[()]/g, '')
  );
  const lastSegment = segments[segments.length - 1];
  const isRoleTabsScreen = normalizedSegments.includes('tabs');


  const detailRoutes = new Set([
    'collection-detail',
    'collection-detail-listed',
    'new-collection',
    'new-collection-continue',
    'edit-collection',
    'item-orders-dynamic',
    'item-detail',
    'add-variation',
    'generate-all-qr-collections',
    'brand',
    'product',
  ]);

  const isDetailScreen = detailRoutes.has(lastSegment);

  return (
    <RoleProvider>
      <>
        {isRoleTabsScreen && !isDetailScreen && (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
              <View style={styles.content}>
                <View style={styles.brandMark} />
                <Text style={styles.logo}>TrustMark</Text>
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

const styles = createAppLayoutStyles({ isTablet, Fonts });

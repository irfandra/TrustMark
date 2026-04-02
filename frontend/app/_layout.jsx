'use client';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoleProvider } from '../components/context/RoleContext';
import { Fonts } from '../constants/theme';


const { width } = require('react-native').Dimensions.get('window');
const isTablet = width >= 768;

function RootLayout() {
  const segments = useSegments();
  const normalizedSegments = segments.map((segment) =>
    segment.replace(/[()]/g, '')
  );
  const lastSegment = segments[segments.length - 1];
  const isRoleTabsScreen = normalizedSegments.includes('creator');


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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F6F1E8',
    paddingBottom: 0,
  },
  container: {
    backgroundColor: '#F6F1E8',
    borderBottomWidth: 1,
    borderBottomColor: '#E4D9C9',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  brandMark: {
    width: isTablet ? 18 : 14,
    height: isTablet ? 18 : 14,
    borderRadius: 999,
    backgroundColor: '#D95F47',
    borderWidth: 2,
    borderColor: '#1E2C3A',
  },
  logo: {
    fontSize: isTablet ? 34 : 30,
    fontFamily: Fonts.serif,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#1E2C3A',
  },
});
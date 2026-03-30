// app/(tabs)/(collector)/authcheck/fromrack.jsx
import React from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ItemDetailCard from '../../../../components/card/ItemDetailCard';

import { getCurrentUser } from '../../store/userStore';
import { getMyItems } from '../../store/transferStore';

export default function FromRackPage() {
  const router = useRouter();

  const allItems = getMyItems(getCurrentUser());
  const items    = allItems.filter((item) => item.status === 'Claimed');

  const handleSelect = (item) => {
    // ✅ Navigate back to authcheck/index with selectedItem as param
    router.navigate({
      pathname: '/authcheck',
      params: { selectedItem: encodeURIComponent(JSON.stringify(item)) },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>From Your Rack</Text>
        <Text style={styles.pageSubtitle}>Select a claimed item to verify.</Text>

        <View style={styles.grid}>
          {items.map((item) => (
            <ItemDetailCard
              key={item.id}
              item={item}
              showStatus={true}
              onPress={() => handleSelect(item)}
            />
          ))}
        </View>

        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={40} color="#ddd" />
            <Text style={styles.emptyText}>No claimed items</Text>
            <Text style={styles.emptySubtext}>
              Only claimed items can be verified.{'\n'}Claim an item first from your rack.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    height: 44, paddingHorizontal: 16,
    justifyContent: 'center', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingVertical: 8, paddingHorizontal: 4,
  },
  backText:     { fontSize: 17, fontWeight: '600', color: '#111' },
  scroll:       { paddingHorizontal: 20, paddingTop: 20 },
  pageTitle:    { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emptyState:   { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyText:    { fontSize: 15, color: '#aaa', fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#ccc', textAlign: 'center', lineHeight: 20 },
});
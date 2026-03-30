// app/(tabs)/(collector)/rack.jsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import ItemDetailCard from '@/components/card/ItemDetailCard';
import { getCurrentUser, setCurrentUser } from '../store/userStore';
import { getMyItems } from '../store/transferStore';

const FILTERS = ['All', 'Requested', 'Prepared', 'Shipped', 'Claimed'];

const PolDot = ({ size = 16 }) => (
  <View style={[styles.polDot, { width: size, height: size, borderRadius: size / 2 }]} />
);

export default function YourRackScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentUser,  setUser]         = useState(getCurrentUser());
  const [items,        setItems]        = useState(getMyItems(getCurrentUser()));
  const { width } = useWindowDimensions();
  const router = useRouter();

  const GAP      = 12;
  const PADDING  = 20;
  const cardWidth = (width - PADDING * 2 - GAP) / 2;

  useFocusEffect(
    useCallback(() => {
      const user = getCurrentUser();
      setUser(user);
      setItems(getMyItems(user));
    }, [])
  );

  const filtered = items.filter((item) =>
    activeFilter === 'All' ? true : item.status === activeFilter
  );

  const totalPol = items.reduce((sum, item) => {
    const num = parseInt(item.price.replace(/[^\d]/g, ''), 10);
    return sum + num;
  }, 0);

  const badgeCounts = FILTERS.reduce((acc, f) => {
    if (f !== 'All') acc[f] = items.filter((i) => i.status === f).length;
    return acc;
  }, {});

  const switchUser = () => {
    const next = currentUser === 'glimpse27' ? 'bliss24' : 'glimpse27';
    setCurrentUser(next);
    setUser(next);
    setItems(getMyItems(next));
    setActiveFilter('All');
  };

  return (
    <View style={styles.container}>

      {__DEV__ && (
        <TouchableOpacity style={styles.devSwitcher} onPress={switchUser}>
          <Text style={styles.devSwitcherText}>
            👤 @{currentUser} — tap to switch user
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Your Rack</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Value</Text>
        <PolDot size={18} />
        <Text style={styles.totalPol}>POL {totalPol.toLocaleString()}</Text>
        <Text style={styles.totalUsd}>USD {Math.round(totalPol / 10.5).toLocaleString()}</Text>
      </View>

      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTERS.map((f) => {
          const isActive = activeFilter === f;
          const count    = f !== 'All' ? badgeCounts[f] : null;
          const hasBadge = count !== null && count > 0;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                isActive && styles.filterBtnActive,
                hasBadge && { paddingRight: 8 },
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f}
              </Text>
              {hasBadge && (
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ✅ Cards Grid using ItemDetailCard */}
      <ScrollView
        style={styles.cardList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cardGrid}
      >
        {filtered.map((item) => (
          <ItemDetailCard
            key={item.id}
            item={item}
            cardWidth={cardWidth}
            showStatus={true}   // ✅ shows status badge (rack only)
            onPress={() => router.push(`/(tabs)/item/${encodeURIComponent(item.id)}`)}
          />
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Transfer Ownership Button */}
      <TouchableOpacity
        style={styles.transferBtn}
        onPress={() => router.push(
          `/(tabs)/item/${encodeURIComponent(items[0]?.id ?? '#AZEDR')}/transferownership`
        )}
      >
        <Text style={styles.transferIcon}>↗</Text>
        <Text style={styles.transferText}>Transfer Ownership</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 10,
  },
  devSwitcher: {
    backgroundColor: '#7B3FE4', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
    alignItems: 'center', marginBottom: 10,
  },
  devSwitcherText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  title:     { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 8 },
  totalRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#111' },
  totalPol:   { fontSize: 14, fontWeight: '800', color: '#111' },
  totalUsd:   { fontSize: 14, fontWeight: '600', color: '#555' },
  polDot:     { backgroundColor: '#7B3FE4' },

  filterScroll: {
    marginBottom: 16, flexGrow: 0,
    marginHorizontal: -20, paddingHorizontal: 20,
  },
  filterContainer: { gap: 8, paddingRight: 20, alignItems: 'center' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 18,
    borderRadius: 20, borderWidth: 1, borderColor: '#ddd', gap: 6,
  },
  filterBtnActive:       { backgroundColor: '#111', borderColor: '#111' },
  filterText:            { fontSize: 14, color: '#555', fontWeight: '500' },
  filterTextActive:      { color: '#fff', fontWeight: '700' },
  filterBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#333', alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeActive:     { backgroundColor: '#fff' },
  filterBadgeText:       { fontSize: 10, fontWeight: '800', color: '#fff' },
  filterBadgeTextActive: { color: '#111' },

  cardList: { flex: 1 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  emptyState: { width: '100%', paddingVertical: 60, alignItems: 'center' },
  emptyText:  { fontSize: 15, color: '#aaa' },

  transferBtn: {
    position: 'absolute', bottom: 24, right: 20,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', paddingHorizontal: 20,
    paddingVertical: 14, borderRadius: 14, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  transferIcon: { color: '#fff', fontSize: 16 },
  transferText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
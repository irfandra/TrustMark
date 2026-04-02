// components/tab-page/CollectionDetailTabs.jsx
import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, useWindowDimensions, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CatalogItemCard from "../card/CatalogItemCard";
import ActivityCard from "../card/ActivityCard";
import OwnerCard from "../card/OwnerCard";
import ItemSpecFilterDrawer, { SPEC_FILTERS } from "../filter/ItemSpecFilterDrawer";

// ── Catalog Tab ────────────────────────────────────────────────────
export function CatalogTab({ items }) {
  const [search,        setSearch]        = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const { width } = useWindowDimensions();
  const cardWidth = (width - 48) / 2;
  const router = useRouter();

  const handleItemPress = (item) => {
    router.push({
      pathname: "/(tabs)/(collector)/marketplace/collection/product/[variantId]",
      params: {
        variantId:  item.id,
        name:       item.name,
        collection: item.collection,
        brand:      item.brand,
        brandLogo:  item.brandLogo,
        image:      item.image,
        available:  item.available,
        total:      item.total,
        price:      item.price,
        usd:        item.usd,
        rarity:     item.rarity,
      },
    });
  };

  const handleApplyFilter = (filters) => setActiveFilters(filters);

  const removeFilter = (specId, option) => {
    setActiveFilters((prev) => ({
      ...prev,
      [specId]: (prev[specId] ?? []).filter((o) => o !== option),
    }));
  };

  const clearAllFilters = () => setActiveFilters({});

  // ✅ Pills with spec label
  const filterPills = Object.entries(activeFilters).flatMap(([specId, options]) => {
    const specLabel = SPEC_FILTERS.find((s) => s.id === specId)?.label ?? specId;
    return options.map((option) => ({ specId, specLabel, option }));
  });

  const totalActiveFilters = filterPills.length;

  // ✅ Filter items
  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterPills.length === 0) return true;
    return filterPills.some(({ specId, option }) => {
      const specValue = item.specs?.[specId];
      return specValue?.toLowerCase() === option.toLowerCase();
    });
  });

  return (
    <View>
      {/* Header */}
      <View style={styles.tabSectionHeader}>
        <Text style={styles.tabSectionTitle}>Catalog</Text>
        <TouchableOpacity
          style={[styles.filterBtn, totalActiveFilters > 0 && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={totalActiveFilters > 0 ? '#fff' : '#1E2C3A'}
          />
          <Text style={[styles.filterText, totalActiveFilters > 0 && styles.filterTextActive]}>
            Filter{totalActiveFilters > 0 ? ` (${totalActiveFilters})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#8A7C6A" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search Catalog"
          placeholderTextColor="#8A7C6A"
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#8A7C6A" />
          </TouchableOpacity>
        )}
      </View>

      {/* ✅ Active filter pills */}
      {filterPills.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsScroll}
          contentContainerStyle={styles.pillsContainer}
        >
          {/* Clear all pill */}
          <TouchableOpacity style={styles.clearPill} onPress={clearAllFilters}>
            <Ionicons name="close" size={12} color="#E74C3C" />
            <Text style={styles.clearPillText}>Clear All</Text>
          </TouchableOpacity>

          {/* ✅ "SpecLabel: Option ×" pills */}
          {filterPills.map(({ specId, specLabel, option }) => (
            <TouchableOpacity
              key={`${specId}-${option}`}
              style={styles.filterPill}
              onPress={() => removeFilter(specId, option)}
            >
              <Text style={styles.filterPillLabel}>{specLabel}: </Text>
              <Text style={styles.filterPillValue}>{option}</Text>
              <Ionicons name="close" size={12} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Grid */}
      <View style={styles.catalogGrid}>
        {filtered.map((item) => (
          <CatalogItemCard
            key={item.id}
            item={item}
            cardWidth={cardWidth}
            onPress={() => handleItemPress(item)}
          />
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={36} color="#ddd" />
            <Text style={styles.emptyText}>No items match your filter</Text>
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.emptyAction}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Drawer */}
      <ItemSpecFilterDrawer
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilter}
        selected={activeFilters}
      />
    </View>
  );
}

// ── Activity Tab ───────────────────────────────────────────────────
export function ActivityTab({ items }) {
  return (
    <View>
      <View style={styles.tabSectionHeader}>
        <Text style={styles.tabSectionTitle}>Activity</Text>
        <Text style={styles.tabSectionCount}>{items.length} events</Text>
      </View>
      <View style={styles.listWrap}>
        {items.map((item) => (
          <ActivityCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

// ── Owners Tab ─────────────────────────────────────────────────────
export function OwnersTab({ items }) {
  return (
    <View>
      <View style={styles.tabSectionHeader}>
        <Text style={styles.tabSectionTitle}>Owners</Text>
        <Text style={styles.tabSectionCount}>{items.length} holders</Text>
      </View>
      <View style={styles.listWrap}>
        {items.map((owner, index) => (
          <OwnerCard key={owner.id} owner={owner} rank={index + 1} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabSectionTitle: { fontSize: 26, fontWeight: "900", color: "#1E2C3A" },
  tabSectionCount: { fontSize: 13, fontWeight: "600", color: "#8A7C6A" },

  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
    borderColor: "#D6C8B5", backgroundColor: "#FFF9F0",
  },
  filterBtnActive:  { backgroundColor: "#D95F47", borderColor: "#D95F47" },
  filterText:       { fontSize: 13, fontWeight: "600", color: "#1E2C3A" },
  filterTextActive: { color: "#fff" },

  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF9F0", borderRadius: 14,
    marginHorizontal: 16, marginVertical: 10,
    paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: "#E4D9C9", gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1E2C3A" },

  // Pills
  pillsScroll:     { marginHorizontal: 16, marginBottom: 10 },
  pillsContainer:  { gap: 8, paddingRight: 16, alignItems: 'center' },

  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1E2C3A', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 999,
  },
  filterPillLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12, fontWeight: '500',
  },
  filterPillValue: {
    color: '#fff',
    fontSize: 12, fontWeight: '700',
  },
  clearPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF2EC', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: '#F4C0B4',
  },
  clearPillText: { color: '#D95F47', fontSize: 12, fontWeight: '600' },

  catalogGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 12, paddingHorizontal: 16,
  },

  emptyState: {
    width: '100%', paddingVertical: 40,
    alignItems: 'center', gap: 8,
  },
  emptyText:   { fontSize: 14, color: '#8A7C6A', fontWeight: '600' },
  emptyAction: { fontSize: 13, color: '#2D4A6A', fontWeight: '600', marginTop: 4 },

  listWrap: { padding: 16, paddingTop: 8, gap: 8 },
});
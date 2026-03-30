// app/(tabs)/(collector)/marketplace/brand/[brandId].jsx
import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ImageBackground, ScrollView, Image,
  TextInput, useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CollectionCard from "@/components/card/CollectionCard";
import BrandCategoryFilterDrawer from "@/components/filter/BrandCategoryFilterDrawer";

const BRANDS_DATA = {
  1: {
    id: 1,
    name: "Hermès",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
    coverImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60",
    collections: [
      {
        id: 1,
        tag: "Rare",
        name: "Birkin Collections",
        category: "Luxury Bags",
        items: 4000,
        sold: 3200,
        floorPrice: "POL 104,192",
        floorUsd: "~$10,000",
        saleEndsInDays: 14,
        brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
        brand: "Hermès",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=60",
      },
      {
        id: 2,
        tag: "Rare",
        name: "Kelly Collections",
        category: "Luxury Bags",
        items: 8000,
        sold: 7200,
        floorPrice: "POL 85,192",
        floorUsd: "~$7,000",
        saleEndsInDays: 14,
        brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
        brand: "Hermès",
        image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=400&q=60",
      },
    ],
  },
  2: {
    id: 2,
    name: "Nintendo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png",
    coverImage: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=60",
    collections: [
      {
        id: 3,
        tag: "Limited",
        name: "Pokemon Card Set",
        category: "Collectibles",
        items: 200,
        sold: 136,
        floorPrice: "POL 52,100",
        floorUsd: "~$5,000",
        saleEndsInDays: 3,
        brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png",
        brand: "Nintendo",
        image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=60",
      },
    ],
  },
};

export default function BrandDetail() {
  const { brandId } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [search,        setSearch]        = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  const brand      = BRANDS_DATA[brandId] ?? BRANDS_DATA[1];
  const cardWidth  = (width - 48) / 2;
  const cardHeight = cardWidth * 1.4;

  const handleApplyFilter = (filters) => setActiveFilters(filters);

  const removeFilter    = (label) =>
    setActiveFilters((prev) => prev.filter((l) => l !== label));

  const clearAllFilters = () => setActiveFilters([]);

  const totalActiveFilters = activeFilters.length;

  // ✅ Filter collections by search + active category filters
  const filtered = brand.collections.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilters.length === 0) return true;
    return activeFilters.includes(c.category);
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <ImageBackground
          source={{ uri: brand.coverImage }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.brandIdentity}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: brand.logo }}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>{brand.name}</Text>
          </View>
        </ImageBackground>

        {/* COLLECTIONS HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Collections</Text>
          <TouchableOpacity
            style={[styles.filterBtn, totalActiveFilters > 0 && styles.filterBtnActive]}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={totalActiveFilters > 0 ? '#fff' : '#111'}
            />
            <Text style={[styles.filterText, totalActiveFilters > 0 && styles.filterTextActive]}>
              Filter{totalActiveFilters > 0 ? ` (${totalActiveFilters})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#aaa" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Collections"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ Active filter pills */}
        {activeFilters.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsScroll}
            contentContainerStyle={styles.pillsContainer}
          >
            {/* Clear all */}
            <TouchableOpacity style={styles.clearPill} onPress={clearAllFilters}>
              <Ionicons name="close" size={12} color="#E74C3C" />
              <Text style={styles.clearPillText}>Clear All</Text>
            </TouchableOpacity>

            {/* ✅ "Category: Label ×" pills */}
            {activeFilters.map((label) => (
              <TouchableOpacity
                key={label}
                style={styles.filterPill}
                onPress={() => removeFilter(label)}
              >
                <Text style={styles.filterPillLabel}>Category: </Text>
                <Text style={styles.filterPillValue}>{label}</Text>
                <Ionicons name="close" size={12} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* GRID */}
        <View style={styles.grid}>
          {filtered.map((collection) => (
            <CollectionCard
              key={collection.id}
              tag={collection.tag}
              brand={collection.brand}
              brandLogo={collection.brandLogo}
              name={collection.name}
              category={collection.category}
              items={collection.items}
              sold={collection.sold}
              floorPrice={collection.floorPrice}
              floorUsd={collection.floorUsd}
              image={collection.image}
              saleEndsInDays={collection.saleEndsInDays}
              saleEndsInSeconds={collection.saleEndsInSeconds}
              style={{ width: cardWidth, height: cardHeight }}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(collector)/marketplace/collection/[id]",
                  params: {
                    id:                collection.id,
                    tag:               collection.tag,
                    brand:             collection.brand,
                    brandLogo:         collection.brandLogo,
                    name:              collection.name,
                    category:          collection.category,
                    items:             collection.items,
                    sold:              collection.sold,
                    floorPrice:        collection.floorPrice,
                    floorUsd:          collection.floorUsd,
                    image:             collection.image,
                    saleEndsInDays:    collection.saleEndsInDays,
                    saleEndsInSeconds: collection.saleEndsInSeconds,
                  },
                })
              }
            />
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={36} color="#ddd" />
              <Text style={styles.emptyText}>No collections found</Text>
              {activeFilters.length > 0 && (
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={styles.emptyAction}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ✅ Brand Category Filter Drawer */}
      <BrandCategoryFilterDrawer
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilter}
        selected={activeFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  hero:      { height: 280, justifyContent: "space-between" },
  heroImage: { borderRadius: 0 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backBtn: {
    flexDirection: "row", alignItems: "center",
    marginTop: 56, marginLeft: 16, gap: 4,
  },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  brandIdentity: {
    flexDirection: "row", alignItems: "center",
    gap: 14, paddingHorizontal: 20, paddingBottom: 24,
  },
  logoContainer: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#fff", alignItems: "center",
    justifyContent: "center", overflow: "hidden",
  },
  brandLogo: { width: 44, height: 44 },
  brandName: {
    fontSize: 32, fontWeight: "900",
    color: "#fff", letterSpacing: -0.5,
  },

  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4,
  },
  sectionTitle:     { fontSize: 26, fontWeight: "900", color: "#111" },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: "#ddd", backgroundColor: "#fff",
  },
  filterBtnActive:  { backgroundColor: "#111", borderColor: "#111" },
  filterText:       { fontSize: 13, fontWeight: "600", color: "#111" },
  filterTextActive: { color: "#fff" },

  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12,
    marginHorizontal: 16, marginVertical: 10,
    paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: "#e8e8e8", gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },

  // ✅ Pills
  pillsScroll:    { marginHorizontal: 16, marginBottom: 10 },
  pillsContainer: { gap: 8, paddingRight: 16, alignItems: 'center' },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#111', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 20,
  },
  filterPillLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500' },
  filterPillValue: { color: '#fff', fontSize: 12, fontWeight: '700' },
  clearPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF2F2', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#FECACA',
  },
  clearPillText: { color: '#E74C3C', fontSize: 12, fontWeight: '600' },

  grid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 12, paddingHorizontal: 16,
  },
  emptyState: {
    width: '100%', paddingVertical: 40,
    alignItems: 'center', gap: 8,
  },
  emptyText:   { fontSize: 14, color: '#aaa', fontWeight: '600' },
  emptyAction: { fontSize: 13, color: '#2980B9', fontWeight: '600', marginTop: 4 },
});
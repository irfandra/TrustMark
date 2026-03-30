import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CollectionCard from "../../../../components/card/CollectionCard";
import BrandCard from "../../../../components/card/BrandCard";
import CategoryFilterDrawer from "../../../../components/filter/CategoryFilterDrawer";

const COLLECTIONS = [
  {
    id: "c1",
    tag: "Rare",
    brand: "Hermes",
    brandLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
    name: "Birkin Brownies",
    category: "Luxury Bags",
    items: 20,
    sold: 9,
    floorPrice: "POL 120,100",
    floorUsd: "~$11,000",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60",
    saleEndsInDays: 7,
    description: "Limited offchain sample collection for collector browsing.",
    available: 11,
    total: 20,
    specs: [
      { label: "Category", value: "Luxury Bags" },
      { label: "Authenticity", value: "Offchain Verified" },
    ],
  },
  {
    id: "c2",
    tag: "Limited",
    brand: "Hermes",
    brandLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
    name: "Birkin Bluestorn",
    category: "Luxury Bags",
    items: 12,
    sold: 3,
    floorPrice: "POL 118,500",
    floorUsd: "~$10,700",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60",
    saleEndsInDays: 4,
    description: "Blue variant edition with offchain test inventory.",
    available: 9,
    total: 12,
    specs: [
      { label: "Category", value: "Luxury Bags" },
      { label: "Authenticity", value: "Offchain Verified" },
    ],
  },
  {
    id: "p1",
    tag: "Common",
    brand: "Nintendo",
    brandLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png",
    name: "Pokemon Card Set",
    category: "Collectibles",
    items: 8,
    sold: 2,
    floorPrice: "POL 52,100",
    floorUsd: "~$4,700",
    image:
      "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=60",
    saleEndsInSeconds: 36000,
    description: "Trading card series for collector-side demo.",
    available: 6,
    total: 8,
    specs: [
      { label: "Category", value: "Collectibles" },
      { label: "Authenticity", value: "Offchain Verified" },
    ],
  },
];

const BRANDS = [
  {
    id: 1,
    name: "Hermes",
    category: "Luxury Bags",
    logo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 2,
    name: "Nintendo",
    category: "Collectibles",
    logo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png",
    image:
      "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=60",
  },
];

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState("Collections");
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const removeFilter = (label) =>
    setActiveFilters((prev) => prev.filter((f) => f !== label));

  const filteredCollections = useMemo(() => {
    return COLLECTIONS.filter((col) => {
      const matchSearch =
        col.name.toLowerCase().includes(search.toLowerCase()) ||
        col.brand.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        activeFilters.length === 0 ||
        activeFilters.includes(col.category) ||
        activeFilters.some((f) => col.category.includes(f));
      return matchSearch && matchFilter;
    });
  }, [search, activeFilters]);

  const filteredBrands = useMemo(() => {
    return BRANDS.filter((brand) => {
      const matchSearch = brand.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        activeFilters.length === 0 ||
        activeFilters.includes(brand.category) ||
        activeFilters.some((f) => brand.category.includes(f));
      return matchSearch && matchFilter;
    });
  }, [search, activeFilters]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>

        <View style={styles.tabContainer}>
          {["Collections", "Brands"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              placeholder={`Search ${activeTab}`}
              style={styles.searchInput}
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, activeFilters.length > 0 && styles.filterBtnActive]}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilters.length > 0 ? "#fff" : "#111"}
            />
            {activeFilters.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilters.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeFilters.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTagsRow}
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {activeFilters.map((f) => (
              <TouchableOpacity key={f} style={styles.filterTag} onPress={() => removeFilter(f)}>
                <Text style={styles.filterTagText}>{f}</Text>
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {activeTab === "Collections" ? (
        <CollectionTab router={router} listings={filteredCollections} />
      ) : (
        <BrandTab router={router} brands={filteredBrands} />
      )}

      <CategoryFilterDrawer
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={setActiveFilters}
        selected={activeFilters}
      />
    </View>
  );
}

function CollectionTab({ router, listings }) {
  const { width } = useWindowDimensions();

  const PADDING = 20;
  const GAP = 12;
  const cardsPerRow = width < 768 ? 2 : 4;
  const totalGap = GAP * (cardsPerRow - 1);
  const cardWidth = (width - PADDING * 2 - totalGap) / cardsPerRow;
  const cardHeight = cardWidth * 1.4;

  return (
    <ScrollView contentContainerStyle={styles.scrollWrap}>
      <View style={[styles.grid, { gap: GAP, paddingHorizontal: PADDING }]}> 
        {listings.map((col) => (
          <CollectionCard
            key={col.id}
            tag={col.tag}
            brand={col.brand}
            brandLogo={col.brandLogo}
            name={col.name}
            category={col.category}
            items={col.items}
            sold={col.sold}
            floorPrice={col.floorPrice}
            floorUsd={col.floorUsd}
            image={col.image}
            saleEndsInDays={col.saleEndsInDays}
            saleEndsInSeconds={col.saleEndsInSeconds}
            style={{ width: cardWidth, height: cardHeight }}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(collector)/marketplace/collection/[id]",
                params: {
                  id: col.id,
                  tag: col.tag,
                  brand: col.brand,
                  brandLogo: col.brandLogo,
                  name: col.name,
                  category: col.category,
                  items: col.items,
                  sold: col.sold,
                  floorPrice: col.floorPrice,
                  floorUsd: col.floorUsd,
                  image: col.image,
                  description: col.description,
                  available: col.available,
                  total: col.total,
                  specs: JSON.stringify(col.specs ?? []),
                  saleEndsInDays: col.saleEndsInDays,
                  saleEndsInSeconds: col.saleEndsInSeconds,
                },
              })
            }
          />
        ))}
        {listings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No collections found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function BrandTab({ router, brands }) {
  const { width } = useWindowDimensions();

  const PADDING = 20;
  const GAP = 12;
  const cardsPerRow = width < 768 ? 2 : 4;
  const totalGap = GAP * (cardsPerRow - 1);
  const cardWidth = (width - PADDING * 2 - totalGap) / cardsPerRow;
  const cardHeight = cardWidth * 1.1;

  return (
    <ScrollView contentContainerStyle={styles.scrollWrap}>
      <View style={[styles.grid, { gap: GAP, paddingHorizontal: PADDING }]}> 
        {brands.map((brand) => (
          <BrandCard
            key={brand.id}
            {...brand}
            style={{ width: cardWidth, height: cardHeight }}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(collector)/marketplace/brand/[brandId]",
                params: { brandId: brand.id },
              })
            }
          />
        ))}
        {brands.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No brands found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  tabText: {
    fontSize: 15,
    color: "#555",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#111",
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    backgroundColor: "#111",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  filterTagsRow: {
    marginTop: 8,
    marginBottom: 2,
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollWrap: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyState: {
    width: "100%",
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#aaa",
    fontWeight: "500",
  },
});

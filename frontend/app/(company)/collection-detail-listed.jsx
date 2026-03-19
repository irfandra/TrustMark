import React, { useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text, Image, ImageBackground,
  StyleSheet, TouchableOpacity, TextInput, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const { width: SW } = Dimensions.get("window");
const isTablet = SW >= 768;

const CATALOG_ITEMS = [
  { id: "1", name: "Birkin Brownies", collection: "Birkin Collections", brand: "Hermès", available: 1000, total: 1500, priceAmount: "120,100", priceUsd: "~$11,000", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600" },
  { id: "2", name: "Birkin Bluestorn", collection: "Birkin Collections", brand: "Hermès", available: 500, total: 1500, priceAmount: "120,100", priceUsd: "~$11,000", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600" },
];

const ACTIVITY = [
  { event: "Transfer", item: "#EA4GH", price: "120,100", from: "@glimpse27", to: "0sfwer2...13s" },
  { event: "Mint",     item: "#TH43S",  price: "120,100", from: "0sfwer2...13s", to: "@glimpse27" },
];

const OWNERS = [
  { id: "#EA4GH", edition: "124 of 1500", price: "120,100" },
  { id: "#TH43S", edition: "125 of 1500", price: "120,100" },
];

const PolIcon = ({ size = 18 }) => (
  <View style={[s.polIcon, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[s.polIconText, { fontSize: size * 0.5 }]}>P</Text>
  </View>
);

const SectionHeader = ({ title, count, onFilter }) => (
  <View style={s.sectionHeaderRow}>
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text style={s.sectionHeaderTitle}>{title}</Text>
      {count ? <Text style={s.sectionHeaderCount}>  {count}</Text> : null}
    </View>
    <TouchableOpacity style={s.filterBtn} onPress={onFilter}>
      <Ionicons name="menu" size={18} color="#222" />
      <Text style={s.filterText}>Filter</Text>
    </TouchableOpacity>
  </View>
);

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <View style={s.searchWrap}>
    <Ionicons name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
    <TextInput style={s.searchInput} placeholder={placeholder} placeholderTextColor="#aaa" value={value} onChangeText={onChange} />
  </View>
);

const DataTable = ({ headers, rows, renderRow }) => (
  <View style={s.table}>
    <View style={[s.tableRow, { marginBottom: 4 }]}>
      {headers.map((h, i) => (
        <Text key={i} numberOfLines={1} ellipsizeMode="tail"
          style={[s.tableCell, s.tableHeaderText, { flex: h.flex || 1 }]}>
          {h.label}
        </Text>
      ))}
    </View>
    {rows.map((row, idx) => (
      <View key={idx} style={[s.tableRow, idx < rows.length - 1 && s.tableRowCard]}>
        {renderRow(row)}
      </View>
    ))}
  </View>
);

export default function CollectionDetailListed() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Catalog");

  const heroImage    = params.image ? decodeURIComponent(params.image) : "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800";
  const title        = params.title    || "Birkin Collections";
  const subtitle     = params.subtitle || "Luxury Bags";
  const endDate      = params.endDate  || "Ends in 14/04/2026  23:59";
  const status       = params.status   || "Listed";
  const tag          = params.tag      || "Rare";
  const tagColor     = params.tagColor || "#111";
  const tagTextColor = params.tagTextColor || "#fff";
  const totalItems   = params.items?.replace(/[^0-9,]/g, "") || "1,500";

  const filtered = CATALOG_ITEMS.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) ||
           i.collection.toLowerCase().includes(search.toLowerCase())
  );

  const handleCardPress = (item) =>
    router.push({
      pathname: "/item-detail",
      params: { itemId: item.id, name: item.name, collection: item.collection, brand: item.brand, available: item.available, total: item.total, priceAmount: item.priceAmount, priceUsd: item.priceUsd, image: encodeURIComponent(item.image) },
    });

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

          {/* ── Hero ── */}
          <View style={s.heroWrap}>
            <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={s.heroOverlay} />

            {/* FIX: Back button — white pill style matching design */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={16} color="#000" />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>

            <View style={s.heroContent}>
              <View style={[s.badge, { backgroundColor: tagColor }]}>
                <Text style={[s.badgeText, { color: tagTextColor }]}>{tag}</Text>
              </View>
              <Text style={s.heroTitle}>{title}</Text>
              <View style={s.heroSubRow}>
                {[subtitle, status, endDate].map((t, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Text style={s.heroDivider}> | </Text>}
                    <Text style={s.heroSub}>{t}</Text>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>

          {/* ── Stats — floats over hero ── */}
          <View style={s.statsRow}>
            {[["Total Items", totalItems], ["Sold", "0"]].map(([label, val]) => (
              <View key={label} style={s.statCard}>
                <Text style={s.statLabel}>{label}</Text>
                <Text style={s.statValue}>{val}</Text>
              </View>
            ))}
          </View>

          {/* ── About ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.bodyText}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi interdum orci vel
              vestibulum lobortis. Sed eros erat, finibus eleifend magna nec, posuere eleifend
              ante. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per
              inceptos himenaeos.
            </Text>
          </View>

          {/* ── Tabs ── */}
          <View style={s.tabs}>
            {["Catalog", "Activity", "Owners"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Catalog Tab ── */}
          {activeTab === "Catalog" && (
            <>
              <SectionHeader title="Catalog" count="200/ 4,000" />
              <SearchBar value={search} onChange={setSearch} placeholder="Search Catalog" />
              <View style={s.grid}>
                {filtered.map((item) => (
                  <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85} onPress={() => handleCardPress(item)}>
                    <ImageBackground source={{ uri: item.image }} style={s.cardBg} imageStyle={s.cardBgImg}>
                      <View style={s.cardOverlay} />
                      <View style={s.cardContent}>
                        <View style={s.cardBrandRow}>
                          <View style={s.brandCircle}><Text style={s.brandCircleText}>H</Text></View>
                          <Text style={s.cardBrand}>{item.brand}</Text>
                        </View>
                        <Text style={s.cardName}>{item.name}</Text>
                        <Text style={s.cardCollection}>{item.collection}</Text>
                        <Text style={s.cardAvailable}>{item.available.toLocaleString()} of {item.total.toLocaleString()} items</Text>
                        <View style={s.cardPriceRow}>
                          <PolIcon size={16} />
                          <Text style={s.cardPriceToken}>POL</Text>
                          <Text style={s.cardPriceAmt}>{item.priceAmount}</Text>
                          <Text style={s.cardPriceUsd}>{item.priceUsd}</Text>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── Activity Tab ── */}
          {activeTab === "Activity" && (
            <>
              <SectionHeader title="Activity" />
              <SearchBar value={search} onChange={setSearch} placeholder="Search Activity" />
              <View style={s.tableSection}>
                <DataTable
                  headers={[{ label: "Event" }, { label: "Items" }, { label: "Price" }, { label: "From" }, { label: "To" }]}
                  rows={ACTIVITY}
                  renderRow={(row) => [
                    <Text key="e" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1, fontSize: 12 }]}>{row.event}</Text>,
                    <Text key="i" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1, fontSize: 12 }]}>{row.item}</Text>,
                    <View key="p" style={{ flex: 1, flexDirection: "row", alignItems: "center", overflow: "hidden" }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#333" }}>POL </Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 11, flex: 1, color: "#333" }}>{row.price}</Text>
                    </View>,
                    <Text key="f" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1, fontSize: 11 }]}>{row.from}</Text>,
                    <Text key="t" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1, fontSize: 11 }]}>{row.to}</Text>,
                  ]}
                />
              </View>
            </>
          )}

          {/* ── Owners Tab ── */}
          {activeTab === "Owners" && (
            <>
              <SectionHeader title="Owners" />
              <SearchBar value={search} onChange={setSearch} placeholder="Search Owners" />
              <View style={s.tableSection}>
                <DataTable
                  headers={[{ label: "Owners", flex: 1.2 }, { label: "Items", flex: 1.5 }, { label: "Total Value", flex: 1.8 }]}
                  rows={OWNERS}
                  renderRow={(row) => [
                    <Text key="id" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1.2 }]}>{row.id}</Text>,
                    <Text key="ed" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1.5 }]}>{row.edition}</Text>,
                    <View key="pr" style={{ flex: 1.8, flexDirection: "row", alignItems: "center", gap: 4, overflow: "hidden" }}>
                      <PolIcon size={16} />
                      <Text style={s.tablePriceLabel}>POL</Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1 }]}>{row.price}</Text>
                    </View>,
                  ]}
                />
              </View>
            </>
          )}

        </ScrollView>

        {/* ── Footer ── */}
        {activeTab === "Catalog" && (
          <View style={s.footer}>
            <TouchableOpacity style={s.mintBtn} onPress={() => router.push("/(company)/generate-all-qr-collections")}>
              <Text style={s.mintBtnText}>Generate All QR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // FIX: page background is WHITE, not gray
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },

  // Hero — FIX: zIndex + overflow visible so backBtn is clickable
  heroWrap: { width: "100%", height: 280, zIndex: 1, overflow: "visible" },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", backgroundColor: "rgba(0,0,0,0.55)" },

  // FIX: Back button — white pill, top-left, always visible
  backBtn: {
    position: "absolute", top: 16, left: 16, zIndex: 20,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, gap: 2,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  backText: { color: "#000", fontSize: 15, fontWeight: "600" },

  heroContent: { position: "absolute", bottom: 32, left: 0, right: 0, padding: 16 },
  badge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 10 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 6 },
  heroSubRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  heroSub: { color: "#ddd", fontSize: 13, fontStyle: "italic" },
  heroDivider: { color: "#aaa", fontSize: 13 },

  // Stats — floats over hero
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginTop: -28, zIndex: 10 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  statLabel: { fontSize: 14, color: "#333", fontWeight: "600" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111" },

  // Sections — white background
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 8 },
  bodyText: { fontSize: 15, color: "#333", lineHeight: 23 },

  // Tabs
  tabs: { flexDirection: "row", marginTop: 24, marginBottom: 4, paddingHorizontal: 10 },
  tabBtn: { flex: 1, paddingVertical: 11, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, alignItems: "center", marginHorizontal: 4 },
  tabBtnActive: { backgroundColor: "#000", borderColor: "#000" },
  tabText: { fontSize: isTablet ? 17 : 15, color: "#333" },
  tabTextActive: { color: "#fff", fontWeight: "600" },

  // Section header
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 26, fontWeight: "900", color: "#111" },
  sectionHeaderCount: { fontSize: 14, color: "#888" },
  filterBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#ccc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, gap: 6, backgroundColor: "#fff" },
  filterText: { fontSize: 14, color: "#222", fontWeight: "500" },

  // Search — white bar on white page
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#e0e0e0", marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15, color: "#333" },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
  card: { width: "47%", borderRadius: 18, overflow: "hidden", height: 200 },
  cardBg: { flex: 1, justifyContent: "flex-end" },
  cardBgImg: { borderRadius: 18 },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.40)", borderRadius: 18 },
  cardContent: { padding: 10 },
  cardBrandRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  brandCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#e87722", justifyContent: "center", alignItems: "center" },
  brandCircleText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  cardBrand: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cardName: { color: "#fff", fontSize: 14, fontWeight: "800", marginBottom: 1 },
  cardCollection: { color: "#ddd", fontSize: 11, marginBottom: 1 },
  cardAvailable: { color: "#ccc", fontSize: 10, fontStyle: "italic", marginBottom: 6 },
  cardPriceRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardPriceToken: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardPriceAmt: { color: "#fff", fontSize: 11, fontWeight: "600" },
  cardPriceUsd: { color: "#bbb", fontSize: 10, textDecorationLine: "line-through" },

  // Table — FIX: table bg is gray (#f2f2f2), rows are white — correct order
  tableSection: { paddingHorizontal: 16, marginTop: 4 },
  table: { backgroundColor: "#f2f2f2", borderRadius: 14, paddingHorizontal: 8, paddingVertical: 8 },
  tableRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f2f2f2", paddingVertical: 11, paddingHorizontal: 4 },
  tableRowCard: { backgroundColor: "#fff", borderRadius: 10, marginVertical: 3, paddingHorizontal: 10, elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4 },
  tableCell: { flex: 1, fontSize: 13, color: "#333", overflow: "hidden" },
  tableHeaderText: { fontWeight: "700", fontStyle: "italic", fontSize: 13, color: "#222" },
  tablePriceLabel: { fontSize: 13, fontWeight: "700", color: "#111" },

  // POL
  polIcon: { backgroundColor: "#7b5ea7", justifyContent: "center", alignItems: "center" },
  polIconText: { color: "#fff", fontWeight: "700" },

  // Footer — FIX: white background matches page
  footer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e8e8e8" },
  mintBtn: { flex: 1, backgroundColor: "#111", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  mintBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

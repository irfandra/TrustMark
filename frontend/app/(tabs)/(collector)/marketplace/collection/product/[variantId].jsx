import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const PolDot = ({ size = 16 }) => (
  <View style={[styles.polDot, { width: size, height: size, borderRadius: size / 2 }]} />
);

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

export default function ProductVariantDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const item = useMemo(() => {
    const total = Number(parseParam(params.total) || 0);
    const available = Number(parseParam(params.available) || 0);

    return {
      variantId: parseParam(params.variantId) || "VARIANT-1",
      name: parseParam(params.name) || "Marketplace Item",
      collection: parseParam(params.collection) || "Collection",
      brand: parseParam(params.brand) || "Brand",
      brandLogo: parseParam(params.brandLogo) || "",
      image:
        parseParam(params.image) ||
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60",
      price: parseParam(params.price) || "0",
      usd: parseParam(params.usd) || "",
      rarity: parseParam(params.rarity) || "Common",
      total,
      available,
    };
  }, [params]);

  const purchasableRows = useMemo(() => {
    const count = Math.max(Math.min(item.available || 0, 4), 1);

    return Array.from({ length: count }, (_, idx) => {
      const edition = Math.max((item.total || count) - idx, 1);
      return {
        id: `#${item.variantId}-${String(idx + 1).padStart(2, "0")}`,
        edition,
        total: item.total || count,
        price: item.price,
      };
    });
  }, [item.available, item.price, item.total, item.variantId]);

  const selected = purchasableRows[selectedIndex] || purchasableRows[0];

  const handleBuy = () => {
    router.push({
      pathname: "/(tabs)/(collector)/marketplace/collection/product/checkout",
      params: {
        variantId: item.variantId,
        itemId: selected.id,
        edition: selected.edition,
        total: selected.total,
        price: selected.price,
        name: item.name,
        image: item.image,
        brand: item.brand,
        brandLogo: item.brandLogo,
        collection: item.collection,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ImageBackground source={{ uri: item.image }} style={styles.hero} imageStyle={styles.heroImage}>
            <View style={styles.heroOverlay} />
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.heroBottom}>
              <Text style={styles.heroTitle}>{item.name}</Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroMetaText}>{item.collection}</Text>
                <Text style={styles.heroMetaDivider}>|</Text>
                <Text style={styles.heroMetaText}>{item.brand}</Text>
                <Text style={styles.heroMetaDivider}>|</Text>
                <Text style={styles.heroMetaText}>{item.rarity}</Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionText}>
              This variant page is intentionally mock-driven for collector flow and routes directly
              into checkout and payment screens.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Items</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.3 }]}>Item ID</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Edition</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Price</Text>
            </View>

            <View style={styles.tableBody}>
              {purchasableRows.map((row, index) => (
                <TouchableOpacity
                  key={row.id}
                  style={[
                    styles.tableRow,
                    selectedIndex === index && styles.tableRowActive,
                    index < purchasableRows.length - 1 && styles.tableRowBorder,
                  ]}
                  onPress={() => setSelectedIndex(index)}
                >
                  <Text style={[styles.tableCell, { flex: 1.3 }]}>{row.id}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>
                    {row.edition} / {row.total}
                  </Text>
                  <View style={[styles.priceCell, { flex: 1.5 }]}> 
                    <PolDot size={14} />
                    <Text style={styles.priceCellText}>POL {row.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.bottomBar} onPress={handleBuy} activeOpacity={0.9}>
          <View>
            <Text style={styles.bottomBarTitle}>Buy Item</Text>
            <Text style={styles.bottomBarSub}>{selected.id}</Text>
          </View>
          <View style={styles.bottomBarRight}>
            <PolDot size={18} />
            <Text style={styles.bottomBarPrice}>POL {selected.price}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    height: 280,
    justifyContent: "space-between",
  },
  heroImage: {
    borderRadius: 0,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 56,
    marginLeft: 16,
    gap: 4,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  heroBottom: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroMetaText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "500",
  },
  heroMetaDivider: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  sectionText: {
    color: "#555",
    fontSize: 14,
    lineHeight: 21,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    color: "#777",
    fontStyle: "italic",
    fontWeight: "700",
  },
  tableBody: {
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    padding: 8,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  tableRowBorder: {
    marginBottom: 8,
  },
  tableRowActive: {
    borderWidth: 1,
    borderColor: "#111",
  },
  tableCell: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  priceCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceCellText: {
    fontSize: 13,
    color: "#111",
    fontWeight: "700",
  },
  polDot: {
    backgroundColor: "#7B3FE4",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 30,
  },
  bottomBarTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomBarSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  bottomBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bottomBarPrice: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});

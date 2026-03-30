import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CatalogTab, ActivityTab, OwnersTab } from "@/components/tab-page/Collectiondetailtabs";

const COLLECTION_DETAILS = {
  c1: {
    description:
      "Birkin Brownies collection contains premium offchain units reserved for demo browsing and checkout flow tests.",
    catalog: [
      {
        id: "c1-a",
        name: "Birkin Brownies - Edition A",
        collection: "Luxury Bags",
        available: 6,
        total: 20,
        price: "120,100",
        usd: "~$11,000",
        rarity: "Rare",
        brandLogo:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
        brand: "Hermes",
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60",
        specs: { category: "Luxury Bags" },
      },
      {
        id: "c1-b",
        name: "Birkin Brownies - Edition B",
        collection: "Luxury Bags",
        available: 5,
        total: 20,
        price: "120,100",
        usd: "~$11,000",
        rarity: "Rare",
        brandLogo:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
        brand: "Hermes",
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60",
        specs: { category: "Luxury Bags" },
      },
    ],
    activity: [
      {
        id: "a1",
        event: "Mint",
        item: "#c1-a",
        price: "120,100",
        from: "NullAddress",
        to: "@hermes",
      },
    ],
    ownersList: [
      {
        id: "o1",
        name: "Hermes Vault",
        wallet: "0x1a2b...9c0d",
        quantity: 2,
      },
    ],
  },
  c2: {
    description:
      "Birkin Bluestorn is a compact drop with offchain inventory, intended for test purchases.",
    catalog: [
      {
        id: "c2-a",
        name: "Birkin Bluestorn - Edition A",
        collection: "Luxury Bags",
        available: 4,
        total: 12,
        price: "118,500",
        usd: "~$10,700",
        rarity: "Limited",
        brandLogo:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png",
        brand: "Hermes",
        image:
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60",
        specs: { category: "Luxury Bags" },
      },
    ],
    activity: [],
    ownersList: [],
  },
  p1: {
    description:
      "Pokemon Card Set collector bundle for offchain walkthroughs with deterministic test items.",
    catalog: [
      {
        id: "p1-a",
        name: "Pokemon Card Set - Base",
        collection: "Collectibles",
        available: 6,
        total: 8,
        price: "52,100",
        usd: "~$4,700",
        rarity: "Common",
        brandLogo:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png",
        brand: "Nintendo",
        image:
          "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=60",
        specs: { category: "Collectibles" },
      },
    ],
    activity: [],
    ownersList: [],
  },
};

const readParam = (value) => (Array.isArray(value) ? value[0] : value);

const parseSpecs = (rawSpecs, fallbackCategory) => {
  if (!rawSpecs) {
    return [
      { label: "Category", value: fallbackCategory || "Other" },
      { label: "Authenticity", value: "Offchain Verified" },
    ];
  }

  try {
    const parsed = JSON.parse(rawSpecs);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (_error) {
    // Ignore invalid route payload and use fallback specs.
  }

  return [
    { label: "Category", value: fallbackCategory || "Other" },
    { label: "Authenticity", value: "Offchain Verified" },
  ];
};

export default function CollectionDetail() {
  const params = useLocalSearchParams();
  const routeId = readParam(params.id);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("catalog");

  const collection = useMemo(() => {
    const category = readParam(params.category) || "Other";
    const total = Number(readParam(params.total) || readParam(params.items) || 0);
    const available = Number(readParam(params.available) || 0);

    const base = {
      id: routeId || "unknown",
      tag: readParam(params.tag) || "Common",
      brand: readParam(params.brand) || "Unknown Brand",
      brandLogo: readParam(params.brandLogo) || null,
      name: readParam(params.name) || "Unnamed Product",
      category,
      description:
        readParam(params.description) ||
        "No description available yet. This offchain item can still be purchased and tracked in the app.",
      items: total,
      sold: Number(readParam(params.sold) || Math.max(total - available, 0)),
      floorPrice: readParam(params.floorPrice) || "POL 0",
      floorUsd: readParam(params.floorUsd) || "",
      image:
        readParam(params.image) ||
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60",
      specs: parseSpecs(readParam(params.specs), category),
      saleEndsInDays: Number(readParam(params.saleEndsInDays) || 0) || null,
      saleEndsInSeconds: Number(readParam(params.saleEndsInSeconds) || 0) || null,
    };

    const detail = COLLECTION_DETAILS[routeId] || {};

    return {
      ...base,
      description: detail.description || base.description,
      catalog: detail.catalog || [
        {
          id: String(base.id),
          name: base.name,
          collection: base.category,
          available: available,
          total: total,
          price: String(base.floorPrice).replace("POL", "").trim(),
          usd: base.floorUsd,
          rarity: base.tag,
          brandLogo: base.brandLogo,
          brand: base.brand,
          image: base.image,
          specs: { category: base.category },
        },
      ],
      activity: detail.activity || [],
      ownersList: detail.ownersList || [],
    };
  }, [params, routeId]);

  const tagColor =
    collection.tag === "Rare" ? "#B8860B" :
    collection.tag === "Limited" ? "#C0392B" : "#333";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: collection.image }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.heroBottom}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>{collection.name}</Text>
              <View style={[styles.heroTag, { backgroundColor: tagColor }]}> 
                <Text style={styles.heroTagText}>{collection.tag}</Text>
              </View>
            </View>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaText}>{collection.category}</Text>
              <Text style={styles.heroMetaDivider}>|</Text>
              {collection.brandLogo && (
                <Image
                  source={{ uri: collection.brandLogo }}
                  style={styles.heroMetaLogo}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.heroMetaText}>{collection.brand}</Text>
              {(collection.saleEndsInDays || collection.saleEndsInSeconds) && (
                <>
                  <Text style={styles.heroMetaDivider}>|</Text>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroMetaText}>
                    {collection.saleEndsInDays
                      ? `Sale Ends in ${collection.saleEndsInDays} days`
                      : "Sale Ending Soon"}
                  </Text>
                </>
              )}
            </View>
          </View>
        </ImageBackground>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Total Items</Text>
            <Text style={styles.statCardValue}>{collection.items?.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Sold</Text>
            <Text style={styles.statCardValue}>{collection.sold?.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Floor</Text>
            <Text style={styles.statCardValue} numberOfLines={1}>{collection.floorPrice}</Text>
            <Text style={styles.statCardSub}>{collection.floorUsd}</Text>
          </View>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{collection.description}</Text>
        </View>

        <View style={styles.tabBar}>
          {["catalog", "activity", "owners"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === "catalog" && <CatalogTab items={collection.catalog} />}
          {activeTab === "activity" && <ActivityTab items={collection.activity} />}
          {activeTab === "owners" && <OwnersTab items={collection.ownersList} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  hero: {
    height: 260,
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
    padding: 16,
    gap: 6,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  heroTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  heroMetaText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "500",
  },
  heroMetaDivider: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  heroMetaLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#f96a1b",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingBottom: 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 2,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#aaa",
  },
  statCardValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  statCardSub: {
    fontSize: 10,
    color: "#aaa",
    fontStyle: "italic",
  },
  aboutSection: {
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  aboutText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#ebebeb",
  },
  tabBtnActive: {
    backgroundColor: "#111",
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  tabBtnTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  tabContent: {
    paddingBottom: 40,
  },
});

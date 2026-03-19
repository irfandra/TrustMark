import React from "react";
import {
  SafeAreaView, ScrollView, View, Text, Image,
  StyleSheet, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const PolIcon = ({ size = 16 }) => (
  <View style={[s.polIcon, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[s.polIconText, { fontSize: size * 0.5 }]}>P</Text>
  </View>
);

const InfoRow = ({ label, value, valueStyle }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={[s.infoValue, valueStyle]} numberOfLines={3}>{value}</Text>
  </View>
);

// ── Stage config ───────────────────────────────────────────
const STAGE_CONFIG = {
  process:  { statusLabel: "On Request", buttonLabel: "Process Order", showButton: true },
  shipment: { statusLabel: "On Prepare", buttonLabel: "Ship Item",     showButton: true },
  claim:    { statusLabel: "Shipped",    buttonLabel: null,            showButton: false },
};

export default function ItemOrderDynamic() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const stage       = params.stage      || "process"; // "process" | "shipment" | "claim"
  const name        = params.name       || "Birkin Brownies";
  const itemId      = params.itemId     || "#EA4GH";
  const collection  = params.collection || "Birkin Collections";
  const brand       = params.brand      || "Hermès";
  const available   = params.available  || "124";
  const total       = params.total      || "450";
  const priceAmount = params.priceAmount|| "120,100";
  const priceUsd    = params.priceUsd   || "~$11,000";
  const image       = params.image
    ? decodeURIComponent(params.image)
    : "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600";

  const { statusLabel, buttonLabel, showButton } = STAGE_CONFIG[stage] ?? STAGE_CONFIG.process;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#111" />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          {/* Hero Image */}
          <Image source={{ uri: image }} style={s.heroImage} resizeMode="cover" />

          <View style={s.infoSection}>

            {/* Name + ID badge + status badge */}
            <View style={s.nameRow}>
              <Text style={s.itemName}>{name}</Text>
              <View style={s.idBadge}>
                <Text style={s.idBadgeText}>{itemId}</Text>
              </View>
              <View style={[s.statusBadge, stage === "claim" && s.statusBadgeShipped]}>
                <Text style={[s.statusBadgeText, stage === "claim" && s.statusBadgeTextShipped]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Collection + Brand */}
            <View style={s.collectionRow}>
              <Text style={s.collectionText}>{collection}</Text>
              <Text style={s.byText}> by </Text>
              <View style={s.brandCircle}>
                <Text style={s.brandCircleText}>H</Text>
              </View>
              <Text style={s.brandName}> {brand}</Text>
            </View>

            {/* Edition */}
            <Text style={s.editionText}>Edition {available} of {total} items in Collection</Text>

            {/* Specification */}
            <Text style={s.sectionTitle}>Specification</Text>
            <View style={s.specRow}>
              <View style={s.specGroup}>
                <Text style={s.specGroupLabel}>Color</Text>
                <View style={[s.specTag, { backgroundColor: "#4a90d9" }]}>
                  <Text style={s.specTagText}>Blue</Text>
                </View>
              </View>
              <View style={[s.specGroup, { marginLeft: 20 }]}>
                <Text style={s.specGroupLabel}>Straps</Text>
                <View style={[s.specTag, { backgroundColor: "#c8a84b" }]}>
                  <Text style={s.specTagText}>Gold</Text>
                </View>
              </View>
            </View>

            {/* Latest Transaction */}
            <Text style={s.sectionTitle}>Latest Transaction Detail</Text>
            <View style={s.card}>
              <InfoRow label="Current Owner"      value="@glimpse27" />
              <View style={s.cardDivider} />
              <InfoRow label="Blockchain Contract" value="09ese1sd1sdnaomkasdhmasomkq3er1qweqeqe1321s31er" valueStyle={s.monoText} />
              <View style={s.cardDivider} />
              <InfoRow label="From"  value="@Hermes" />
              <View style={s.cardDivider} />
              <InfoRow label="To"    value="@glimpse27" />
              <View style={s.cardDivider} />
              <InfoRow label="Transaction Value" value={null} />
              <View style={s.priceRow}>
                <PolIcon size={16} />
                <Text style={s.priceToken}>POL</Text>
                <Text style={s.priceAmount}>{priceAmount}</Text>
                <Text style={s.priceUsd}> · {priceUsd}</Text>
              </View>
            </View>

            {/* Delivery Details */}
            <Text style={s.sectionTitle}>Delivery Details</Text>
            <View style={s.card}>
              <InfoRow label="Arrival Time Contract"   value="On Request" />
              <View style={s.cardDivider} />
              <InfoRow label="Arrival Time Estimation" value="14/03/2026" />
              <View style={s.cardDivider} />
              <InfoRow label="Address"        value={"Unit 13-01, Building 37\nUnit 13-01, Singapore, 609784"} />
              <View style={s.cardDivider} />
              <InfoRow label="Recipient Name" value="Gerry Julian" />
              <View style={s.cardDivider} />
              <InfoRow label="Phone Number"   value="+65 23234134" />
            </View>

          </View>
        </ScrollView>

        {/* Footer — hidden when stage is "claim" */}
        {showButton && (
          <View style={s.footer}>
            <TouchableOpacity
              style={s.processBtn}
              onPress={() => alert(`${buttonLabel} pressed`)}
            >
              <Text style={s.processBtnText}>{buttonLabel}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },

  backBtn: { flexDirection: "row", alignItems: "center", gap: 2, padding: 16, paddingBottom: 8 },
  backText: { fontSize: 16, color: "#111", fontWeight: "500" },

  heroImage: { width: "100%", height: 260, backgroundColor: "#f5f5f5" },
  infoSection: { paddingHorizontal: 16, paddingTop: 16 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  itemName: { fontSize: 22, fontWeight: "800", color: "#111" },
  idBadge: { backgroundColor: "#f0f0f0", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  idBadgeText: { fontSize: 12, color: "#555", fontWeight: "600" },

  // Status badge — default gray, shipped = green
  statusBadge: { backgroundColor: "#f0f0f0", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 12, color: "#555", fontWeight: "600" },
  statusBadgeShipped: { backgroundColor: "#e6f9f0" },
  statusBadgeTextShipped: { color: "#27ae60" },

  collectionRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  collectionText: { fontSize: 14, color: "#555" },
  byText: { fontSize: 14, color: "#888" },
  brandCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#e87722", justifyContent: "center", alignItems: "center" },
  brandCircleText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  brandName: { fontSize: 14, color: "#555", fontWeight: "600" },

  editionText: { fontSize: 13, color: "#888", marginBottom: 20, fontStyle: "italic" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 12, marginTop: 4 },

  specRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  specGroup: { alignItems: "flex-start" },
  specGroupLabel: { fontSize: 12, color: "#888", marginBottom: 6 },
  specTag: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7 },
  specTagText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  card: { backgroundColor: "#f7f7f7", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20 },
  cardDivider: { height: 1, backgroundColor: "#efefef" },

  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 12, gap: 12 },
  infoLabel: { fontSize: 13, color: "#888", fontWeight: "500", flex: 1 },
  infoValue: { fontSize: 13, color: "#111", fontWeight: "600", flex: 1.5, textAlign: "right" },
  monoText: { fontSize: 11, color: "#555", fontFamily: "monospace" },

  priceRow: { flexDirection: "row", alignItems: "center", gap: 5, paddingBottom: 12 },
  priceToken: { fontSize: 13, fontWeight: "700", color: "#111" },
  priceAmount: { fontSize: 13, fontWeight: "600", color: "#111" },
  priceUsd: { fontSize: 12, color: "#888" },

  polIcon: { backgroundColor: "#7b5ea7", justifyContent: "center", alignItems: "center" },
  polIconText: { color: "#fff", fontWeight: "700" },

  footer: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e8e8e8" },
  processBtn: { backgroundColor: "#111", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  processBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

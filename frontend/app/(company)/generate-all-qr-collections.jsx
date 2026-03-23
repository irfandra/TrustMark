import React, { useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text,
  StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

// Enable LayoutAnimation on Android
// if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

const ITEMS = [
  { id: "#EA4GH",  name: "Birkin Brownies", edition: "1 of 1500" },
  { id: "#SD3SE2", name: "Birkin Brownies", edition: "2 of 1500" },
  { id: "#ABC0EF", name: "Birkin Brownies", edition: "3 of 1500" },
  { id: "#EGHU7F", name: "Birkin Brownies", edition: "4 of 1500" },
  { id: "#KJ0LF",  name: "Birkin Brownies", edition: "5 of 1500" },
  { id: "#34S0FG", name: "Birkin Brownies", edition: "6 of 1500" },
  { id: "#38FE0S", name: "Birkin Bluish",   edition: "1001 of 1500" },
  { id: "#30FS0S", name: "Birkin Bluish",   edition: "1002 of 1500" },
];

export default function GenerateAllQrCollections() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const collectionName = params.title || "Birkin Collections";
  const [expandedId, setExpandedId] = useState(ITEMS[0].id);

  const toggleExpand = (id) => {
    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#111" />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>Generate All QR</Text>
          <Text style={s.pageSubtitle}>{collectionName}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 12 }}>

          {/* Column headers */}
          <View style={s.tableHeader}>
            <Text style={[s.colHeader, { flex: 1.6 }]}>Items Name</Text>
            <Text style={[s.colHeader, { flex: 1.2 }]}>Items ID</Text>
            <Text style={[s.colHeader, { flex: 1 }]}>Edition</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Rows */}
          {ITEMS.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={s.rowCard}>

                {/* Collapsible trigger row */}
                <TouchableOpacity
                  style={s.tableRow}
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(item.id)}
                >
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[s.cellText, { flex: 1.6 }]}>{item.name}</Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[s.cellText, s.cellId, { flex: 1.2 }]}>{item.id}</Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[s.cellText, { flex: 1 }]}>{item.edition}</Text>
                  <Ionicons
                    name={isExpanded ? "chevron-down" : "chevron-forward"}
                    size={16}
                    color={isExpanded ? "#555" : "#bbb"}
                    style={{ width: 24 }}
                  />
                </TouchableOpacity>

                {/* Collapsible content — same width as row */}
                {isExpanded && (
                  <View style={s.expandedWrap}>
                    <View style={s.expandedDividerH} />
                    <View style={s.expandedRow}>
                      <View style={s.expandedItem}>
                        <Text style={s.expandedLabel}>Product Label</Text>
                        <TouchableOpacity style={s.detailsBtn}>
                          <Text style={s.detailsBtnText}>See Details</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={s.expandedDividerV} />
                      <View style={s.expandedItem}>
                        <Text style={s.expandedLabel}>Certificate</Text>
                        <TouchableOpacity style={s.detailsBtn}>
                          <Text style={s.detailsBtnText}>See Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity style={s.emailBtn}>
            <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.emailBtnText}>Send to Email</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },

  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 16 },
  backText: { fontSize: 16, color: "#111", fontWeight: "500" },
  pageTitle: { fontSize: 26, fontWeight: "900", color: "#111", marginBottom: 2 },
  pageSubtitle: { fontSize: 15, color: "#444", fontWeight: "500" },

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  colHeader: { fontSize: 13, fontWeight: "800", color: "#111" },

  // Each row is a self-contained card
  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: "hidden",
  },

  // Trigger row
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#f0f0f0",
  },
  cellText: { fontSize: 13, color: "#222" },
  cellId: { color: "#666", fontSize: 12 },

  // Expanded content wrapper — inherits full card width automatically
  expandedWrap: { width: "100%" },
  expandedDividerH: { height: 1, backgroundColor: "#f0f0f0" },
 expandedRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#ffff",   // ← was "#ffffff"
  paddingHorizontal: 16,
  paddingVertical: 12,
},

  expandedItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
  },
  expandedLabel: { fontSize: 12, color: "#555", fontWeight: "500", flexShrink: 1 },
  expandedDividerV: { width: 1, height: 18, backgroundColor: "#ccc", marginHorizontal: 8 },

  detailsBtn: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  detailsBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  emailBtn: {
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  emailBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

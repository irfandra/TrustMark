import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import TabRoleToggle from "../../components/ui/tab-role-toggle";
import {
  Dimensions, FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

const orders = [
  { id: "EA4GH",  status: "Request",     itemName: "Birkin Pinky",    collection: "Birkin Collections", pol: 500000, actionLabel: "Process" },
  { id: "BB1XZ",  status: "Request",     itemName: "Birkin Rose",     collection: "Birkin Collections", pol: 500000, actionLabel: "Process" },
  { id: "AS56JH", status: "On Prepare",  itemName: "Birkin Brownies", collection: "Birkin Collections", pol: 500000, actionLabel: "Send" },
  { id: "CC2YW",  status: "On Prepare",  itemName: "Birkin Gold",     collection: "Birkin Collections", pol: 500000, actionLabel: "Send" },
  { id: "JKL98F", status: "On Shipment", itemName: "Birkin Brownies", collection: "Birkin Collections", pol: 500000, actionLabel: "Wait For Claim" },
  { id: "DD3PQ",  status: "On Shipment", itemName: "Birkin Black",    collection: "Birkin Collections", pol: 500000, actionLabel: "Wait For Claim" },
];

// ── Helpers ────────────────────────────────────────────────
function getButtonStyle(actionLabel) {
  switch (actionLabel) {
    case "Process":        return { bg: "#111", text: "#fff" };
    case "Send":           return { bg: "#111", text: "#fff" };
    case "Wait For Claim": return { bg: "#e0e0e0", text: "#888" };
    default:               return { bg: "#111", text: "#fff" };
  }
}

function getStage(actionLabel) {
  switch (actionLabel) {
    case "Process":        return "process";
    case "Send":           return "shipment";
    case "Wait For Claim": return "claim";
    default:               return "process";
  }
}

// ── OrderItem ──────────────────────────────────────────────
function OrderItem({ id, itemName, collection, pol, actionLabel }) {
  const router = useRouter();
  const { bg, text } = getButtonStyle(actionLabel);

  const itemParams = {
    id,
    itemName,
    collection,
    pol: pol.toLocaleString(),
    actionLabel,
    stage: getStage(actionLabel),
  };

  // Whole card → same dynamic page
  const handleCardPress = () => {
    router.push({
      pathname: "/(company)/item-orders-dynamic",
      params: itemParams,
    });
  };

  // Action button → same dynamic page with stage param
  const handleActionPress = () => {
    router.push({
      pathname: "/(company)/item-orders-dynamic",
      params: itemParams,
    });
  };

  return (
    <TouchableOpacity
      style={styles.orderItemContainer}
      activeOpacity={0.85}
      onPress={handleCardPress}
    >
      {/* Left: order info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>#{id}</Text>
        <Text style={styles.orderItemName}>{itemName}</Text>
        <Text style={styles.orderCollection}>{collection}</Text>
      </View>

      {/* Middle: POL value */}
      <View style={styles.orderPolWrap}>
        <View style={styles.orderPolIcon}>
          <Ionicons name="link" size={14} color="#fff" />
        </View>
        <Text style={styles.orderPolLabel}>POL</Text>
        <Text style={styles.orderPolValue}>{pol.toLocaleString()}</Text>
      </View>

      {/* Right: action button — stops card nav, goes to same route */}
      <TouchableOpacity
        style={[styles.orderActionButton, { backgroundColor: bg }]}
        onPress={handleActionPress}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.orderActionButtonText, { color: text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────
export default function CompanyOrders() {
  const [activeTab, setActiveTab]       = useState("All");
  const [openRequest, setOpenRequest]   = useState(true);
  const [openPrepare, setOpenPrepare]   = useState(true);
  const [openShipment, setOpenShipment] = useState(true);
  const [role, setRole]                 = useState("company");

  const tabs = ["All", "Request", "On Prepare", "On Shipment"];

  function renderSection(title, open, setOpen, data) {
    return (
      <View style={styles.accordionContainer} key={title}>
        <TouchableOpacity
          style={styles.accordionHeader}
          activeOpacity={0.8}
          onPress={() => setOpen((prev) => !prev)}
        >
          <Text style={styles.accordionTitle}>{title}</Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color="#fff" />
        </TouchableOpacity>

        {open && (
          <View style={styles.accordionContent}>
            <View style={styles.columnLabels}>
              <Text style={[styles.columnLabel, { flex: 1 }]}>Items</Text>
              <Text style={[styles.columnLabel, { marginRight: 40 }]}>Value</Text>
              <Text style={[styles.columnLabel, { marginRight: 8 }]}>Action</Text>
            </View>
            {data.length === 0 ? (
              <Text style={styles.emptyText}>No orders in this section.</Text>
            ) : (
              data.map((item) => (
                <OrderItem
                  key={item.id}
                  id={item.id}
                  itemName={item.itemName}
                  collection={item.collection}
                  pol={item.pol}
                  actionLabel={item.actionLabel}
                />
              ))
            )}
          </View>
        )}
      </View>
    );
  }

  const ListHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.logo}>ZEAL</Text>
        <TabRoleToggle role={role} setRole={setRole} />
      </View>
      <Text style={styles.title}>Orders</Text>
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const ListFooter = () => (
    <>
      {(activeTab === "All" || activeTab === "Request") &&
        renderSection("Request", openRequest, setOpenRequest,
          orders.filter((o) => o.status === "Request"))}
      {(activeTab === "All" || activeTab === "On Prepare") &&
        renderSection("On Prepare", openPrepare, setOpenPrepare,
          orders.filter((o) => o.status === "On Prepare"))}
      {(activeTab === "All" || activeTab === "On Shipment") &&
        renderSection("On Shipment", openShipment, setOpenShipment,
          orders.filter((o) => o.status === "On Shipment"))}
    </>
  );

  return (
    <FlatList
      data={[]}
      keyExtractor={() => ""}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
    />
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: isTablet ? 32 : 16, paddingTop: 60, paddingBottom: 100 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  logo: { fontSize: isTablet ? 40 : 32, fontWeight: "800", letterSpacing: 1 },
  title: { fontSize: isTablet ? 36 : 28, fontWeight: "600", marginTop: 16, marginBottom: 4 },

  columnLabels: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#e0e0e0", marginBottom: 6 },
  columnLabel: { fontSize: 13, fontWeight: "700", fontStyle: "italic", color: "#222" },

  tabs: { flexDirection: "row", marginTop: 12, marginBottom: 16, gap: 6 },
  tabButton: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: "#bbb", borderRadius: 20, alignItems: "center" },
  activeTab: { backgroundColor: "#000", borderColor: "#000" },
  tabText: { fontSize: isTablet ? 13 : 11, color: "#333" },
  activeText: { color: "#fff", fontWeight: "600" },

  accordionContainer: { marginBottom: 10, borderRadius: 12, overflow: "hidden" },
  accordionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 14 },
  accordionTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  accordionContent: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8 },
  emptyText: { fontSize: 13, color: "#999", paddingVertical: 12, textAlign: "center" },

  orderItemContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#e8e8e8", borderRadius: 12, paddingVertical: 14, paddingLeft: 14, paddingRight: 0, marginBottom: 10, overflow: "hidden" },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 11, color: "#666", marginBottom: 2 },
  orderItemName: { fontSize: 14, fontWeight: "700", color: "#111" },
  orderCollection: { fontSize: 12, color: "#555", marginTop: 2 },

  orderPolWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 10 },
  orderPolIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#8a3ffc", alignItems: "center", justifyContent: "center", marginRight: 5 },
  orderPolLabel: { fontSize: 13, fontWeight: "700", color: "#222", marginRight: 4 },
  orderPolValue: { fontSize: 13, color: "#222" },

  orderActionButton: { width: 100, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 8 },
  orderActionButtonText: { fontSize: 13, fontWeight: "700" },
});

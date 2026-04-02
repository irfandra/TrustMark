import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Dimensions, FlatList, StyleSheet, Text,
  TouchableOpacity, View, RefreshControl, Modal, ScrollView,
} from "react-native";
import { orderService } from "@/services/orderService";
import LoadingPulse from "@/components/shared/loading-pulse";
import { createCreatorFilterTabsStyle } from "@/constants/creator-filter-tabs";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

// ── Helpers ────────────────────────────────────────────────
function getButtonStyle(actionLabel) {
  switch (actionLabel) {
    case "Ship":           return { bg: "#1E2C3A", text: "#FFF9F0" };
    default:               return { bg: "#1E2C3A", text: "#FFF9F0" };
  }
}

function getStage(actionLabel) {
  switch (actionLabel) {
    case "Ship":           return "shipment";
    default:               return "shipment";
  }
}

function isProcessableOrder(order) {
  const rawStatus = String(order?.rawStatus || "").toUpperCase();
  return rawStatus === "PENDING" || rawStatus === "PAYMENT_RECEIVED" || rawStatus === "PROCESSING";
}

// ── OrderItem ──────────────────────────────────────────────
function OrderItem({ order }) {
  const router = useRouter();
  const hasAction = Boolean(String(order.actionLabel || '').trim());
  const isShipmentWait = order.actionLabel === "Wait for Claim";
  const isCompletedView = order.actionLabel === "View";
  const { bg, text } = getButtonStyle(order.actionLabel);

  const itemParams = {
    orderId: String(order.orderId),
    itemId: order.displayId,
    itemName: order.itemName,
    collection: order.collection,
    amount: Number(order.amount || 0).toLocaleString(),
    currency: order.currency || 'USD',
    actionLabel: order.actionLabel,
    stage: getStage(order.actionLabel),
  };

  // Whole card → same dynamic page
  const handleCardPress = () => {
    router.push({
      pathname: "/(tabs)/(creator)/item-orders-dynamic",
      params: itemParams,
    });
  };

  // Action button → same dynamic page with stage param
  const handleActionPress = () => {
    router.push({
      pathname: "/(tabs)/(creator)/item-orders-dynamic",
      params: itemParams,
    });
  };

  return (
    <TouchableOpacity
      style={styles.orderItemContainer}
      activeOpacity={0.85}
      onPress={handleCardPress}
    >
      <View style={styles.orderTopRow}>
        <View style={styles.orderIdentity}>
          <Text style={styles.orderId}>{order.displayId}</Text>
          <Text style={styles.orderCollection}>{order.collection}</Text>
        </View>

        <View style={styles.orderPolWrap}>
          <View style={styles.orderPolIcon}>
            <Ionicons name="link" size={12} color="#fff" />
          </View>
          <Text style={styles.orderPolValue}>
            {order.currency || 'USD'} {Number(order.amount || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      <Text style={styles.orderItemName}>{order.itemName}</Text>

      <View style={styles.orderBottomRow}>
      {hasAction && isShipmentWait && (
        <View style={styles.orderStatusChip}>
          <Text style={styles.orderActionPassiveText}>{order.actionLabel}</Text>
        </View>
      )}

      {hasAction && isCompletedView && (
        <TouchableOpacity
          style={styles.orderActionIconButton}
          onPress={handleActionPress}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {hasAction && !isShipmentWait && !isCompletedView && (
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
            {order.actionLabel}
          </Text>
        </TouchableOpacity>
      )}

      {!hasAction && (
        <View style={styles.orderStatusChipMuted}>
          <Text style={styles.orderStatusMutedText}>View Detail</Text>
        </View>
      )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────
export default function OrderScreen() {
  const [activeTab, setActiveTab]       = useState("All");
  const [openShipment, setOpenShipment] = useState(true);
  const [openCompleted, setOpenCompleted] = useState(true);
  const [orders, setOrders]             = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError]       = useState("");
  const [inStockShipmentCandidates, setInStockShipmentCandidates] = useState([]);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedShipmentCandidateKeys, setSelectedShipmentCandidateKeys] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const filterTabs = createCreatorFilterTabsStyle({ isTablet, fill: true });

  const tabs = ["All", "On Shipment", "Completed"];

  const loadOrders = useCallback(async (showInitialLoader = true) => {
    try {
      if (showInitialLoader) {
        setIsLoading(true);
      }
      setLoadError("");
      const [orderRows, inStockRows] = await Promise.all([
        orderService.getCreatorOrders(),
        orderService.getCreatorInStockShipmentCandidates(),
      ]);

      setOrders(Array.isArray(orderRows) ? orderRows : []);
      setInStockShipmentCandidates(Array.isArray(inStockRows) ? inStockRows : []);
    } catch (error) {
      setOrders([]);
      setInStockShipmentCandidates([]);
      setLoadError(error?.message || "Failed to load orders");
    } finally {
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadOrders(false);
  }, [loadOrders]);

  const shipmentItems = useMemo(() => {
    const orderCandidates = orders
      .filter((order) => isProcessableOrder(order))
      .map((order) => ({
        ...order,
        shipmentSource: 'order',
        shipmentKey: `order:${order.orderId}`,
      }));

    return [...orderCandidates, ...inStockShipmentCandidates];
  }, [orders, inStockShipmentCandidates]);

  const selectedAllCandidates =
    shipmentItems.length > 0 &&
    selectedShipmentCandidateKeys.length === shipmentItems.length;

  const handleOpenShipmentModal = () => {
    if (shipmentItems.length === 0) {
      Alert.alert('No Pending Shipment', 'All available product items are already shipped.');
      return;
    }

    setSelectedShipmentCandidateKeys([]);
    setShowShipmentModal(true);
  };

  const toggleShipmentSelection = (shipmentKey) => {
    setSelectedShipmentCandidateKeys((current) =>
      current.includes(shipmentKey)
        ? current.filter((id) => id !== shipmentKey)
        : [...current, shipmentKey]
    );
  };

  const handleToggleAllCandidates = () => {
    if (selectedAllCandidates) {
      setSelectedShipmentCandidateKeys([]);
      return;
    }

    setSelectedShipmentCandidateKeys(shipmentItems.map((item) => item.shipmentKey));
  };

  const handleShipSelectedItems = async () => {
    if (selectedShipmentCandidateKeys.length === 0) {
      Alert.alert('No Items Selected', 'Select at least one product item to ship.');
      return;
    }

    try {
      setIsBatchProcessing(true);

      const selectedRows = shipmentItems.filter((row) =>
        selectedShipmentCandidateKeys.includes(row.shipmentKey)
      );

      const selectedOrderIds = selectedRows
        .filter((row) => row.shipmentSource === 'order' && row.orderId != null)
        .map((row) => row.orderId);

      const selectedInStockItemIds = selectedRows
        .filter((row) => row.shipmentSource === 'in-stock' && row.productItemId != null)
        .map((row) => row.productItemId);

      let processed = 0;
      let failed = 0;

      if (selectedOrderIds.length > 0) {
        const orderResult = await orderService.shipCreatorOrders(selectedOrderIds);
        processed += Number(orderResult?.processed || 0);
        failed += Number(orderResult?.failed || 0);
      }

      if (selectedInStockItemIds.length > 0) {
        const inStockResult = await orderService.shipCreatorInStockItems(selectedInStockItemIds);
        processed += Number(inStockResult?.processed || 0);
        failed += Number(inStockResult?.failed || 0);
      }

      await loadOrders(false);
      setShowShipmentModal(false);
      setSelectedShipmentCandidateKeys([]);

      if (failed > 0) {
        Alert.alert(
          'Shipped With Some Errors',
          `${processed} item(s) shipped and ${failed} failed.`
        );
        return;
      }

      Alert.alert('Success', `${processed} item(s) moved to On Shipment.`);
    } catch (error) {
      Alert.alert('Ship Failed', error?.message || 'Unable to ship selected items.');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  function renderSection(title, open, setOpen, data) {
    return (
      <View style={styles.accordionContainer} key={title}>
        <TouchableOpacity
          style={styles.accordionHeader}
          activeOpacity={0.8}
          onPress={() => setOpen((prev) => !prev)}
        >
          <View style={styles.accordionHeaderLeft}>
            <Text style={styles.accordionTitle}>{title}</Text>
            <Text style={styles.accordionSubtitle}>
              {data.length} {data.length === 1 ? "Order" : "Orders"}
            </Text>
          </View>
          <View style={styles.accordionChevron}>
            <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#1E2C3A" />
          </View>
        </TouchableOpacity>

        {open && (
          <View style={styles.accordionContent}>
            {data.length === 0 ? (
              <Text style={styles.emptyText}>No orders in this section.</Text>
            ) : (
              data.map((item) => (
                <OrderItem key={item.orderId} order={item} />
              ))
            )}
          </View>
        )}
      </View>
    );
  }

  const ListHeader = () => (
    <>
      <Text style={styles.title}>Orders</Text>
      <View style={filterTabs.tabsWrap}>
        <View style={filterTabs.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[filterTabs.tabButton, activeTab === tab && filterTabs.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                numberOfLines={1}
                style={[filterTabs.tabText, activeTab === tab && filterTabs.activeText]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.addShipmentButton}
        onPress={handleOpenShipmentModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={16} color="#FFF9F0" />
        <Text style={styles.addShipmentButtonText}>Add Shipment</Text>
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingWrap}>
          <LoadingPulse label="Loading orders..." />
        </View>
      )}

      {!isLoading && !!loadError && (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      )}
    </>
  );

  const ListFooter = () => (
    <>
      {!isLoading && !loadError && (
        <>
      {(activeTab === "All" || activeTab === "On Shipment") &&
        renderSection("On Shipment", openShipment, setOpenShipment,
          orders.filter((o) => o.status === "On Shipment"))}
      {(activeTab === "All" || activeTab === "Completed") &&
        renderSection("Completed", openCompleted, setOpenCompleted,
          orders.filter((o) => o.status === "Completed"))}
        </>
      )}
    </>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={[]}
        keyExtractor={() => ""}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#1E2C3A" />
        }
      />

      <Modal
        visible={showShipmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShipmentModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTextWrap}>
                <Text style={styles.modalTitle}>Add Shipment</Text>
                <Text style={styles.modalSubtitle}>
                  Select product items to ship ({shipmentItems.length} ready)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowShipmentModal(false)}
                disabled={isBatchProcessing}
              >
                <Ionicons name="close" size={18} color="#1E2C3A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {shipmentItems.map((order) => {
                const isSelected = selectedShipmentCandidateKeys.includes(order.shipmentKey);
                return (
                  <TouchableOpacity
                    key={order.shipmentKey}
                    style={[
                      styles.modalItemRow,
                      isSelected && styles.modalItemRowSelected,
                    ]}
                    onPress={() => toggleShipmentSelection(order.shipmentKey)}
                    disabled={isBatchProcessing}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={isSelected ? "#1E2C3A" : "#9F8D79"}
                    />

                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemId}>{order.displayId}</Text>
                      <Text style={styles.modalItemName} numberOfLines={1}>{order.itemName}</Text>
                      <Text style={styles.modalItemMeta} numberOfLines={1}>
                        {order.collection} • {order.currency || 'USD'} {Number(order.amount || 0).toLocaleString()} • {order.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {shipmentItems.length === 0 && (
                <Text style={styles.emptyText}>No product items available.</Text>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.selectAllBtn}
                onPress={handleToggleAllCandidates}
                disabled={isBatchProcessing || shipmentItems.length === 0}
              >
                <Text style={styles.selectAllBtnText}>
                  {selectedAllCandidates ? 'Clear All' : 'Select All Ready'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.processBtn,
                  (selectedShipmentCandidateKeys.length === 0 || isBatchProcessing) && styles.processBtnDisabled,
                ]}
                onPress={handleShipSelectedItems}
                disabled={selectedShipmentCandidateKeys.length === 0 || isBatchProcessing}
              >
                <Text style={styles.processBtnText}>
                  {isBatchProcessing
                    ? 'Shipping...'
                    : `Ship (${selectedShipmentCandidateKeys.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F1E8",
  },
  list: {
    flex: 1,
    backgroundColor: "#F6F1E8",
  },
  scrollContent: {
    paddingHorizontal: isTablet ? 32 : 16,
    paddingTop: isTablet ? 12 : 8,
    paddingBottom: 100,
    backgroundColor: "#F6F1E8",
  },

  title: { fontSize: isTablet ? 36 : 28, fontWeight: "600", marginTop: 0, marginBottom: 4, color: "#1E2C3A" },
  loadingWrap: { alignItems: "center", justifyContent: "center", marginTop: 30, gap: 8 },
  errorWrap: { marginTop: 20, alignItems: "center", paddingHorizontal: 20 },
  errorText: { color: "#b91c1c", fontSize: 12, textAlign: "center" },

  addShipmentButton: {
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: "#1E2C3A",
    borderWidth: 1,
    borderColor: "#1E2C3A",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addShipmentButtonText: {
    color: "#FFF9F0",
    fontSize: 12,
    fontWeight: "800",
  },
  accordionContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4D7C5",
    backgroundColor: "#FFF9F0",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF9F0",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accordionHeaderLeft: {
    gap: 2,
  },
  accordionTitle: { fontSize: 16, fontWeight: "800", color: "#1E2C3A" },
  accordionSubtitle: { fontSize: 11, color: "#7B6A58", fontWeight: "600" },
  accordionChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6C8B5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E2",
  },
  accordionContent: {
    backgroundColor: "#FFFBF4",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDE3D5",
  },
  emptyText: { fontSize: 13, color: "#8A7C6A", paddingVertical: 12, textAlign: "center" },

  orderItemContainer: {
    backgroundColor: "#FFF9F0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4D7C5",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 9,
  },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  orderIdentity: {
    flex: 1,
    gap: 2,
  },
  orderId: { fontSize: 11, color: "#8A7C6A", fontWeight: "700" },
  orderCollection: { fontSize: 12, color: "#6F5E4C" },
  orderItemName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E2C3A",
    lineHeight: 21,
  },

  orderPolWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E6D2",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D7C5",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 5,
  },
  orderPolIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D95F47",
    alignItems: "center",
    justifyContent: "center",
  },
  orderPolValue: { fontSize: 11, color: "#3D4D61", fontWeight: "700" },

  orderBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  orderStatusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D7C5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F8EFE2",
  },
  orderStatusChipMuted: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D7C5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F8EFE2",
  },
  orderStatusMutedText: {
    fontSize: 11,
    color: "#8A7C6A",
    fontWeight: "700",
  },
  orderActionPassiveText: {
    fontSize: 11,
    color: "#6B5A4B",
    fontWeight: "700",
    textAlign: "center",
  },
  orderActionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1E2C3A",
    alignItems: "center",
    justifyContent: "center",
  },
  orderActionButton: {
    minWidth: 110,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  orderActionButtonText: { fontSize: 12, fontWeight: "800" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 24, 28, 0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFF9F0",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderColor: "#E4D7C5",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E2C3A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#7B6A58",
    fontWeight: "600",
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D6C8B5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E2",
  },
  modalList: {
    maxHeight: 420,
  },
  modalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E7DBCB",
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFBF4",
  },
  modalItemRowSelected: {
    borderColor: "#1E2C3A",
    backgroundColor: "#F3E6D2",
  },
  modalItemRowDisabled: {
    opacity: 0.55,
  },
  modalItemInfo: {
    flex: 1,
    gap: 2,
  },
  modalItemId: {
    fontSize: 10,
    color: "#8A7C6A",
    fontWeight: "700",
  },
  modalItemName: {
    fontSize: 14,
    color: "#1E2C3A",
    fontWeight: "800",
  },
  modalItemMeta: {
    fontSize: 11,
    color: "#6B5A4B",
    fontWeight: "600",
  },
  modalFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectAllBtn: {
    minWidth: 96,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6C8B5",
    backgroundColor: "#FFF3E2",
    alignItems: "center",
    justifyContent: "center",
  },
  selectAllBtnText: {
    fontSize: 12,
    color: "#4E3F31",
    fontWeight: "800",
  },
  processBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#1E2C3A",
    alignItems: "center",
    justifyContent: "center",
  },
  processBtnDisabled: {
    backgroundColor: "#8C9AAA",
  },
  processBtnText: {
    fontSize: 13,
    color: "#FFF9F0",
    fontWeight: "800",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Dimensions, FlatList, Text,
  Platform,
  TouchableOpacity, View, RefreshControl, Modal, ScrollView, TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import CollapsibleAccordion from "@/components/shared/collapsible-accordion";
import FilterTabs from "@/components/shared/filter-tabs";
import { orderService } from "@/services/orderService";
import LoadingPulse from "@/components/shared/loading-pulse";
import {
  createCreatorOrderStyles,
} from "@/constants/styles/creator-order-styles";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;
const styles = createCreatorOrderStyles({ isTablet });

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
  if (order?.canShip === false) {
    return false;
  }
  const rawStatus = String(order?.rawStatus || "").toUpperCase();
  return rawStatus === "PENDING" || rawStatus === "PAYMENT_RECEIVED" || rawStatus === "PROCESSING";
}

function isActiveShipmentStatus(rawStatus) {
  const normalizedStatus = String(rawStatus || "").toUpperCase();
  return (
    normalizedStatus === "PENDING" ||
    normalizedStatus === "PAYMENT_RECEIVED" ||
    normalizedStatus === "PROCESSING" ||
    normalizedStatus === "SHIPPED" ||
    normalizedStatus === "DELIVERED"
  );
}

function formatDateTimeLabel(value) {
  if (!value) {
    return "Select estimated arrival date & time";
  }

  return value.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDateTimeString(value) {
  if (!value) {
    return null;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  const second = String(value.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

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

  const handleCardPress = () => {
    router.push({
      pathname: "/(order)/item-orders-dynamic",
      params: itemParams,
    });
  };

  const handleActionPress = () => {
    router.push({
      pathname: "/(order)/item-orders-dynamic",
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
          <Text style={styles.orderPolValue}>
            USD {Number(order.amount || 0).toLocaleString()}
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
  const [shipmentModalStep, setShipmentModalStep] = useState('select');
  const [shipmentRecipientName, setShipmentRecipientName] = useState('');
  const [shipmentRecipientPhone, setShipmentRecipientPhone] = useState('');
  const [shipmentAddress, setShipmentAddress] = useState('');
  const [shipmentEstimatedAt, setShipmentEstimatedAt] = useState(null);
  const [showShipmentEstimatedAtPicker, setShowShipmentEstimatedAtPicker] = useState(false);
  const [shipmentTrackingNumber, setShipmentTrackingNumber] = useState('');

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

      const safeOrderRows = Array.isArray(orderRows) ? orderRows : [];
      const safeInStockRows = Array.isArray(inStockRows) ? inStockRows : [];

      const itemIdsInActiveOrders = new Set(
        safeOrderRows
          .filter((order) => isActiveShipmentStatus(order?.rawStatus) && order?.productItemId != null)
          .map((order) => order.productItemId)
      );

      const availableInStockRows = safeInStockRows.filter(
        (candidate) => !itemIdsInActiveOrders.has(candidate?.productItemId)
      );

      setOrders(safeOrderRows);
      setInStockShipmentCandidates(availableInStockRows);
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

  const resetShipmentModalState = () => {
    setSelectedShipmentCandidateKeys([]);
    setShipmentModalStep('select');
    setShipmentRecipientName('');
    setShipmentRecipientPhone('');
    setShipmentAddress('');
    setShipmentEstimatedAt(null);
    setShowShipmentEstimatedAtPicker(false);
    setShipmentTrackingNumber('');
  };

  const closeShipmentModal = () => {
    if (isBatchProcessing) {
      return;
    }
    setShowShipmentModal(false);
    resetShipmentModalState();
  };

  const handleOpenShipmentModal = () => {
    if (shipmentItems.length === 0) {
      Alert.alert('No Pending Shipment', 'All available product items are already shipped.');
      return;
    }

    resetShipmentModalState();
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

  const handleProceedToShipmentDetails = () => {
    if (selectedShipmentCandidateKeys.length === 0) {
      Alert.alert('No Items Selected', 'Select at least one product item to continue.');
      return;
    }
    setShipmentModalStep('details');
  };

  const handleShipSelectedItems = async () => {
    if (selectedShipmentCandidateKeys.length === 0) {
      Alert.alert('No Items Selected', 'Select at least one product item to ship.');
      return;
    }

    const recipientName = shipmentRecipientName.trim();
    const recipientPhone = shipmentRecipientPhone.trim();
    const shippingAddress = shipmentAddress.trim();
    const estimatedAt = toLocalDateTimeString(shipmentEstimatedAt);
    const trackingNumber = shipmentTrackingNumber.trim();

    if (!recipientName || !recipientPhone || !shippingAddress) {
      Alert.alert(
        'Missing Delivery Details',
        'Recipient name, phone number, and delivery address are required.'
      );
      return;
    }

    const deliveryDetails = {
      recipientName,
      recipientPhone,
      shippingAddress,
      estimatedAt,
      trackingNumber,
    };

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
        const orderResult = await orderService.shipCreatorOrders(selectedOrderIds, deliveryDetails);
        processed += Number(orderResult?.processed || 0);
        failed += Number(orderResult?.failed || 0);
      }

      if (selectedInStockItemIds.length > 0) {
        const inStockResult = await orderService.shipCreatorInStockItems(selectedInStockItemIds, deliveryDetails);
        processed += Number(inStockResult?.processed || 0);
        failed += Number(inStockResult?.failed || 0);
      }

      await loadOrders(false);
      setShowShipmentModal(false);
      resetShipmentModalState();

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

  const handleShipmentEstimatedAtChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowShipmentEstimatedAtPicker(false);
    }

    if (event?.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setShipmentEstimatedAt(selectedDate);
    }
  };

  function renderSection(title, open, setOpen, data) {
    return (
      <CollapsibleAccordion
        isOpen={open}
        onToggle={() => setOpen((prev) => !prev)}
        containerStyle={styles.accordionContainer}
        headerStyle={styles.accordionHeader}
        chevronWrapStyle={styles.accordionChevron}
        chevronColor="#1E2C3A"
        headerContent={
          <View style={styles.accordionHeaderLeft}>
            <Text style={styles.accordionTitle}>{title}</Text>
            <Text style={styles.accordionSubtitle}>
              {data.length} {data.length === 1 ? "Shipment" : "Shipments"}
            </Text>
          </View>
        }
        contentStyle={styles.accordionContent}
      >
        {data.length === 0 ? (
          <Text style={styles.emptyText}>No shipments in this section.</Text>
        ) : (
          data.map((item) => (
            <OrderItem key={item.orderId} order={item} />
          ))
        )}
      </CollapsibleAccordion>
    );
  }

  const ListHeader = () => (
    <>
      <Text style={styles.title}>Shipments</Text>
      <FilterTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isTablet={isTablet}
        fill
      />

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
          <LoadingPulse label="Loading shipments..." />
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
        onRequestClose={closeShipmentModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTextWrap}>
                <Text style={styles.modalTitle}>Add Shipment</Text>
                <Text style={styles.modalSubtitle}>
                  {shipmentModalStep === 'select'
                    ? `Step 1/2: Select product items (${shipmentItems.length} ready)`
                    : `Step 2/2: Enter delivery details for ${selectedShipmentCandidateKeys.length} item(s)`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closeShipmentModal}
                disabled={isBatchProcessing}
              >
                <Ionicons name="close" size={18} color="#1E2C3A" />
              </TouchableOpacity>
            </View>

            {shipmentModalStep === 'select' ? (
              <>
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
                            {order.collection} • USD {Number(order.amount || 0).toLocaleString()} • {order.status}
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
                    onPress={handleProceedToShipmentDetails}
                    disabled={selectedShipmentCandidateKeys.length === 0 || isBatchProcessing}
                  >
                    <Text style={styles.processBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                  <View style={styles.shipmentFormCard}>
                    <Text style={styles.shipmentFormTitle}>Delivery Details</Text>
                    <Text style={styles.shipmentFormHint}>Fill recipient details for the selected shipment items.</Text>

                    <View style={styles.shipmentFieldWrap}>
                      <Text style={styles.shipmentFieldLabel}>Recipient Name *</Text>
                      <TextInput
                        style={styles.shipmentInput}
                        value={shipmentRecipientName}
                        onChangeText={setShipmentRecipientName}
                        placeholder="Enter recipient name"
                        placeholderTextColor="#A39483"
                        editable={!isBatchProcessing}
                      />
                    </View>

                    <View style={styles.shipmentFieldWrap}>
                      <Text style={styles.shipmentFieldLabel}>Phone Number *</Text>
                      <TextInput
                        style={styles.shipmentInput}
                        value={shipmentRecipientPhone}
                        onChangeText={setShipmentRecipientPhone}
                        placeholder="Enter recipient phone"
                        placeholderTextColor="#A39483"
                        keyboardType="phone-pad"
                        editable={!isBatchProcessing}
                      />
                    </View>

                    <View style={styles.shipmentFieldWrap}>
                      <Text style={styles.shipmentFieldLabel}>Delivery Address *</Text>
                      <TextInput
                        style={[styles.shipmentInput, styles.shipmentInputMultiline]}
                        value={shipmentAddress}
                        onChangeText={setShipmentAddress}
                        placeholder="Enter delivery address"
                        placeholderTextColor="#A39483"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        editable={!isBatchProcessing}
                      />
                    </View>

                    <View style={styles.shipmentFieldWrap}>
                      <Text style={styles.shipmentFieldLabel}>Estimated Arrival (Optional)</Text>
                      <TouchableOpacity
                        style={styles.shipmentInput}
                        onPress={() => setShowShipmentEstimatedAtPicker((current) => !current)}
                        disabled={isBatchProcessing}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            color: shipmentEstimatedAt ? '#1E2C3A' : '#A39483',
                            fontWeight: shipmentEstimatedAt ? '600' : '400',
                          }}
                        >
                          {formatDateTimeLabel(shipmentEstimatedAt)}
                        </Text>
                      </TouchableOpacity>
                      {showShipmentEstimatedAtPicker && (
                        <DateTimePicker
                          value={shipmentEstimatedAt || new Date()}
                          mode="datetime"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={handleShipmentEstimatedAtChange}
                          minimumDate={new Date()}
                        />
                      )}
                    </View>

                    <View style={styles.shipmentFieldWrap}>
                      <Text style={styles.shipmentFieldLabel}>Tracking Number (Optional)</Text>
                      <TextInput
                        style={styles.shipmentInput}
                        value={shipmentTrackingNumber}
                        onChangeText={setShipmentTrackingNumber}
                        placeholder="Auto-generated if empty"
                        placeholderTextColor="#A39483"
                        autoCapitalize="characters"
                        editable={!isBatchProcessing}
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.selectAllBtn}
                    onPress={() => setShipmentModalStep('select')}
                    disabled={isBatchProcessing}
                  >
                    <Text style={styles.selectAllBtnText}>Back</Text>
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
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}


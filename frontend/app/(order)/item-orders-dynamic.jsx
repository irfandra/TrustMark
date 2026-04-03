import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { orderService } from '@/services/orderService';
import LoadingPulse from '@/components/shared/loading-pulse';
import { styles, qrStyles } from '@/constants/styles/creator-item-orders-dynamic-styles.js';

const STATUS_CONFIG = {
  'On Shipment': { color: '#E67E22', icon: 'car-outline', label: 'On Shipment' },
  Completed: { color: '#27AE60', icon: 'checkmark-circle-outline', label: 'Completed' },
};

const CTA_BY_ACTION = {
  Ship: { type: 'ship', label: 'Ship Item' },
};

const ReadOnlyDeliveryField = ({ label, value, multiline = false }) => (
  <View style={styles.deliveryFieldWrap}>
    <Text style={styles.deliveryFieldLabel}>{label}</Text>
    <View style={[styles.deliveryReadonlyBox, multiline && styles.deliveryReadonlyBoxMultiline]}>
      <Text style={styles.deliveryReadonlyValue}>{String(value || '-')}</Text>
    </View>
  </View>
);

const readParam = (value) => (Array.isArray(value) ? value[0] : value);
const normalizeDeliveryValue = (value) => {
  const safeValue = String(value || '').trim();
  if (!safeValue || safeValue === '-') {
    return '';
  }

  return safeValue;
};

const parseDeliveryDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatDateTimeLabel = (value) => {
  if (!value) {
    return 'Select estimated arrival date & time';
  }

  return value.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toLocalDateTimeString = (value) => {
  if (!value) {
    return null;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  const second = String(value.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};

const QRSection = ({ item }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(item.qrValue)}&format=png&margin=10`;

      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert('Error', 'Cannot save image. Permission denied.');
        return;
      }

      const safeItemId = String(item?.id || 'item').replace(/[^a-zA-Z0-9-_]/g, '_');
      const targetFile = new File(Paths.cache, `trustmark-qr-${safeItemId}.png`);
      const downloadedFile = await File.downloadFileAsync(qrUrl, targetFile, { idempotent: true });

      await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
      Alert.alert('Saved!', 'QR code saved to your Photos.');
    } catch (error) {
      console.error('QR Download error:', error);
      Alert.alert(
        'Download Failed',
        'Could not generate QR. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={qrStyles.section}>
      <Text style={styles.sectionTitle}>Authentication QR</Text>
      <Text style={qrStyles.subtitle}>Scan this certificate QR to verify item authenticity</Text>

      <View style={qrStyles.qrCard}>
        <View style={qrStyles.qrWrapper}>
          <QRCode
            value={item.qrValue}
            size={160}
            color="#1E2C3A"
            backgroundColor="#FFF9F0"
          />
        </View>

        <View style={qrStyles.qrInfo}>
          <Text style={qrStyles.qrItemId}>{item.id}</Text>
          <Text style={qrStyles.qrItemName}>{item.name}</Text>
          <Text style={qrStyles.qrValueText} numberOfLines={1}>{item.qrValue}</Text>
        </View>

        <View style={qrStyles.actionRow}>
       

          <TouchableOpacity
            style={[
              qrStyles.actionBtn,
              qrStyles.actionBtnDark,
              downloading && qrStyles.actionBtnDisabled,
            ]}
            onPress={downloading ? null : handleDownload}
            activeOpacity={0.85}
          >
            <Ionicons
              name={downloading ? 'hourglass-outline' : 'download-outline'}
              size={16}
              color="#FFF9F0"
            />
            <Text style={[qrStyles.actionBtnText, { color: '#FFF9F0' }]}>
              {downloading ? 'Generating...' : 'Download'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={qrStyles.infoNote}>
          <Ionicons name="information-circle-outline" size={14} color="#D95F47" />
          <Text style={qrStyles.infoNoteText}>
            Download generates a printable certificate QR for authenticity checks.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function CreatorOrderDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = readParam(params.orderId);

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryRecipient, setDeliveryRecipient] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [showDeliveryEstimatePicker, setShowDeliveryEstimatePicker] = useState(false);
  const [deliveryTracking, setDeliveryTracking] = useState('');

  const loadOrderDetail = useCallback(async (showInitialLoader = true) => {
    if (!orderId) {
      setLoadError('Missing shipment id');
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
      return;
    }

    try {
      if (showInitialLoader) {
        setIsLoading(true);
      }
      setLoadError('');
      const data = await orderService.getCreatorOrderDetail(orderId);
      setItem(data);
    } catch (error) {
      setItem(null);
      setLoadError(error?.message || 'Failed to load shipment detail');
    } finally {
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadOrderDetail(false);
  }, [loadOrderDetail]);

  const safeItem = useMemo(() => {
    if (item) return item;

    return {
      id: readParam(params.itemId) || '#--',
      name: readParam(params.itemName) || 'Shipment Item',
      collection: readParam(params.collection) || 'Collection',
      brand: 'Brand',
      brandLogo: '',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60',
      edition: 0,
      total: 0,
      specs: [],
      delivery: {
        status: 'On Shipment',
        claimedTime: '-',
        arrivalTime: '-',
        estimatedAtRaw: null,
        address: '-',
        recipientName: '-',
        phone: '-',
      },
      recipientName: '-',
      recipientPhone: '-',
      qrValue: `trustmark://certificate/${readParam(params.itemId) || 'unknown'}`,
      statusSection: 'On Shipment',
    };
  }, [item, params.collection, params.itemId, params.itemName]);

  useEffect(() => {
    setDeliveryRecipient(
      normalizeDeliveryValue(safeItem.recipientName || safeItem.delivery?.recipientName)
    );
    setDeliveryPhone(
      normalizeDeliveryValue(safeItem.recipientPhone || safeItem.delivery?.phone)
    );
    setDeliveryAddress(normalizeDeliveryValue(safeItem.delivery?.address));
    setDeliveryEstimate(
      parseDeliveryDateValue(safeItem.delivery?.estimatedAtRaw || safeItem.delivery?.arrivalTime)
    );
    setShowDeliveryEstimatePicker(false);
    setDeliveryTracking('');
  }, [safeItem.orderId, safeItem.recipientName, safeItem.recipientPhone, safeItem.delivery]);

  const status = safeItem.statusSection || safeItem.delivery?.status || 'On Shipment';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG['On Shipment'];
  const ctaConfig = CTA_BY_ACTION[safeItem.actionLabel] || null;
  const isShipmentReadOnly = safeItem.actionLabel === 'Wait for Claim';

  const handleBackToOrders = () => {
    router.replace('/(tabs)/(order)/order');
  };

  const handleStatusAction = async () => {
    if (!ctaConfig || !safeItem.orderId || isSubmitting) {
      return;
    }

    const recipientName = deliveryRecipient.trim();
    const recipientPhone = deliveryPhone.trim();
    const shippingAddress = deliveryAddress.trim();
    const estimatedAt = toLocalDateTimeString(deliveryEstimate);
    const trackingNumber = deliveryTracking.trim();

    if (!recipientName || !recipientPhone || !shippingAddress) {
      Alert.alert(
        'Missing Delivery Details',
        'Recipient name, phone number, and address are required before shipping.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      if (ctaConfig.type === 'ship') {
        await orderService.shipCreatorOrder(safeItem.orderId, {
          trackingNumber,
          recipientName,
          recipientPhone,
          shippingAddress,
          estimatedAt,
        });
      }

      await loadOrderDetail();
      Alert.alert('Success', `${ctaConfig.label} completed.`);
    } catch (error) {
      Alert.alert('Action failed', error?.message || 'Unable to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliveryEstimateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDeliveryEstimatePicker(false);
    }

    if (event?.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setDeliveryEstimate(selectedDate);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <LoadingPulse label="Loading shipment details..." />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centerWrap}>
        <Ionicons name="alert-circle-outline" size={44} color="#B03A2E" />
        <Text style={styles.centerText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleBackToOrders}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF9F0' }}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackToOrders}>
            <Ionicons name="arrow-back" size={24} color="#1E2C3A" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#1E2C3A" />
        }
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: safeItem.image }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={13} color="#1E2C3A" />
              <Text style={styles.badgeText}>Authentic</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="business-outline" size={13} color="#1E2C3A" />
              <Text style={styles.badgeText}>Creator View</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusConfig.color }]}>
              <Ionicons name={statusConfig.icon} size={13} color="#FFF9F0" />
              <Text style={[styles.badgeText, { color: '#FFF9F0' }]}>{statusConfig.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.itemName}>{safeItem.name}</Text>
            <Text style={styles.itemId}>{safeItem.id}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.collectionText}>{safeItem.collection}</Text>
            <Text style={styles.metaBy}> by </Text>
            {!!safeItem.brandLogo && (
              <Image source={{ uri: safeItem.brandLogo }} style={styles.brandLogo} resizeMode="contain" />
            )}
            <Text style={styles.brandText}>{safeItem.brand}</Text>
          </View>

          <Text style={styles.sectionTitle}>Specification</Text>
          <View style={styles.specRow}>
            {safeItem.specs.map((spec) => (
              <View key={spec.label} style={styles.specPill}>
                <Text style={styles.specPillText}>
                  <Text style={styles.specPillLabel}>{spec.label} : </Text>
                  {spec.value}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryStatusRow}>
              <Text style={styles.deliveryStatusLabel}>Status</Text>
              <Text style={styles.deliveryStatusValue}>{safeItem.delivery.status || status}</Text>
            </View>

            {status === 'Completed' ? (
              <View style={styles.deliveryStatusRow}>
                <Text style={styles.deliveryStatusLabel}>Claimed Time</Text>
                <Text style={styles.deliveryStatusValue}>{safeItem.delivery.claimedTime}</Text>
              </View>
            ) : (
              <>
                {isShipmentReadOnly ? (
                  <>
                    <ReadOnlyDeliveryField label="Recipient Name" value={deliveryRecipient} />
                    <ReadOnlyDeliveryField label="Phone Number" value={deliveryPhone} />
                    <ReadOnlyDeliveryField label="Delivery Address" value={deliveryAddress} multiline />
                    <ReadOnlyDeliveryField
                      label="Estimated Arrival"
                      value={deliveryEstimate ? formatDateTimeLabel(deliveryEstimate) : '-'}
                    />
                    <ReadOnlyDeliveryField
                      label="Tracking Number"
                      value={deliveryTracking || safeItem.delivery?.trackingNumber}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.deliveryFieldWrap}>
                      <Text style={styles.deliveryFieldLabel}>Recipient Name</Text>
                      <TextInput
                        style={styles.deliveryInput}
                        placeholder="Enter recipient name"
                        placeholderTextColor="#A39483"
                        value={deliveryRecipient}
                        onChangeText={setDeliveryRecipient}
                        editable={!isSubmitting}
                      />
                    </View>

                    <View style={styles.deliveryFieldWrap}>
                      <Text style={styles.deliveryFieldLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.deliveryInput}
                        placeholder="Enter phone number"
                        placeholderTextColor="#A39483"
                        value={deliveryPhone}
                        onChangeText={setDeliveryPhone}
                        keyboardType="phone-pad"
                        editable={!isSubmitting}
                      />
                    </View>

                    <View style={styles.deliveryFieldWrap}>
                      <Text style={styles.deliveryFieldLabel}>Delivery Address</Text>
                      <TextInput
                        style={[styles.deliveryInput, styles.deliveryInputMultiline]}
                        placeholder="Enter shipping address"
                        placeholderTextColor="#A39483"
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                        editable={!isSubmitting}
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View style={styles.deliveryFieldWrap}>
                      <Text style={styles.deliveryFieldLabel}>Estimated Arrival (Optional)</Text>
                      <TouchableOpacity
                        style={styles.deliveryInput}
                        onPress={() => setShowDeliveryEstimatePicker((current) => !current)}
                        disabled={isSubmitting}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            color: deliveryEstimate ? '#1E2C3A' : '#A39483',
                            fontWeight: deliveryEstimate ? '600' : '400',
                          }}
                        >
                          {formatDateTimeLabel(deliveryEstimate)}
                        </Text>
                      </TouchableOpacity>
                      {showDeliveryEstimatePicker && (
                        <DateTimePicker
                          value={deliveryEstimate || new Date()}
                          mode="datetime"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={handleDeliveryEstimateChange}
                          minimumDate={new Date()}
                        />
                      )}
                    </View>

                    <View style={styles.deliveryFieldWrap}>
                      <Text style={styles.deliveryFieldLabel}>Tracking Number (Optional)</Text>
                      <TextInput
                        style={styles.deliveryInput}
                        placeholder="Auto-generated if empty"
                        placeholderTextColor="#A39483"
                        value={deliveryTracking}
                        onChangeText={setDeliveryTracking}
                        editable={!isSubmitting}
                        autoCapitalize="characters"
                      />
                    </View>
                  </>
                )}
              </>
            )}
          </View>

          {!!safeItem.qrValue && <QRSection item={safeItem} />}

          <View style={{ height: ctaConfig ? 100 : 56 }} />
        </View>
      </ScrollView>

      {ctaConfig && (
        <SafeAreaView edges={['bottom']} style={styles.bottomActionWrap}>
          <TouchableOpacity
            style={[styles.bottomActionButton, isSubmitting && styles.bottomActionButtonDisabled]}
            onPress={handleStatusAction}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomActionText}>
              {isSubmitting ? 'Please wait...' : ctaConfig.label}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}


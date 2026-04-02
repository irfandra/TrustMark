import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { orderService } from '@/services/orderService';
import LoadingPulse from '@/components/shared/loading-pulse';

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

const QRSection = ({ item }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(item.qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(item.qrValue)}&format=png&margin=10`;

      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('Failed to fetch QR image');

      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      const base64 = `data:image/png;base64,${btoa(binary)}`;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, Helvetica, sans-serif;
                background: #FFF9F0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 60px 40px;
              }
              .card {
                border: 2px solid #1E2C3A;
                border-radius: 20px;
                padding: 36px 28px;
                text-align: center;
                width: 100%;
                max-width: 400px;
                background: #FFF9F0;
              }
              .logo {
                font-size: 24px;
                font-weight: 900;
                letter-spacing: 3px;
                color: #1E2C3A;
                margin-bottom: 20px;
              }
              .divider {
                height: 1px;
                background: #E8DDCD;
                margin: 16px 0;
              }
              .brand {
                font-size: 11px;
                color: #8A7C6A;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 4px;
              }
              .name {
                font-size: 24px;
                font-weight: 700;
                color: #1E2C3A;
                margin-bottom: 4px;
              }
              .item-id {
                font-size: 13px;
                color: #8A7C6A;
                margin-bottom: 28px;
              }
              .qr-wrapper {
                background: #FFF9F0;
                border: 1px solid #E4D7C5;
                border-radius: 16px;
                padding: 20px;
                display: inline-block;
                margin-bottom: 20px;
              }
              img {
                width: 240px;
                height: 240px;
                display: block;
              }
              .qr-label {
                font-size: 10px;
                color: #8A7C6A;
                word-break: break-all;
                margin-bottom: 24px;
                padding: 0 8px;
              }
              .footer {
                font-size: 12px;
                color: #6B5A4B;
                line-height: 1.6;
              }
              .footer strong { color: #1E2C3A; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">TRUSTMARK</div>
              <div class="divider"></div>
              <div class="brand">${item.brand}</div>
              <div class="name">${item.name}</div>
              <div class="item-id">${item.id}</div>
              <div class="qr-wrapper">
                <img src="${base64}" />
              </div>
              <div class="qr-label">${item.qrValue}</div>
              <div class="divider"></div>
              <div class="footer">
                Scan this QR code to verify the<br/>
                <strong>certificate on TRUSTMARK</strong>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 595,
        height: 842,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `TRUSTMARK QR - ${item.id}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Saved!', 'QR code saved to your Files.');
        } else {
          Alert.alert('Error', 'Cannot save file. Permission denied.');
        }
      }
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
            style={[qrStyles.actionBtn, copied && qrStyles.actionBtnSuccess]}
            onPress={handleCopy}
          >
            <Ionicons
              name={copied ? 'checkmark-outline' : 'copy-outline'}
              size={16}
              color={copied ? '#FFF9F0' : '#1E2C3A'}
            />
            <Text style={[qrStyles.actionBtnText, copied && { color: '#FFF9F0' }]}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>

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
  const [deliveryEstimate, setDeliveryEstimate] = useState('');
  const [deliveryTracking, setDeliveryTracking] = useState('');

  const loadOrderDetail = useCallback(async (showInitialLoader = true) => {
    if (!orderId) {
      setLoadError('Missing order id');
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
      setLoadError(error?.message || 'Failed to load order detail');
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
      name: readParam(params.itemName) || 'Order Item',
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
    setDeliveryEstimate(normalizeDeliveryValue(safeItem.delivery?.arrivalTime));
    setDeliveryTracking('');
  }, [safeItem.orderId, safeItem.recipientName, safeItem.recipientPhone, safeItem.delivery]);

  const status = safeItem.statusSection || safeItem.delivery?.status || 'On Shipment';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG['On Shipment'];
  const ctaConfig = CTA_BY_ACTION[safeItem.actionLabel] || null;
  const isShipmentReadOnly = safeItem.actionLabel === 'Wait for Claim';

  const handleStatusAction = async () => {
    if (!ctaConfig || !safeItem.orderId || isSubmitting) {
      return;
    }

    const recipientName = deliveryRecipient.trim();
    const recipientPhone = deliveryPhone.trim();
    const shippingAddress = deliveryAddress.trim();
    const arrivalTimeEstimation = deliveryEstimate.trim();
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
          arrivalTimeEstimation,
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

  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <LoadingPulse label="Loading order details..." />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centerWrap}>
        <Ionicons name="alert-circle-outline" size={44} color="#B03A2E" />
        <Text style={styles.centerText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF9F0' }}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
                    <ReadOnlyDeliveryField label="Arrival Time Estimation" value={deliveryEstimate} />
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
                      <Text style={styles.deliveryFieldLabel}>Arrival Time Estimation (Optional)</Text>
                      <TextInput
                        style={styles.deliveryInput}
                        placeholder="Ex: 5 Apr 2026"
                        placeholderTextColor="#A39483"
                        value={deliveryEstimate}
                        onChangeText={setDeliveryEstimate}
                        editable={!isSubmitting}
                      />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F1E8' },
  centerWrap: { flex: 1, backgroundColor: '#F6F1E8', alignItems: 'center', justifyContent: 'center', gap: 10 },
  centerText: { fontSize: 13, color: '#6E6356' },
  retryBtn: { backgroundColor: '#1E2C3A', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, marginTop: 6 },
  retryBtnText: { color: '#FFF9F0', fontWeight: '700', fontSize: 13 },
  bottomActionWrap: {
    backgroundColor: '#FFF9F0',
    borderTopWidth: 1,
    borderTopColor: '#E8DDCD',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  bottomActionButton: {
    backgroundColor: '#D95F47',
    borderRadius: 10,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionButtonDisabled: {
    opacity: 0.7,
  },
  bottomActionText: {
    color: '#FFF9F0',
    fontSize: 17,
    fontWeight: '700',
  },

  headerBar: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#FFF9F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDCD',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: { fontSize: 17, fontWeight: '600', color: '#1E2C3A' },

  imageContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: { width: '100%', height: 220, borderRadius: 16 },
  badgeRow: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,249,240,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#1E2C3A' },

  body: { paddingHorizontal: 16, paddingTop: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  itemName: { fontSize: 22, fontWeight: '900', color: '#1E2C3A' },
  itemId: { fontSize: 13, fontWeight: '600', color: '#8A7C6A' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
    flexWrap: 'wrap',
  },
  collectionText: { fontSize: 13, color: '#6B5A4B', fontWeight: '500' },
  metaBy: { fontSize: 13, color: '#9E8F7C' },
  brandLogo: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D95F47' },
  brandText: { fontSize: 13, color: '#5D6674', fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E2C3A', marginBottom: 12, marginTop: 4 },
  specRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 24 },
  specPill: { backgroundColor: '#1E2C3A', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8 },
  specPillText: { color: '#FFF9F0', fontSize: 13, fontWeight: '500' },
  specPillLabel: { fontWeight: '700' },

  deliveryCard: {
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDCD',
    borderRadius: 14,
    backgroundColor: '#FFF9F0',
    padding: 12,
  },
  deliveryStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  deliveryStatusLabel: {
    fontSize: 13,
    color: '#6F5E4C',
    fontWeight: '700',
  },
  deliveryStatusValue: {
    fontSize: 13,
    color: '#1E2C3A',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  deliveryFieldWrap: {
    gap: 6,
  },
  deliveryFieldLabel: {
    fontSize: 12,
    color: '#7C6B58',
    fontWeight: '700',
  },
  deliveryInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D6C8B5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFBF4',
    color: '#1E2C3A',
    fontSize: 13,
  },
  deliveryInputMultiline: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  deliveryReadonlyBox: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D6C8B5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3E9DC',
    justifyContent: 'center',
  },
  deliveryReadonlyBoxMultiline: {
    minHeight: 82,
    justifyContent: 'flex-start',
  },
  deliveryReadonlyValue: {
    color: '#1E2C3A',
    fontSize: 13,
    lineHeight: 18,
  },
});

const qrStyles = StyleSheet.create({
  section: { marginBottom: 24, gap: 8 },
  subtitle: { fontSize: 13, color: '#8A7C6A' },
  qrCard: {
    backgroundColor: '#FFF9F0',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E8DDCD',
  },
  qrWrapper: {
    backgroundColor: '#FFF9F0',
    borderRadius: 12,
    padding: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E4D7C5',
  },
  qrInfo: { alignItems: 'center', gap: 2 },
  qrItemId: { fontSize: 13, fontWeight: '700', color: '#1E2C3A' },
  qrItemName: { fontSize: 12, color: '#6F5E4C' },
  qrValueText: { fontSize: 10, color: '#8A7C6A' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF9F0',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#D6C8B5',
  },
  actionBtnSuccess: { backgroundColor: '#1E2C3A', borderColor: '#1E2C3A' },
  actionBtnDark: { backgroundColor: '#D95F47', borderColor: '#D95F47' },
  actionBtnDisabled: { backgroundColor: '#BCAFA0', borderColor: '#BCAFA0' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#1E2C3A' },
  infoNote: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#F3E6D2',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E4D7C5',
  },
  infoNoteText: { flex: 1, fontSize: 11, color: '#6B5A4B', lineHeight: 16 },
});

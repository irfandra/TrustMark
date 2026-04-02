import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Image,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';

const buildQrUrl = (payload) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(String(payload || ''))}`;

const formatDateOnly = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().split('T')[0];
};

const getFirstNonEmptyValue = (values) =>
  values
    .map((value) => String(value || '').trim())
    .find((value) => value.length > 0) || '';

const extractCertificatePayload = (itemRow) =>
  getFirstNonEmptyValue([
    itemRow?.certificateQrCode,
    itemRow?.certificateQrPayload,
    itemRow?.certificateQr,
    itemRow?.nftQrCode,
    itemRow?.nftQrPayload,
    itemRow?.nftQr,
    itemRow?.productLabelQrCode,
    itemRow?.labelQrCode,
    itemRow?.labelQrPayload,
    itemRow?.productLabelQrPayload,
  ]);

const createProductItemQrEntry = (itemRow, product, index) => {
  const rawSerial = String(itemRow?.itemSerial || itemRow?.id || '').replace(/^#/, '').trim();
  const fallbackSerial = `${product?.id || 'PROD'}-${String(index + 1).padStart(4, '0')}`;
  const itemSerial = rawSerial || fallbackSerial;
  const certificateQrCode = extractCertificatePayload(itemRow);
  const status = certificateQrCode ? 'generated' : 'pending';
  const generatedAt = formatDateOnly(itemRow?.mintedAt || itemRow?.createdAt);

  return {
    id: `ITEM:${itemSerial}`,
    itemName: product?.name || 'Product Item',
    collection: product?.collection || '-',
    productId: String(product?.id || '-'),
    itemSerial,
    certificateQrCode,
    genDate: status === 'generated' ? generatedAt : '-',
    status,
  };
};

export default function GenerateAllQrCollections() {
  const router = useRouter();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [listProductFilterId, setListProductFilterId] = useState('all');

  const [allProducts, setAllProducts] = useState([]);
  const [allItemEntries, setAllItemEntries] = useState([]);

  const [selectedQrId, setSelectedQrId] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showListFilterModal, setShowListFilterModal] = useState(false);

  const loadQrSourceData = useCallback(async (showInitialLoader = true) => {
    try {
      if (showInitialLoader) {
        setIsLoadingData(true);
      }
      setLoadError('');

      const collectionRows = await collectionService.getCollectionsByBrand();

      const productGroups = await Promise.all(
        collectionRows.map(async (collection) => {
          const products = await collectionService.getProductsByCollection(collection.id).catch(() => []);
          return products.map((product) => ({
            ...product,
            collectionId: String(collection.id),
          }));
        })
      );

      const mergedProducts = productGroups.flat();
      setAllProducts(mergedProducts);

      const itemGroups = await Promise.all(
        mergedProducts.map(async (product) => {
          const detail = await collectionService.getProductById(product.id).catch(() => null);
          const rows = Array.isArray(detail?.purchaseItems) ? detail.purchaseItems : [];
          return rows.map((row, index) => createProductItemQrEntry(row, product, index));
        })
      );

      const flatItems = itemGroups.flat();

      // Enforce unique QR per item serial.
      const uniqueBySerial = new Map();
      for (const row of flatItems) {
        if (!uniqueBySerial.has(row.itemSerial)) {
          uniqueBySerial.set(row.itemSerial, row);
        }
      }

      const uniqueRows = Array.from(uniqueBySerial.values());
      setAllItemEntries(uniqueRows);
    } catch (error) {
      setAllProducts([]);
      setAllItemEntries([]);
      setLoadError(error?.message || 'Failed to load QR source data');
    } finally {
      if (showInitialLoader) {
        setIsLoadingData(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQrSourceData();
  }, [loadQrSourceData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadQrSourceData(false);
  }, [loadQrSourceData]);

  const baseQrEntries = allItemEntries;

  const scopedQrCodes = useMemo(
    () =>
      baseQrEntries.map((entry) => {
        const qrUrl =
          entry.status === 'generated' ? buildQrUrl(entry.certificateQrCode) : '';

        return {
          ...entry,
          qrUrl,
          activeQrPayload: entry.certificateQrCode,
        };
      }),
    [baseQrEntries]
  );

  const statusFilteredQrCodes =
    filterStatus === 'all'
      ? scopedQrCodes
      : scopedQrCodes.filter((qr) => qr.status === filterStatus);

  const filteredQrCodes = useMemo(() => {
    if (listProductFilterId === 'all') {
      return statusFilteredQrCodes;
    }

    return statusFilteredQrCodes.filter(
      (qr) => String(qr.productId) === String(listProductFilterId)
    );
  }, [statusFilteredQrCodes, listProductFilterId]);

  useEffect(() => {
    if (listProductFilterId === 'all') {
      return;
    }

    const exists = allProducts.some(
      (product) => String(product.id) === String(listProductFilterId)
    );

    if (!exists) {
      setListProductFilterId('all');
    }
  }, [allProducts, listProductFilterId]);

  const hasGeneratedRows = filteredQrCodes.some((row) => row.status === 'generated');
  const selectedFilterProductLabel =
    listProductFilterId === 'all'
      ? 'All Products'
      : allProducts.find((product) => String(product.id) === String(listProductFilterId))?.name || 'All Products';
  const modalQr = useMemo(
    () => filteredQrCodes.find((row) => row.id === selectedQrId) || null,
    [filteredQrCodes, selectedQrId]
  );

  useEffect(() => {
    if (showQrModal && !modalQr) {
      setShowQrModal(false);
      setSelectedQrId('');
    }
  }, [showQrModal, modalQr]);

  const handleDownloadQr = (qr) => {
    if (qr.status !== 'generated') {
      Alert.alert('No QR available', 'This item has no backend QR payload yet.');
      return;
    }

    Alert.alert(
      'Download QR Code',
      `Downloading Certificate QR for "${qr.itemName}"\nItem Serial: ${qr.itemSerial}`,
      [{ text: 'OK' }]
    );
  };

  const handleShareQr = async (qr) => {
    if (qr.status !== 'generated') {
      Alert.alert('No QR available', 'This item has no backend QR payload yet.');
      return;
    }

    try {
      await Share.share({
        message: `Digital Seal Certificate QR for ${qr.itemName}\n\nItem Serial: ${qr.itemSerial}\nCollection: ${qr.collection}\nGenerated: ${qr.genDate}\nPayload: ${qr.activeQrPayload}`,
        title: 'Share QR Code',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleShowQr = (qr) => {
    if (qr.status !== 'generated') {
      Alert.alert('No QR available', 'This item has no backend QR payload yet.');
      return;
    }

    setSelectedQrId(qr.id);
    setShowQrModal(true);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>QR Code Generator</Text>
            <Text style={s.headerId}>{filteredQrCodes.length} item codes</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{filteredQrCodes.filter((q) => q.status === 'generated').length}</Text>
            <Text style={s.statLabel}>Generated</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{filteredQrCodes.filter((q) => q.status === 'pending').length}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={s.filterRow}>
          {['all', 'generated', 'pending'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[s.filterTab, filterStatus === status && s.filterTabActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[s.filterTabText, filterStatus === status && s.filterTabTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.productFilterBar}>
          <Text style={s.productFilterLabel}>Product Filter</Text>
          <TouchableOpacity style={s.productFilterBtn} onPress={() => setShowListFilterModal(true)}>
            <Text style={s.productFilterBtnText} numberOfLines={1}>{selectedFilterProductLabel}</Text>
            <Ionicons name="chevron-down" size={16} color="#444" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#111" />
          }
        >
          {isLoadingData && (
            <View style={s.loadingWrap}>
              <LoadingPulse label="Loading product items..." />
            </View>
          )}

          {!isLoadingData && !!loadError && (
            <View style={s.errorWrap}>
              <Text style={s.errorText}>{loadError}</Text>
            </View>
          )}

          {!isLoadingData && !loadError && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Product Item QR Rows</Text>
              <View style={s.qrList}>
                {filteredQrCodes.map((qr) => (
                  <View key={qr.id} style={s.qrCard}>
                    <View style={s.qrCardLeft}>
                      {qr.status === 'generated' ? (
                        <TouchableOpacity style={s.qrPreview} onPress={() => handleShowQr(qr)}>
                          <Image source={{ uri: qr.qrUrl }} style={s.qrImage} />
                          <View style={s.qrOverlay}>
                            <Ionicons name="expand" size={20} color="#fff" />
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={s.qrPreviewUnavailable}>
                          <Ionicons name="qr-code-outline" size={20} color="#888" />
                          <Text style={s.qrUnavailableText}>No QR available</Text>
                        </View>
                      )}
                    </View>

                    <View style={s.qrCardContent}>
                      <Text style={s.qrItemName}>{qr.itemName}</Text>
                      <Text style={s.qrCollection}>{qr.collection}</Text>
                      <Text style={s.qrProductMeta}>Product ID: {qr.productId}</Text>
                      <Text style={s.qrItemSerial}>Item Serial: {qr.itemSerial}</Text>
                      <View style={s.qrStatusRow}>
                        <View
                          style={[
                            s.statusBadge,
                            qr.status === 'generated' && s.statusBadgeGenerated,
                            qr.status === 'pending' && s.statusBadgePending,
                          ]}
                        >
                          <Text
                            style={[
                              s.statusBadgeText,
                              qr.status === 'generated' && s.statusBadgeTextGenerated,
                            ]}
                          >
                            {qr.status === 'generated' ? 'Generated' : 'Pending'}
                          </Text>
                        </View>
                      </View>
                      <Text style={s.qrDate}>Generated: {qr.genDate}</Text>
                    </View>

                    <View style={s.qrCardActions}>
                      <TouchableOpacity
                        style={[s.qrActionBtn, qr.status !== 'generated' && s.qrActionBtnDisabled]}
                        onPress={() => handleDownloadQr(qr)}
                        disabled={qr.status !== 'generated'}
                      >
                        <Ionicons name="download" size={20} color={qr.status !== 'generated' ? '#bbb' : '#111'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.qrActionBtn, qr.status !== 'generated' && s.qrActionBtnDisabled]}
                        onPress={() => handleShareQr(qr)}
                        disabled={qr.status !== 'generated'}
                      >
                        <Ionicons name="share-social" size={20} color={qr.status !== 'generated' ? '#bbb' : '#111'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={s.section}>
            <Text style={s.sectionTitle}>Batch Actions</Text>
            <View style={s.batchActionRow}>
              <TouchableOpacity style={[s.batchActionBtn, !hasGeneratedRows && s.batchActionBtnDisabled]} disabled={!hasGeneratedRows}>
                <MaterialCommunityIcons name="download-multiple" size={18} color="#111" />
                <Text style={s.batchActionBtnText}>Download All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.batchActionBtn, !hasGeneratedRows && s.batchActionBtnDisabled]} disabled={!hasGeneratedRows}>
                <Ionicons name="print" size={18} color="#111" />
                <Text style={s.batchActionBtnText}>Print All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.batchActionBtn, !hasGeneratedRows && s.batchActionBtnDisabled]} disabled={!hasGeneratedRows}>
                <Ionicons name="mail" size={18} color="#111" />
                <Text style={s.batchActionBtnText}>Email QRs</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.infoCard}>
            <View style={s.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#3498db" />
              <Text style={s.infoTitle}>Certificate QR</Text>
            </View>
            <Text style={s.infoText}>
              Certificate QR payloads are generated automatically when a collection is created. This screen previews and manages those backend-issued certificate codes.
            </Text>
          </View>
        </ScrollView>

        <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowQrModal(false)} />
          <View style={s.modalCenter} pointerEvents="box-none">
            <View style={s.qrModalCard}>
              <TouchableOpacity style={s.closeBtn} onPress={() => setShowQrModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>

              {modalQr && (
                <>
                  <Image source={{ uri: modalQr.qrUrl }} style={s.qrModalImage} />
                  <Text style={s.qrModalName}>{modalQr.itemName}</Text>
                  <Text style={s.qrModalCollection}>{modalQr.collection}</Text>
                  <Text style={s.qrModalProductMeta}>Product ID: {modalQr.productId}</Text>
                  <Text style={s.qrModalItemSerial}>Item Serial: {modalQr.itemSerial}</Text>

                  <View style={s.qrModalActions}>
                    <TouchableOpacity
                      style={[s.modalActionBtn, s.modalActionBtnPrimary]}
                      onPress={() => handleDownloadQr(modalQr)}
                    >
                      <Ionicons name="download" size={18} color="#fff" />
                      <Text style={s.modalActionBtnText}>Download</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.modalActionBtn, s.modalActionBtnSecondary]}
                      onPress={() => handleShareQr(modalQr)}
                    >
                      <Ionicons name="share-social" size={18} color="#111" />
                      <Text style={[s.modalActionBtnText, { color: '#111' }]}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Modal
          visible={showListFilterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowListFilterModal(false)}
        >
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowListFilterModal(false)} />
          <View style={s.modalCenter} pointerEvents="box-none">
            <View style={s.listFilterModalCard}>
              <Text style={s.listFilterModalTitle}>Select Product</Text>

              <ScrollView style={s.listFilterModalList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    s.listFilterOption,
                    listProductFilterId === 'all' && s.listFilterOptionActive,
                  ]}
                  onPress={() => {
                    setListProductFilterId('all');
                    setShowListFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      s.listFilterOptionText,
                      listProductFilterId === 'all' && s.listFilterOptionTextActive,
                    ]}
                  >
                    All Products
                  </Text>
                  {listProductFilterId === 'all' && <Ionicons name="checkmark" size={16} color="#111" />}
                </TouchableOpacity>

                {allProducts.map((product) => {
                  const isActive = String(listProductFilterId) === String(product.id);
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[s.listFilterOption, isActive && s.listFilterOptionActive]}
                      onPress={() => {
                        setListProductFilterId(String(product.id));
                        setShowListFilterModal(false);
                      }}
                    >
                      <Text style={[s.listFilterOptionText, isActive && s.listFilterOptionTextActive]}>
                        {product.name}
                      </Text>
                      {isActive && <Ionicons name="checkmark" size={16} color="#111" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  headerId: { fontSize: 12, color: '#888' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  filterTabActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTabTextActive: { color: '#fff' },

  productFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  productFilterLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  productFilterBtn: {
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  productFilterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    maxWidth: 170,
  },

  content: { flex: 1, paddingHorizontal: 16 },
  section: { marginVertical: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 12 },

  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  loadingText: { fontSize: 13, color: '#555' },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  errorText: { fontSize: 12, color: '#b91c1c', textAlign: 'center' },

  qrList: { gap: 12 },
  qrCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    alignItems: 'center',
  },
  qrCardLeft: { padding: 8 },
  qrPreview: { position: 'relative' },
  qrPreviewUnavailable: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  qrImage: { width: 70, height: 70, borderRadius: 8 },
  qrUnavailableText: {
    fontSize: 9,
    color: '#777',
    textAlign: 'center',
    fontWeight: '600',
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  qrCardContent: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  qrItemName: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 2 },
  qrCollection: { fontSize: 12, color: '#888', marginBottom: 2 },
  qrProductMeta: { fontSize: 11, color: '#666', marginBottom: 2, fontWeight: '600' },
  qrItemSerial: { fontSize: 11, color: '#666', marginBottom: 6, fontWeight: '600' },
  qrStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusBadge: { backgroundColor: '#fee', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeGenerated: { backgroundColor: '#efe' },
  statusBadgePending: { backgroundColor: '#ffe' },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#cc0000' },
  statusBadgeTextGenerated: { color: '#4CAF50' },
  qrDate: { fontSize: 11, color: '#aaa' },

  qrCardActions: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  qrActionBtn: { padding: 8 },
  qrActionBtnDisabled: { opacity: 0.45 },

  batchActionRow: { flexDirection: 'row', gap: 8 },
  batchActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    gap: 6,
  },
  batchActionBtnText: { fontSize: 12, fontWeight: '600', color: '#111' },
  batchActionBtnDisabled: { opacity: 0.45 },

  infoCard: {
    backgroundColor: '#ddf',
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  infoText: { fontSize: 13, color: '#333', lineHeight: 20 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  qrModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    width: '90%',
    maxWidth: 320,
  },
  listFilterModalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    width: '88%',
    maxWidth: 360,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  listFilterModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  listFilterModalList: {
    maxHeight: 280,
  },
  listFilterOption: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ececec',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listFilterOptionActive: {
    borderColor: '#111',
    backgroundColor: '#f7f7f7',
  },
  listFilterOptionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  listFilterOptionTextActive: {
    color: '#111',
    fontWeight: '700',
  },
  closeBtn: { position: 'absolute', top: 12, right: 12, padding: 8 },
  qrModalImage: { width: 240, height: 240, borderRadius: 12, marginBottom: 16 },
  qrModalName: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 4 },
  qrModalCollection: { fontSize: 13, color: '#888', marginBottom: 6 },
  qrModalProductMeta: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 4 },
  qrModalItemSerial: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 16 },
  qrModalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  modalActionBtnPrimary: { backgroundColor: '#111' },
  modalActionBtnSecondary: { backgroundColor: '#f0f0f0' },
  modalActionBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

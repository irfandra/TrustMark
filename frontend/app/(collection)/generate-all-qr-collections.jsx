import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, View, Text, TouchableOpacity, Alert, Share, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';
import { s } from '@/constants/styles/creator-generate-all-qr-collections-styles.js';

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

const buildQrUrl = (payload) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(String(payload || ''))}`;

const sanitizeFileName = (value) =>
  String(value || 'item')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 64) || 'item';

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
  ]);

const createProductItemQrEntry = (itemRow, product, index) => {
  const rawSerial = String(itemRow?.itemSerial || itemRow?.id || '').replace(/^#/, '').trim();
  const fallbackSerial = `${product?.id || 'PROD'}-${String(index + 1).padStart(4, '0')}`;
  const itemSerial = rawSerial || fallbackSerial;
  const certificateQrCode = extractCertificatePayload(itemRow);
  const status = certificateQrCode ? 'generated' : 'pending';
  const generatedAt = formatDateOnly(itemRow?.createdAt);

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
  const params = useLocalSearchParams();
  const collectionId = parseParam(params.collectionId);

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
  const [downloadingQrId, setDownloadingQrId] = useState('');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const loadQrSourceData = useCallback(async (showInitialLoader = true) => {
    try {
      if (showInitialLoader) {
        setIsLoadingData(true);
      }
      setLoadError('');

      if (!collectionId) {
        setAllProducts([]);
        setAllItemEntries([]);
        setLoadError('Missing collection id');
        return;
      }

      const mergedProducts = await collectionService.getProductsByCollection(collectionId).catch(() => []);
      setAllProducts(mergedProducts);

      const itemGroups = await Promise.all(
        mergedProducts.map(async (product) => {
          const detail = await collectionService.getProductById(product.id).catch(() => null);
          const rows = Array.isArray(detail?.purchaseItems) ? detail.purchaseItems : [];
          return rows.map((row, index) => createProductItemQrEntry(row, product, index));
        })
      );

      const flatItems = itemGroups.flat();

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
  }, [collectionId]);

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

    const downloadSingleQr = async () => {
      try {
        setDownloadingQrId(qr.id);
        const mediaPermission = await MediaLibrary.requestPermissionsAsync();
        if (!mediaPermission.granted) {
          Alert.alert('Permission required', 'Media Library permission is required to save images.');
          return;
        }

        const sourceUrl = qr.qrUrl || buildQrUrl(qr.activeQrPayload || qr.certificateQrCode);
        const fileName = `trustmark-qr-${sanitizeFileName(qr.itemSerial || qr.id)}.png`;
        const targetFile = new File(Paths.cache, fileName);
        const downloadedFile = await File.downloadFileAsync(sourceUrl, targetFile, { idempotent: true });

        await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
        Alert.alert('Saved', `QR image saved to Photos for item ${qr.itemSerial}.`);
      } catch (error) {
        Alert.alert('Download failed', error?.message || 'Unable to download this QR image.');
      } finally {
        setDownloadingQrId('');
      }
    };

    void downloadSingleQr();
  };

  const handleDownloadAllQrs = async () => {
    const generatedRows = filteredQrCodes.filter((row) => row.status === 'generated');
    if (generatedRows.length === 0) {
      Alert.alert('No QR available', 'There are no generated QR codes to download.');
      return;
    }

    try {
      setIsDownloadingAll(true);
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert('Permission required', 'Media Library permission is required to save images.');
        return;
      }

      let successCount = 0;
      for (let index = 0; index < generatedRows.length; index += 1) {
        const qr = generatedRows[index];
        const sourceUrl = qr.qrUrl || buildQrUrl(qr.activeQrPayload || qr.certificateQrCode);
        const fileName = `trustmark-qr-${sanitizeFileName(qr.itemSerial || qr.id)}-${String(index + 1).padStart(3, '0')}.png`;
        const targetFile = new File(Paths.cache, fileName);

        try {
          const downloadedFile = await File.downloadFileAsync(sourceUrl, targetFile, { idempotent: true });
          await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
          successCount += 1;
        } catch {
        }
      }

      Alert.alert('Download Complete', `Saved ${successCount} of ${generatedRows.length} QR images to Photos.`);
    } catch (error) {
      Alert.alert('Download failed', error?.message || 'Unable to download all QR images.');
    } finally {
      setIsDownloadingAll(false);
    }
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
    } catch {
      Alert.alert('Share failed', 'Unable to open the share sheet right now.');
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
                        style={[
                          s.qrActionBtn,
                          (qr.status !== 'generated' || downloadingQrId === qr.id || isDownloadingAll) && s.qrActionBtnDisabled,
                        ]}
                        onPress={() => handleDownloadQr(qr)}
                        disabled={qr.status !== 'generated' || downloadingQrId === qr.id || isDownloadingAll}
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
              <TouchableOpacity
                style={[s.batchActionBtn, (!hasGeneratedRows || isDownloadingAll || !!downloadingQrId) && s.batchActionBtnDisabled]}
                disabled={!hasGeneratedRows || isDownloadingAll || !!downloadingQrId}
                onPress={handleDownloadAllQrs}
              >
                <Ionicons name="download-outline" size={18} color="#111" />
                <Text style={s.batchActionBtnText}>{isDownloadingAll ? 'Downloading...' : 'Download All'}</Text>
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
                      style={[s.modalActionBtn, s.modalActionBtnPrimary, downloadingQrId === modalQr.id && s.batchActionBtnDisabled]}
                      onPress={() => handleDownloadQr(modalQr)}
                      disabled={downloadingQrId === modalQr.id || isDownloadingAll}
                    >
                      <Ionicons name="download" size={18} color="#fff" />
                      <Text style={s.modalActionBtnText}>{downloadingQrId === modalQr.id ? 'Downloading...' : 'Download'}</Text>
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


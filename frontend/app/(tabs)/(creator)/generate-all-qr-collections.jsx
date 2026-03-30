import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Image,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

const SCOPE_OPTIONS = [
  {
    key: 'all_products',
    label: 'All Products',
    icon: 'layers-outline',
    description: 'Generate for all product items across every product.',
  },
  {
    key: 'per_product',
    label: 'Per Product',
    icon: 'cube-outline',
    description: 'Generate only for product items in one selected product.',
  },
];

const QR_TYPE_OPTIONS = [
  { key: 'nft', label: 'NFT' },
  { key: 'label', label: 'Label' },
  { key: 'certificate', label: 'Certificate' },
];

const getQrTypeLabel = (key) =>
  QR_TYPE_OPTIONS.find((option) => option.key === key)?.label || 'NFT';

const buildQrUrl = (payload) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(String(payload || ''))}`;

const formatDateOnly = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().split('T')[0];
};

const hasAllQrPayloads = (payloads) =>
  Boolean(payloads?.nft && payloads?.label && payloads?.certificate);

const createProductItemQrEntry = (itemRow, product, index) => {
  const rawSerial = String(itemRow?.itemSerial || itemRow?.id || '').replace(/^#/, '').trim();
  const fallbackSerial = `${product?.id || 'PROD'}-${String(index + 1).padStart(4, '0')}`;
  const itemSerial = rawSerial || fallbackSerial;
  const qrPayloads = {
    nft: String(itemRow?.nftQrCode || '').trim(),
    label: String(itemRow?.productLabelQrCode || '').trim(),
    certificate: String(itemRow?.certificateQrCode || '').trim(),
  };
  const status = hasAllQrPayloads(qrPayloads) ? 'generated' : 'pending';
  const generatedAt = formatDateOnly(itemRow?.mintedAt || itemRow?.createdAt);

  return {
    id: `ITEM:${itemSerial}`,
    itemName: product?.name || 'Product Item',
    collection: product?.collection || '-',
    productId: String(product?.id || '-'),
    itemSerial,
    qrPayloads,
    genDate: status === 'generated' ? generatedAt : '-',
    status,
    verified: false,
  };
};

export default function GenerateAllQrCollections() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [generationScope, setGenerationScope] = useState('all_products');
  const isGenerating = false;
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [listProductFilterId, setListProductFilterId] = useState('all');

  const [allProducts, setAllProducts] = useState([]);
  const [allItemEntries, setAllItemEntries] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState('');

  const [qrMetaById, setQrMetaById] = useState({});
  const [selectedQrTypeById, setSelectedQrTypeById] = useState({});

  const [selectedQrId, setSelectedQrId] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showListFilterModal, setShowListFilterModal] = useState(false);
  const [draftScope, setDraftScope] = useState('all_products');
  const [draftProductId, setDraftProductId] = useState('');

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

      const requestedCollectionId = parseParam(params.collectionId);
      const preferredProduct =
        (requestedCollectionId
          ? mergedProducts.find((product) => String(product.collectionId) === String(requestedCollectionId))
          : null) || mergedProducts[0];

      const nextProductId = String(preferredProduct?.id || '');
      setSelectedProductId(nextProductId);
    } catch (error) {
      setAllProducts([]);
      setAllItemEntries([]);
      setSelectedProductId('');
      setLoadError(error?.message || 'Failed to load QR source data');
    } finally {
      if (showInitialLoader) {
        setIsLoadingData(false);
      }
      setIsRefreshing(false);
    }
  }, [params.collectionId]);

  useEffect(() => {
    loadQrSourceData();
  }, [loadQrSourceData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadQrSourceData(false);
  }, [loadQrSourceData]);

  const baseQrEntries = useMemo(() => {
    if (generationScope === 'all_products') {
      return allItemEntries;
    }

    return allItemEntries.filter((entry) => String(entry.productId) === String(selectedProductId));
  }, [generationScope, selectedProductId, allItemEntries]);

  const scopedQrCodes = useMemo(
    () =>
      baseQrEntries.map((entry) => {
        const meta = qrMetaById[entry.id] || {};
        const status = entry.status;
        const selectedQrType = selectedQrTypeById[entry.id] || 'nft';
        const qrUrls =
          status === 'generated'
            ? {
                nft: buildQrUrl(entry.qrPayloads.nft),
                label: buildQrUrl(entry.qrPayloads.label),
                certificate: buildQrUrl(entry.qrPayloads.certificate),
              }
            : { nft: '', label: '', certificate: '' };
        return {
          ...entry,
          status,
          genDate: entry.genDate,
          verified: Boolean(meta.verified),
          selectedQrType,
          qrUrl: qrUrls[selectedQrType] || '',
          activeQrPayload: entry.qrPayloads[selectedQrType],
          qrUrls,
        };
      }),
    [baseQrEntries, qrMetaById, selectedQrTypeById]
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

  const activeScope = SCOPE_OPTIONS.find((scope) => scope.key === generationScope) || SCOPE_OPTIONS[0];
  const canRunGeneration = draftScope === 'all_products' || Boolean(draftProductId);
  const hasGeneratedRows = filteredQrCodes.some((row) => row.status === 'generated');
  const productItemCountMap = useMemo(() => {
    const map = {};
    allItemEntries.forEach((entry) => {
      const key = String(entry.productId);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [allItemEntries]);
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

  const openScopeModal = () => {
    const fallbackProductId = String(allProducts[0]?.id || '');
    setDraftScope(generationScope);
    setDraftProductId(selectedProductId || fallbackProductId);
    setShowScopeModal(true);
  };

  const handleGenerateForScope = async (targetRows, scopeKey) => {
    if (targetRows.length === 0) {
      Alert.alert('No Data', 'There are no product items to generate in this scope.');
      return;
    }

    const pendingRows = targetRows.filter((row) => row.status !== 'generated');
    const scopeLabel = SCOPE_OPTIONS.find((scope) => scope.key === scopeKey)?.label || 'selected scope';

    if (pendingRows.length === 0) {
      Alert.alert('Already Synced', `All QR payloads in ${scopeLabel} already come from backend.`);
      return;
    }

    Alert.alert(
      'Backend Generation Required',
      `${pendingRows.length} items in ${scopeLabel} still have no backend QR payloads. Run backend pre-mint first, then refresh this page.`
    );
  };

  const handleGenerateSingle = (qr) => {
    if (qr.status === 'generated') {
      Alert.alert('Already Synced', 'This item already has backend QR payloads.');
      return;
    }

    Alert.alert(
      'Backend Generation Required',
      'QR payload is issued by backend pre-mint. Generate it from backend lifecycle first.'
    );
  };

  const handleDownloadQr = (qr) => {
    if (qr.status !== 'generated') {
      Alert.alert('No QR available', 'This item has no backend QR payload yet.');
      return;
    }

    const qrTypeLabel = getQrTypeLabel(qr.selectedQrType);
    Alert.alert(
      'Download QR Code',
      `Downloading ${qrTypeLabel} QR for "${qr.itemName}"\nItem Serial: ${qr.itemSerial}`,
      [{ text: 'OK' }]
    );
  };

  const handleShareQr = async (qr) => {
    if (qr.status !== 'generated') {
      Alert.alert('No QR available', 'This item has no backend QR payload yet.');
      return;
    }

    try {
      const qrTypeLabel = getQrTypeLabel(qr.selectedQrType);
      await Share.share({
        message: `Digital Seal ${qrTypeLabel} QR for ${qr.itemName}\n\nItem Serial: ${qr.itemSerial}\nCollection: ${qr.collection}\nGenerated: ${qr.genDate}\nPayload: ${qr.activeQrPayload}`,
        title: 'Share QR Code',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleVerifyQr = (qr) => {
    setQrMetaById((previous) => {
      const current = previous[qr.id] || {};
      return {
        ...previous,
        [qr.id]: {
          ...current,
          verified: !Boolean(current.verified),
        },
      };
    });
  };

  const handleShowQr = (qr) => {
    if (qr.status !== 'generated') {
      Alert.alert('No QR available', 'This item has no backend QR payload yet.');
      return;
    }

    setSelectedQrId(qr.id);
    setShowQrModal(true);
  };

  const handleSelectQrType = (qrId, qrType) => {
    setSelectedQrTypeById((previous) => ({
      ...previous,
      [qrId]: qrType,
    }));
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
            <Text style={s.statValue}>{filteredQrCodes.filter((q) => q.verified).length}</Text>
            <Text style={s.statLabel}>Verified</Text>
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
          <View style={s.section}>
            <TouchableOpacity
              style={s.generateAllBtn}
              disabled={isGenerating}
              onPress={openScopeModal}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={s.generateAllBtnText}>Generating...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="qr-code" size={20} color="#fff" />
                  <Text style={s.generateAllBtnText}>Generate Items</Text>
                </>
              )}
            </TouchableOpacity>
            {!isGenerating && (
              <Text style={s.generateHintText}>
                Current option: {activeScope.label}. QR payloads are issued by backend pre-mint.
              </Text>
            )}
          </View>

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
                        {qr.verified && (
                          <View style={s.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                            <Text style={s.verifiedText}>Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.qrDate}>Generated: {qr.genDate}</Text>
                      {qr.status !== 'generated' && (
                        <TouchableOpacity style={s.generateRowBtn} onPress={() => handleGenerateSingle(qr)}>
                          <Ionicons name="qr-code" size={14} color="#fff" />
                          <Text style={s.generateRowBtnText}>Use Backend</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={s.qrCardActions}>
                      <TouchableOpacity
                        style={[s.qrActionBtn, qr.status !== 'generated' && s.qrActionBtnDisabled]}
                        onPress={() => handleVerifyQr(qr)}
                        disabled={qr.status !== 'generated'}
                      >
                        <Ionicons
                          name={qr.verified ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={20}
                          color={qr.status !== 'generated' ? '#bbb' : qr.verified ? '#4CAF50' : '#888'}
                        />
                      </TouchableOpacity>
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
              <Text style={s.infoTitle}>About QR Scopes</Text>
            </View>
            <Text style={s.infoText}>
              QR payloads come from backend pre-mint and are stored per product item. This screen only previews and manages backend-issued QR types (NFT, Label, Certificate).
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
                  <View style={s.modalQrTypeRow}>
                    {QR_TYPE_OPTIONS.map((typeOption) => {
                      const isActive = modalQr.selectedQrType === typeOption.key;
                      return (
                        <TouchableOpacity
                          key={`modal:${modalQr.id}:${typeOption.key}`}
                          style={[s.qrTypeChip, isActive && s.qrTypeChipActive]}
                          onPress={() => handleSelectQrType(modalQr.id, typeOption.key)}
                        >
                          <Text style={[s.qrTypeChipText, isActive && s.qrTypeChipTextActive]}>
                            {typeOption.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
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

        <Modal visible={showScopeModal} transparent animationType="fade" onRequestClose={() => setShowScopeModal(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowScopeModal(false)} />
          <View style={s.modalCenter} pointerEvents="box-none">
            <View style={s.scopeModalCard}>
              <Text style={s.scopeModalTitle}>Choose Generation Scope</Text>
              <Text style={s.scopeModalSubtitle}>Select how QR should be generated before running.</Text>

              <View style={s.scopeOptionList}>
                {SCOPE_OPTIONS.map((scope) => (
                  <TouchableOpacity
                    key={scope.key}
                    style={[s.scopeOptionCard, draftScope === scope.key && s.scopeOptionCardActive]}
                    onPress={() => setDraftScope(scope.key)}
                  >
                    <View style={[s.scopeIconWrap, draftScope === scope.key && s.scopeIconWrapActive]}>
                      <Ionicons
                        name={scope.icon}
                        size={16}
                        color={draftScope === scope.key ? '#fff' : '#333'}
                      />
                    </View>
                    <View style={s.scopeTextWrap}>
                      <Text style={[s.scopeOptionTitle, draftScope === scope.key && s.scopeOptionTitleActive]}>
                        {scope.label}
                      </Text>
                      <Text style={s.scopeOptionDesc}>{scope.description}</Text>
                    </View>
                    {draftScope === scope.key && <Ionicons name="checkmark-circle" size={18} color="#111" />}
                  </TouchableOpacity>
                ))}
              </View>

              {draftScope === 'per_product' && (
                <View style={s.productPickerWrap}>
                  <Text style={s.productPickerTitle}>Select Product</Text>
                  <ScrollView style={s.productPickerList} showsVerticalScrollIndicator={false}>
                    {allProducts.map((product) => {
                      const isActive = String(draftProductId) === String(product.id);
                      const productItems = productItemCountMap[String(product.id)] || 0;
                      return (
                        <TouchableOpacity
                          key={product.id}
                          style={[s.productPickerOption, isActive && s.productPickerOptionActive]}
                          onPress={() => setDraftProductId(String(product.id))}
                        >
                          <View style={s.productPickerTextWrap}>
                            <Text style={[s.productPickerName, isActive && s.productPickerNameActive]} numberOfLines={1}>
                              {product.name}
                            </Text>
                            <Text style={s.productPickerMeta} numberOfLines={1}>
                              {productItems} product items
                            </Text>
                          </View>
                          <View style={[s.productPickerBadge, isActive && s.productPickerBadgeActive]}>
                            <Text style={[s.productPickerBadgeText, isActive && s.productPickerBadgeTextActive]}>
                              {productItems}
                            </Text>
                          </View>
                          {isActive && <Ionicons name="checkmark-circle" size={18} color="#111" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={s.scopeModalActions}>
                <TouchableOpacity style={[s.modalActionBtn, s.modalActionBtnSecondary]} onPress={() => setShowScopeModal(false)}>
                  <Text style={[s.modalActionBtnText, { color: '#111' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalActionBtn, s.modalActionBtnPrimary, !canRunGeneration && s.modalActionBtnDisabled]}
                  disabled={!canRunGeneration}
                  onPress={() => {
                    const targetRows =
                      draftScope === 'all_products'
                        ? allItemEntries
                        : allItemEntries.filter((entry) => String(entry.productId) === String(draftProductId));
                    setGenerationScope(draftScope);
                    setSelectedProductId(draftProductId);
                    setListProductFilterId(draftScope === 'per_product' ? String(draftProductId) : 'all');
                    setShowScopeModal(false);
                    handleGenerateForScope(targetRows, draftScope);
                  }}
                >
                  <Text style={s.modalActionBtnText}>Generate</Text>
                </TouchableOpacity>
              </View>
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

  qrTypeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  modalQrTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  qrTypeChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  qrTypeChipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  qrTypeChipText: {
    fontSize: 11,
    color: '#444',
    fontWeight: '600',
  },
  qrTypeChipTextActive: {
    color: '#fff',
  },

  content: { flex: 1, paddingHorizontal: 16 },
  section: { marginVertical: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 12 },

  generateAllBtn: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateAllBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  generateHintText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

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
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verifiedText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  qrDate: { fontSize: 11, color: '#aaa' },

  qrCardActions: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  qrActionBtn: { padding: 8 },
  qrActionBtnDisabled: { opacity: 0.45 },
  generateRowBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  generateRowBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

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
  scopeModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '92%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  scopeModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },
  scopeModalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  scopeModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
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
  scopeOptionList: {
    gap: 8,
    marginBottom: 6,
  },
  scopeOptionCard: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  scopeOptionCardActive: {
    borderColor: '#111',
    backgroundColor: '#f7f7f7',
  },
  scopeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeIconWrapActive: {
    backgroundColor: '#111',
  },
  scopeTextWrap: {
    flex: 1,
  },
  scopeOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  scopeOptionTitleActive: {
    color: '#111',
  },
  scopeOptionDesc: {
    marginTop: 2,
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  productPickerWrap: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    padding: 10,
  },
  productPickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
    marginBottom: 8,
  },
  productPickerList: {
    maxHeight: 180,
  },
  productPickerOption: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPickerOptionActive: {
    borderColor: '#111',
    backgroundColor: '#f5f5f5',
  },
  productPickerTextWrap: {
    flex: 1,
  },
  productPickerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  productPickerNameActive: {
    color: '#111',
  },
  productPickerMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#777',
  },
  productPickerBadge: {
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: '#ededed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productPickerBadgeActive: {
    backgroundColor: '#111',
  },
  productPickerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
  },
  productPickerBadgeTextActive: {
    color: '#fff',
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
  modalActionBtnDisabled: { opacity: 0.45 },
  modalActionBtnSecondary: { backgroundColor: '#f0f0f0' },
  modalActionBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

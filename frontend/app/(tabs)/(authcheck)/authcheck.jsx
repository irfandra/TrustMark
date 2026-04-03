import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, Animated, ActivityIndicator, Image } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { collectionService } from '@/services/collectionService';
import { orderService } from '@/services/orderService';
import { styles } from '@/constants/styles/creator-authcheck-styles.js';

const normalizeCertificateSerial = (value) => {
  const raw = String(value || '').trim();
  const marker = 'trustmark://certificate/';
  const lowercase = raw.toLowerCase();

  if (lowercase.startsWith(marker)) {
    return raw.slice(marker.length).trim().toUpperCase();
  }

  return raw.toUpperCase();
};

export default function AuthenticityCheckScreen() {
  const [permissions, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedValue, setScannedValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isPreparingIndex, setIsPreparingIndex] = useState(true);
  const [resultData, setResultData] = useState(null);
  const [productIndexBySerial, setProductIndexBySerial] = useState({});
  const [isCompletingShipment, setIsCompletingShipment] = useState(false);

  const checkSpinAnim = useRef(new Animated.Value(0)).current;
  const resultRevealAnim = useRef(new Animated.Value(0)).current;

  const checkSpinStyle = useMemo(
    () => ({
      transform: [
        {
          rotate: checkSpinAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
      ],
    }),
    [checkSpinAnim]
  );

  const resultAnimatedStyle = useMemo(
    () => ({
      opacity: resultRevealAnim,
      transform: [
        {
          translateY: resultRevealAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [24, 0],
          }),
        },
        {
          scale: resultRevealAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1],
          }),
        },
      ],
    }),
    [resultRevealAnim]
  );

  useEffect(() => {
    let isMounted = true;

    const prepareProductIndex = async () => {
      setIsPreparingIndex(true);

      try {
        const collections = await collectionService.getCollectionsByBrand();

        const productGroups = await Promise.all(
          collections.map(async (collection) => {
            const products = await collectionService.getProductsByCollection(collection.id).catch(() => []);
            return products.map((product) => ({
              ...product,
              collectionName: product.collection || collection.title || 'Collection',
              brandName: product.brand || collection.brand || 'Brand',
            }));
          })
        );

        const products = productGroups.flat();

        const details = await Promise.all(
          products.map(async (product) => {
            const detail = await collectionService.getProductById(product.id).catch(() => null);
            return { product, detail };
          })
        );

        const nextIndex = {};

        details.forEach(({ product, detail }) => {
          const itemRows = Array.isArray(detail?.purchaseItems) ? detail.purchaseItems : [];

          itemRows.forEach((row) => {
            const serial = normalizeCertificateSerial(row?.itemSerial || row?.id || '');
            if (!serial || nextIndex[serial]) {
              return;
            }

            nextIndex[serial] = {
              serial,
              productId: String(product?.id || '-'),
              productName: detail?.name || product?.name || 'Product Item',
              collectionName: detail?.collection || product?.collectionName || '-',
              brandName: detail?.brand || product?.brandName || '-',
              imageUrl: detail?.image || product?.image || '',
              edition: row?.edition || '-',
              statusLabel: row?.statusLabel || '-',
              priceAmount: row?.price || detail?.priceAmount || product?.priceAmount || '--',
              currency: detail?.priceToken || product?.currency || 'USD',
            };
          });
        });

        if (isMounted) {
          setProductIndexBySerial(nextIndex);
        }
      } finally {
        if (isMounted) {
          setIsPreparingIndex(false);
        }
      }
    };

    prepareProductIndex();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isChecking) {
      checkSpinAnim.stopAnimation();
      checkSpinAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(checkSpinAnim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [isChecking, checkSpinAnim]);

  const revealResultCard = () => {
    resultRevealAnim.setValue(0);

    Animated.spring(resultRevealAnim, {
      toValue: 1,
      tension: 80,
      friction: 9,
      useNativeDriver: true,
    }).start();
  };

  const buildResultData = (rawValue, sourceLabel) => {
    const raw = String(rawValue || '').trim();
    const normalized = normalizeCertificateSerial(raw);
    const isCertificateQr = raw.toLowerCase().startsWith('trustmark://certificate/');
    const matchedProduct = normalized ? productIndexBySerial[normalized] : null;

    if (!raw) {
      return {
        variant: 'neutral',
        title: 'No QR Data Found',
        subtitle: `${sourceLabel} did not detect any QR payload.`,
        serial: '',
        sourceLabel,
        product: null,
      };
    }

    if (!isCertificateQr) {
      return {
        variant: 'warning',
        title: 'Unsupported QR Type',
        subtitle: `${sourceLabel} detected QR data, but it is not a TrustMark certificate.`,
        serial: normalized,
        sourceLabel,
        product: null,
      };
    }

    if (!matchedProduct) {
      return {
        variant: 'warning',
        title: 'Certificate Format Valid',
        subtitle: `${sourceLabel} found certificate serial ${normalized}, but this item was not found in your product library yet.`,
        serial: normalized,
        sourceLabel,
        product: null,
      };
    }

    return {
      variant: 'success',
      title: 'Certificate Verified',
      subtitle: `${sourceLabel} matched this certificate with your product inventory.`,
      serial: normalized,
      sourceLabel,
      product: matchedProduct,
    };
  };

  const performAnimatedCheck = async (rawValue, sourceLabel) => {
    setScannedValue(String(rawValue || '').trim());
    setResultData(null);
    setIsChecking(true);

    await new Promise((resolve) => setTimeout(resolve, 720));

    const nextResult = buildResultData(rawValue, sourceLabel);
    let enrichedResult = nextResult;

    if (nextResult?.variant === 'success' && nextResult?.product?.productId && nextResult?.serial) {
      const shippedOrder = await orderService.findShippedOrderForItemSerial(
        nextResult.product.productId,
        nextResult.serial
      );
      enrichedResult = {
        ...nextResult,
        shippedOrder,
      };
    }

    setResultData(enrichedResult);
    setIsChecking(false);
    revealResultCard();
  };

  const handleMarkCompleteMock = async () => {
    if (!resultData?.shippedOrder?.orderId || isCompletingShipment) {
      return;
    }

    try {
      setIsCompletingShipment(true);
      await orderService.completeCreatorOrder(resultData.shippedOrder.orderId);

      setResultData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          variant: 'success',
          title: 'Shipment Completed (Mock)',
          subtitle: `Uploaded QR matched order ${resultData.shippedOrder.orderNumber}. Shipment is now marked COMPLETED for mock user delivery flow.`,
          shippedOrder: null,
        };
      });
      Alert.alert('Success', 'Shipment status marked as completed (mock flow).');
    } catch (error) {
      Alert.alert('Unable to complete shipment', error?.message || 'Mock completion failed.');
    } finally {
      setIsCompletingShipment(false);
    }
  };

  const openScanner = async () => {
    if (!permissions?.granted) {
      const granted = await requestPermission();
      if (!granted?.granted) {
        setResultData({
          variant: 'warning',
          title: 'Camera Permission Needed',
          subtitle: 'Camera access is required to scan QR codes.',
          serial: '',
          sourceLabel: 'Camera scan',
          product: null,
        });
        revealResultCard();
        return;
      }
    }

    setScannerOpen(true);
  };

  const onBarcodeScanned = ({ data }) => {
    setScannerOpen(false);
    performAnimatedCheck(data, 'Camera scan');
  };

  const scanQrFromImageUri = async (uri, sourceLabel) => {
    try {
      const results = await Camera.scanFromURLAsync(uri, ['qr']);
      if (!Array.isArray(results) || results.length === 0) {
        performAnimatedCheck('', sourceLabel);
        return;
      }

      const firstDetected = results.find((entry) => entry?.data)?.data;
      performAnimatedCheck(firstDetected, sourceLabel);
    } catch (_error) {
      setResultData({
        variant: 'warning',
        title: 'Image Read Failed',
        subtitle: `${sourceLabel} failed to read uploaded image QR.`,
        serial: '',
        sourceLabel,
        product: null,
      });
      revealResultCard();
    }
  };

  const handleUploadFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setResultData({
        variant: 'warning',
        title: 'Gallery Permission Needed',
        subtitle: 'Gallery access is required to upload QR images.',
        serial: '',
        sourceLabel: 'Gallery upload',
        product: null,
      });
      revealResultCard();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await scanQrFromImageUri(result.assets[0].uri, 'Gallery upload');
    }
  };

  const handleUploadFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await scanQrFromImageUri(result.assets[0].uri, 'File upload');
      }
    } catch (_error) {
      setResultData({
        variant: 'warning',
        title: 'File Upload Failed',
        subtitle: 'Please try again with a different image file.',
        serial: '',
        sourceLabel: 'File upload',
        product: null,
      });
      revealResultCard();
    }
  };

  const openUploadOptions = () => {
    Alert.alert(
      'Upload QR Image',
      'Choose image source for QR checking.',
      [
        {
          text: 'Gallery',
          onPress: handleUploadFromGallery,
        },
        {
          text: 'Files',
          onPress: handleUploadFromFiles,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleResetCheck = () => {
    setScannerOpen(false);
    setScannedValue('');
    setResultData(null);
    setIsChecking(false);

    checkSpinAnim.stopAnimation();
    checkSpinAnim.setValue(0);
    resultRevealAnim.stopAnimation();
    resultRevealAnim.setValue(0);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Authenticity Check</Text>

      {isPreparingIndex && (
        <View style={styles.preparingCard}>
          <ActivityIndicator size="small" color="#1E2C3A" />
          <Text style={styles.preparingText}>Preparing product details for instant certificate matching...</Text>
        </View>
      )}

      <View style={styles.stepSection}>
        <View style={styles.row}>
          <View style={styles.circle}>
            <Text style={styles.circleText}>1</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Scan or Upload Certificate QR</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, styles.actionBtn]} onPress={openScanner}>
                <Text style={styles.buttonText}>Scan by Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, styles.actionBtn]} onPress={openUploadOptions}>
                <Text style={styles.secondaryButtonText}>Upload Image</Text>
              </TouchableOpacity>
            </View>
            {!!scannedValue && (
              <Text style={styles.helperText} numberOfLines={2}>
                {scannedValue}
              </Text>
            )}

            {(!!scannedValue || !!resultData || isChecking) && (
              <TouchableOpacity style={styles.resetButton} onPress={handleResetCheck}>
                <Text style={styles.resetButtonText}>Reset & Scan Other</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.connector} />
      </View>

      <View style={styles.stepSection}>
        <View style={styles.row}>
          <View style={styles.circle}>
            <Text style={styles.circleText}>2</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Check Result</Text>
            {isChecking ? (
              <View style={styles.checkingCard}>
                <Animated.View style={[styles.checkingRing, checkSpinStyle]} />
                <Text style={styles.checkingTitle}>Checking certificate...</Text>
                <Text style={styles.checkingSubtitle}>Matching QR payload with product library.</Text>
              </View>
            ) : resultData ? (
              <Animated.View
                style={[
                  styles.resultCard,
                  resultData.variant === 'success' && styles.resultCardSuccess,
                  resultData.variant === 'warning' && styles.resultCardWarning,
                  resultAnimatedStyle,
                ]}
              >
                <Text style={styles.resultTitle}>{resultData.title}</Text>
                <Text style={styles.resultText}>{resultData.subtitle}</Text>

                {!!resultData.serial && (
                  <Text style={styles.resultSerial}>Serial: {resultData.serial}</Text>
                )}

                {!!resultData.product && (
                  <View style={styles.productDetailWrap}>
                    {!!resultData.product.imageUrl && (
                      <Image source={{ uri: resultData.product.imageUrl }} style={styles.productImage} />
                    )}

                    <View style={styles.productMetaWrap}>
                      <Text style={styles.productName}>{resultData.product.productName}</Text>
                      <Text style={styles.productMetaText}>Collection: {resultData.product.collectionName}</Text>
                      <Text style={styles.productMetaText}>Brand: {resultData.product.brandName}</Text>
                      <Text style={styles.productMetaText}>Product ID: {resultData.product.productId}</Text>
                      <Text style={styles.productMetaText}>Item Serial: {resultData.product.serial}</Text>
                      <Text style={styles.productMetaText}>Edition: {resultData.product.edition}</Text>
                      <Text style={styles.productMetaText}>Status: {resultData.product.statusLabel}</Text>
                      <Text style={styles.productMetaText}>
                        Price: {resultData.product.currency} {resultData.product.priceAmount}
                      </Text>
                    </View>
                  </View>
                )}

                {!!resultData.product && String(resultData.sourceLabel || '').toLowerCase().includes('upload') && (
                  <View style={styles.shipmentMockWrap}>
                    {!!resultData.shippedOrder ? (
                      <>
                        <Text style={styles.shipmentMockNote}>
                          Eligible mock completion: order {resultData.shippedOrder.orderNumber} is currently SHIPPED.
                        </Text>
                        <TouchableOpacity
                          style={[styles.shipmentMockButton, isCompletingShipment && styles.shipmentMockButtonDisabled]}
                          onPress={handleMarkCompleteMock}
                          disabled={isCompletingShipment}
                        >
                          <Text style={styles.shipmentMockButtonText}>
                            {isCompletingShipment ? 'Completing...' : 'Mark Complete Shipment (Mock)'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.shipmentMockNoteMuted}>
                        No SHIPPED order found for this item. Only items in SHIPPED status can be marked complete.
                      </Text>
                    )}
                  </View>
                )}
              </Animated.View>
            ) : (
              <Text style={styles.helperText}>Scan by camera or upload an image to check certificate QR.</Text>
            )}
          </View>
        </View>
      </View>

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerRoot}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerTitle}>Scan Certificate QR</Text>
            <Text style={styles.scannerSubtitle}>Align the QR code inside the camera view.</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setScannerOpen(false)}>
              <Text style={styles.closeButtonText}>Close Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}


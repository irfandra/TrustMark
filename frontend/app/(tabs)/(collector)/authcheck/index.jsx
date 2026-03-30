// app/(tabs)/(collector)/authcheck/index.jsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActionSheetIOS, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';
import ItemDetailCard from '../../../../components/card/ItemDetailCard';

export default function AuthCheckPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [selectedItem, setSelectedItem] = useState(null);
  const [labelScanned, setLabelScanned] = useState(false);
  const [certScanned,  setCertScanned]  = useState(false);
  const [result,       setResult]       = useState(null);

  const canCheck = selectedItem && labelScanned && certScanned;

  useFocusEffect(
    useCallback(() => {
      if (params.selectedItem) {
        try {
          const item = JSON.parse(decodeURIComponent(params.selectedItem));
          setSelectedItem(item);
        } catch {}
      }
      if (params.labelScanned === 'true')       setLabelScanned(true);
      if (params.certificateScanned === 'true') setCertScanned(true);
    }, [params.selectedItem, params.labelScanned, params.certificateScanned])
  );

  const decodeQRFromUri = async (uri, type) => {
    try {
      const decoded = await Camera.scanFromURLAsync(uri);
      if (!decoded || decoded.length === 0) {
        Alert.alert('No QR Found', 'Could not detect a QR code. Try a clearer image.');
        return;
      }
      validateQR(decoded[0].data, type);
    } catch {
      Alert.alert('Error', 'Failed to read the image. Please try again.');
    }
  };

  const validateQR = (data, type) => {
    if (!selectedItem) {
      Alert.alert('Select Item First', 'Please select an NFT item before scanning.');
      return;
    }
    const expected = type === 'label' ? selectedItem.labelQR : selectedItem.certificateQR;
    if (data === expected) {
      if (type === 'label')       setLabelScanned(true);
      if (type === 'certificate') setCertScanned(true);
    } else {
      Alert.alert('Invalid QR Code', 'This QR does not match the selected item.',
        [{ text: 'Try Again', style: 'cancel' }]
      );
    }
  };

  const pickFromGallery = async (type) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 1,
    });
    if (!result.canceled) await decodeQRFromUri(result.assets[0].uri, type);
  };

  const pickFromFiles = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        await decodeQRFromUri(result.assets[0].uri, type);
      }
    } catch {
      Alert.alert('Error', 'Failed to open file. Please try again.');
    }
  };

  const handleUploadQR = (type) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Choose from Gallery', 'Choose from Files'], cancelButtonIndex: 0 },
        (i) => {
          if (i === 1) pickFromGallery(type);
          if (i === 2) pickFromFiles(type);
        }
      );
    } else {
      Alert.alert('Select Source', '', [
        { text: 'Gallery', onPress: () => pickFromGallery(type) },
        { text: 'Files',   onPress: () => pickFromFiles(type)   },
        { text: 'Cancel',  style: 'cancel' },
      ]);
    }
  };

  const simulateScan = (type) => {
    if (!selectedItem) {
      Alert.alert('Select Item First', 'Please select an NFT item before scanning.');
      return;
    }
    validateQR(
      type === 'label' ? selectedItem.labelQR : selectedItem.certificateQR,
      type
    );
  };

 const handleCheckResult = () => {
  // ✅ Enrich item with mock transaction + spec data if not present
  const enrichedItem = {
    ...selectedItem,
    specs: selectedItem.specs ?? [
      { label: 'Color',  value: 'Blue' },
      { label: 'Straps', value: 'Gold' },
    ],
    edition: selectedItem.edition ?? 'Edition 124 of 450 Items in Collection',
    transaction: selectedItem.transaction ?? {
      currentOwner: '@glimpse27',
      contract:     '09ase1sd1sdnadmkasdhrnasdmkq3er1iqweqeqe1321s31er',
      from:         'NullAddress',
      to:           '0xa12asd1235f425....',
      value:        'POL 120,100',
      usd:          '~$11,000',
    },
  };

  router.push({
    pathname: '/authcheck/result',
    params: {
      result:   'authentic',
      itemData: encodeURIComponent(JSON.stringify(enrichedItem)),
    },
  });
};

  const handleReset = () => {
    setSelectedItem(null);
    setLabelScanned(false);
    setCertScanned(false);
    setResult(null);
  };

  const ScanStep = ({ number, title, type, scanned, label }) => (
    <View style={styles.stepSection}>
      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, scanned && styles.stepCircleDone]}>
          {scanned
            ? <Ionicons name="checkmark" size={16} color="#fff" />
            : <Text style={styles.stepNumber}>{number}</Text>
          }
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{title}</Text>
          {!scanned && (
            <>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnHalf]}
                  onPress={() => Alert.alert('Camera', 'Use a real device to scan QR.')}
                >
                  <Ionicons name="qr-code-outline" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>Scan QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnHalf, styles.actionBtnOutline]}
                  onPress={() => handleUploadQR(type)}
                >
                  <Ionicons name="cloud-upload-outline" size={15} color="#111" />
                  <Text style={[styles.actionBtnText, { color: '#111' }]}>Upload QR</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.uploadHint}>Upload supports Gallery & Files</Text>
              {__DEV__ && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#7B3FE4' }]}
                  onPress={() => simulateScan(type)}
                >
                  <Ionicons name="bug-outline" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>Simulate (Dev)</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {scanned && (
            <View style={styles.scannedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#27AE60" />
              <Text style={[styles.scannedText, { color: '#27AE60' }]}>{label} Verified</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // ── Result Screen ──
  if (result) {
    const isAuthentic = result === 'authentic';
    return (
      <View style={styles.resultContainer}>
        <View style={[styles.resultIcon, { backgroundColor: isAuthentic ? '#27AE60' : '#E74C3C' }]}>
          <Ionicons name={isAuthentic ? 'shield-checkmark' : 'close-circle'} size={56} color="#fff" />
        </View>
        <Text style={styles.resultTitle}>{isAuthentic ? 'Authentic!' : 'Not Authentic'}</Text>
        <Text style={styles.resultSubtitle}>
          {isAuthentic
            ? `${selectedItem?.name} (${selectedItem?.id}) has been verified as authentic on the ZEAL blockchain.`
            : 'This item could not be verified. The QR codes do not match the blockchain record.'
          }
        </Text>
        {selectedItem && (
          <View style={styles.resultCardWrapper}>
            <ItemDetailCard
              item={selectedItem}
              showStatus={false}
              cardWidth={300}
            />
          </View>
        )}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Check Another Item</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Authenticity Check</Text>

      {/* ── STEP 1 ── */}
      <View style={styles.stepSection}>
        <View style={styles.stepRow}>
          <View style={[styles.stepCircle, selectedItem && styles.stepCircleDone]}>
            {selectedItem
              ? <Ionicons name="checkmark" size={16} color="#fff" />
              : <Text style={styles.stepNumber}>1</Text>
            }
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select NFT Items</Text>

            {/* ✅ Always show Select/Change button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/authcheck/selectnft')}
            >
              <Ionicons
                name={selectedItem ? 'swap-horizontal-outline' : 'add-circle-outline'}
                size={16}
                color="#fff"
              />
              <Text style={styles.actionBtnText}>
                {selectedItem ? 'Change Item' : '+ Select NFT'}
              </Text>
            </TouchableOpacity>

            {/* ✅ Show card below button when item is selected */}
            {selectedItem && (
              <View style={styles.selectedCardRow}>
                <ItemDetailCard
                  item={selectedItem}
                  showStatus={!!selectedItem.status}
                  cardWidth={160}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.connector} />
      <ScanStep number={2} title="Scan Product Labels"       type="label"       scanned={labelScanned} label="Label"       />
      <View style={styles.connector} />
      <ScanStep number={3} title="Scan Physical Certificate" type="certificate" scanned={certScanned}  label="Certificate" />
      <View style={styles.connector} />

      {/* ── STEP 4 ── */}
      <View style={styles.stepSection}>
        <View style={styles.stepRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Finish & Check Result</Text>
            <TouchableOpacity
              style={[styles.actionBtn, !canCheck && styles.actionBtnDisabled]}
              onPress={canCheck ? handleCheckResult : null}
              activeOpacity={canCheck ? 0.85 : 1}
            >
              <Text style={styles.actionBtnText}>Check Result</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#fff' },
  scroll:     { paddingHorizontal: 20, paddingTop: 10 },
  pageTitle:  { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 24 },

  stepSection:    { marginBottom: 0 },
  stepRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  stepCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#111', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  stepCircleDone: { backgroundColor: '#27AE60' },
  stepNumber:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepContent:    { flex: 1, paddingBottom: 16, gap: 10 },
  stepTitle:      { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 8 },
  connector: {
    width: 2, height: 20, backgroundColor: '#ddd',
    marginLeft: 18, marginVertical: 4,
  },

  btnRow:            { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: '#111', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8,
  },
  actionBtnHalf:     { flex: 1 },
  actionBtnOutline:  { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd' },
  actionBtnDisabled: { backgroundColor: '#aaa' },
  actionBtnText:     { color: '#fff', fontSize: 14, fontWeight: '700' },
  uploadHint:        { fontSize: 11, color: '#aaa', marginTop: -4 },

  scannedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  scannedText: { fontSize: 13, fontWeight: '600' },

  // ✅ Card shown below select button
  selectedCardRow: {
    flexDirection: 'row',
  },

  // ✅ Result screen
  resultCardWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  resultContainer: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  resultIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  resultTitle:    { fontSize: 28, fontWeight: '900', color: '#111' },
  resultSubtitle: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
  resetBtn: {
    width: '100%', backgroundColor: '#111', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  resetBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
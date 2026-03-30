// app/(tabs)/item/[itemId]/claimownership.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';

// ✅ Mock API
const fetchItem = (itemId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const MOCK_DB = {
        'AZEDR': {
          id: '#AZEDR',
          name: 'Birkin Brownies',
          collection: 'Birkin Collections',
          brand: 'Hermès',
          brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png',
          labelQR: 'zeal://item/AZEDR/label',
          certificateQR: 'zeal://item/AZEDR/certificate',
        },
        'BK291': {
          id: '#BK291',
          name: 'Birkin Brownies',
          collection: 'Birkin Collections',
          brand: 'Hermès',
          brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png',
          labelQR: 'zeal://item/BK291/label',
          certificateQR: 'zeal://item/BK291/certificate',
        },
        'NK412': {
          id: '#NK412',
          name: 'AJ1 Chicago',
          collection: 'Air Jordan 1 Series',
          brand: 'Nike',
          brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png',
          labelQR: 'zeal://item/NK412/label',
          certificateQR: 'zeal://item/NK412/certificate',
        },
        'LG088': {
          id: '#LG088',
          name: 'Falcon Standard',
          collection: 'Millennium Falcon',
          brand: 'LEGO',
          brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/200px-LEGO_logo.svg.png',
          labelQR: 'zeal://item/LG088/label',
          certificateQR: 'zeal://item/LG088/certificate',
        },
      };
      const cleanId = itemId.replace('#', '');
      const found = MOCK_DB[cleanId];
      if (found) resolve(found);
      else reject(new Error('Item not found'));
    }, 600);
  });
};

export default function ClaimOwnershipPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { itemId } = params;

  const [item,    setItem]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [labelScanned, setLabelScanned] = useState(false);
  const [certScanned,  setCertScanned]  = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);

  const canClaim = labelScanned && certScanned;

  useEffect(() => {
    const load = async () => {
      try {
        const decodedId = decodeURIComponent(itemId);
        const data = await fetchItem(decodedId);
        setItem(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [itemId]);

  useFocusEffect(
    useCallback(() => {
      if (params.labelScanned === 'true')       setLabelScanned(true);
      if (params.certificateScanned === 'true') setCertScanned(true);
    }, [params.labelScanned, params.certificateScanned])
  );

  const validateQR = (data, type) => {
    if (!item) return;
    const expectedQR = type === 'label' ? item.labelQR : item.certificateQR;
    if (data === expectedQR) {
      if (type === 'label')       setLabelScanned(true);
      if (type === 'certificate') setCertScanned(true);
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This QR does not match the selected item.',
        [{ text: 'Try Again', style: 'cancel' }]
      );
    }
  };

  // ✅ Decode QR from image URI
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

  // ✅ Pick from Gallery
  const pickFromGallery = async (type) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      await decodeQRFromUri(result.assets[0].uri, type);
    }
  };

  // ✅ Pick from Files/Documents
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

  // ✅ Show action sheet to pick source
  const handleUploadQR = (type) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Gallery', 'Choose from Files'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickFromGallery(type);
          if (buttonIndex === 2) pickFromFiles(type);
        }
      );
    } else {
      Alert.alert(
        'Select Source',
        'Where would you like to pick the QR image from?',
        [
          { text: 'Gallery',   onPress: () => pickFromGallery(type) },
          { text: 'Files',     onPress: () => pickFromFiles(type)   },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleClaim = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setShowSuccess(true);
    } catch {
      Alert.alert('Claim Failed', 'Something went wrong. Please try again.');
    }
  };

  const handleGoToRack = () => {
    setShowSuccess(false);
    router.replace('/(tabs)/(collector)/rack');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111" />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
        <Text style={styles.errorText}>Failed to load item.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Reusable scan step ──
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
                {/* Scan QR */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnThird]}
                  onPress={() => router.push({
                    pathname: `/(tabs)/item/${encodeURIComponent(itemId)}/scanner`,
                    params: { type },
                  })}
                >
                  <Ionicons name="qr-code-outline" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>Scan</Text>
                </TouchableOpacity>

                {/* Upload (Gallery or Files) */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnThird, styles.actionBtnOutline]}
                  onPress={() => handleUploadQR(type)}
                >
                  <Ionicons name="cloud-upload-outline" size={15} color="#111" />
                  <Text style={[styles.actionBtnText, { color: '#111' }]}>Upload</Text>
                </TouchableOpacity>
              </View>

              {/* Upload options hint */}
              <Text style={styles.uploadHint}>
                Upload supports Gallery & Files/Documents
              </Text>

              {__DEV__ && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#7B3FE4' }]}
                  onPress={() => {
                    const cleanId = decodeURIComponent(itemId).replace('#', '');
                    const data = type === 'label'
                      ? `zeal://item/${cleanId}/label`
                      : `zeal://item/${cleanId}/certificate`;
                    validateQR(data, type);
                  }}
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

  return (
    <View style={styles.container}>

      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.pageTitle}>Claim Ownership</Text>

        {/* STEP 1 */}
        <View style={styles.stepSection}>
          <View style={styles.stepRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>NFT Items</Text>
              <View style={styles.itemInfoBox}>
                <Text style={styles.itemInfoLabel}>Items Selected :</Text>
                <Text style={styles.itemInfoName}>
                  {item.name}{' '}
                  <Text style={styles.itemInfoId}>{item.id}</Text>
                </Text>
                <View style={styles.itemInfoMeta}>
                  <Text style={styles.itemInfoCollection}>{item.collection}</Text>
                  <Text style={styles.itemInfoBy}> by </Text>
                  <Image source={{ uri: item.brandLogo }} style={styles.brandLogo} resizeMode="contain" />
                  <Text style={styles.itemInfoBrand}>{item.brand}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.connector} />
        </View>

        {/* STEP 2 */}
        <ScanStep
          number={2}
          title="Scan Product Labels"
          type="label"
          scanned={labelScanned}
          label="Label"
        />
        <View style={styles.connector} />

        {/* STEP 3 */}
        <ScanStep
          number={3}
          title="Scan Physical Certificate"
          type="certificate"
          scanned={certScanned}
          label="Certificate"
        />
        <View style={styles.connector} />

        {/* STEP 4 */}
        <View style={styles.stepSection}>
          <View style={styles.stepRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Claim Your NFT</Text>
              <TouchableOpacity
                style={[styles.actionBtn, !canClaim && styles.actionBtnDisabled]}
                onPress={canClaim ? handleClaim : null}
                activeOpacity={canClaim ? 0.85 : 1}
              >
                <Text style={styles.actionBtnText}>Claim NFT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>NFT Claimed!</Text>
            <Text style={styles.modalSubtitle}>
              You have successfully claimed ownership of{' '}
              <Text style={{ fontWeight: '800' }}>{item.name}</Text> ({item.id}).
            </Text>
            <TouchableOpacity style={styles.modalBtnFull} onPress={handleGoToRack}>
              <Text style={styles.modalBtnText}>Go to Your Rack</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 24,
  },
  loadingText: { fontSize: 14, color: '#888' },
  errorText:   { fontSize: 15, color: '#E74C3C', fontWeight: '600' },
  retryBtn: {
    backgroundColor: '#111', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerBar: {
    height: 44, paddingHorizontal: 16,
    justifyContent: 'center', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingVertical: 8, paddingHorizontal: 4,
  },
  backText:  { fontSize: 17, fontWeight: '600', color: '#111' },
  scroll:    { paddingHorizontal: 24, paddingTop: 24 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 32 },

  stepSection: { marginBottom: 0 },
  stepRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  stepCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#111', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  stepCircleDone: { backgroundColor: '#27AE60' },
  stepNumber:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepContent:    { flex: 1, paddingBottom: 16, gap: 10 },
  stepTitle:      { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 8 },

  itemInfoBox:        { gap: 4 },
  itemInfoLabel:      { fontSize: 13, fontStyle: 'italic', color: '#888' },
  itemInfoName:       { fontSize: 15, fontWeight: '700', color: '#111' },
  itemInfoId:         { fontWeight: '500', color: '#888' },
  itemInfoMeta: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, flexWrap: 'wrap',
  },
  itemInfoCollection: { fontSize: 13, color: '#555' },
  itemInfoBy:         { fontSize: 13, color: '#aaa' },
  brandLogo:          { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f96a1b' },
  itemInfoBrand:      { fontSize: 13, color: '#555', fontWeight: '600' },

  btnRow:            { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: '#111', borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  actionBtnThird:   { flex: 1 },
  actionBtnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd' },
  actionBtnDisabled: { backgroundColor: '#aaa' },
  actionBtnText:    { color: '#fff', fontSize: 13, fontWeight: '700' },

  uploadHint: { fontSize: 11, color: '#aaa', marginTop: -4 },

  scannedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  scannedText: { fontSize: 13, fontWeight: '600' },
  connector: {
    width: 2, height: 20, backgroundColor: '#ddd',
    marginLeft: 18, marginVertical: 4,
  },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center', gap: 12,
  },
  modalIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#27AE60', alignItems: 'center',
    justifyContent: 'center', marginBottom: 4,
  },
  modalTitle:    { fontSize: 22, fontWeight: '900', color: '#111' },
  modalSubtitle: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  modalBtnFull: {
    width: '100%', backgroundColor: '#111', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  modalBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
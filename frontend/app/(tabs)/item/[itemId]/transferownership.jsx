// app/(tabs)/item/[itemId]/transferownership.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';
import {
  getItemById,
  getAllItems,
  getTransferRequests,
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
} from '../../store/transferStore';
import { getCurrentUser } from '../../store/userStore';

const PolDot = ({ size = 16 }) => (
  <View style={[styles.polDot, { width: size, height: size, borderRadius: size / 2 }]} />
);

const ItemMiniCard = ({ item }) => (
  <View style={styles.itemCard}>
    <Image source={{ uri: item.image }} style={styles.itemCardImage} resizeMode="cover" />
    <View style={styles.itemCardOverlay} />
    <View style={styles.itemCardTop}>
      <View style={styles.brandRow}>
        <Image source={{ uri: item.brandLogo }} style={styles.brandLogo} resizeMode="contain" />
        <Text style={styles.brandName}>{item.brand}</Text>
      </View>
      <View style={[styles.tagBadge, { backgroundColor: item.tagColor }]}>
        <Text style={styles.tagText}>{item.tag}</Text>
      </View>
    </View>
    <View style={styles.itemCardBottom}>
      <Text style={styles.itemIdText}>{item.id}</Text>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
      <View style={styles.priceBox}>
        <Text style={styles.priceLabel}>Value</Text>
        <View style={styles.priceRow}>
          <PolDot size={14} />
          <Text style={styles.priceMain}> {item.price}</Text>
          <Text style={styles.priceUsd}> {item.usd}</Text>
        </View>
      </View>
    </View>
  </View>
);

export default function TransferOwnershipPage() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams();
  const currentUser = getCurrentUser();
  const currentItem = getItemById(decodeURIComponent(itemId)) ?? Object.values(getAllItems())[0];

  const tabs = ['Request List', 'Receive', 'Send'];
  const [activeTab,   setActiveTab]   = useState('Request List');
  const [requests,    setRequests]    = useState([]);
  const [showApprove, setShowApprove] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  const [nftScanned,     setNftScanned]     = useState(false);
  const [labelScanned,   setLabelScanned]   = useState(false);
  const [certScanned,    setCertScanned]    = useState(false);
  const [receiveSuccess, setReceiveSuccess] = useState(false);

  const canReceive = nftScanned && labelScanned && certScanned;

  useFocusEffect(
    useCallback(() => {
      setRequests(getTransferRequests(currentUser));
    }, [currentUser])
  );

  useEffect(() => {
    if (activeTab === 'Request List') {
      setRequests(getTransferRequests(currentUser));
    }
  }, [activeTab]);

  const handleApprove = (req) => { setSelectedReq(req); setShowApprove(true); };

  const handleConfirmApprove = () => {
    approveTransferRequest(selectedReq.id);
    setRequests(getTransferRequests(currentUser));
    setShowApprove(false);
    setShowSuccess(true);
  };

  const handleReject = (reqId) => {
    Alert.alert(
      'Reject Transfer',
      'Are you sure you want to reject this transfer request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            rejectTransferRequest(reqId);
            setRequests(getTransferRequests(currentUser));
          },
        },
      ]
    );
  };

  const handleDone = () => {
    setShowSuccess(false);
    setReceiveSuccess(false);
    router.replace('/(tabs)/(collector)/rack');
  };

  const approveItem = selectedReq
    ? getItemById(selectedReq.itemId) ?? currentItem
    : currentItem;

  const validateReceiveQR = (data, type) => {
    const allItems = Object.values(getAllItems());
    const key =
      type === 'nft'         ? 'nftQR'        :
      type === 'label'       ? 'labelQR'      :
                               'certificateQR';
    const match = allItems.find((i) => i[key] === data);
    if (match) {
      if (type === 'nft')         setNftScanned(true);
      if (type === 'label')       setLabelScanned(true);
      if (type === 'certificate') setCertScanned(true);
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This QR does not match any item in the system.',
        [{ text: 'Try Again', style: 'cancel' }]
      );
    }
  };

  const decodeQRFromUri = async (uri, type) => {
    try {
      const decoded = await Camera.scanFromURLAsync(uri);
      if (!decoded || decoded.length === 0) {
        Alert.alert('No QR Found', 'Could not detect a QR code. Try a clearer image.');
        return;
      }
      validateReceiveQR(decoded[0].data, type);
    } catch {
      Alert.alert('Error', 'Failed to read the image. Please try again.');
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
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      await decodeQRFromUri(result.assets[0].uri, type);
    }
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
        'Where would you like to pick the QR from?',
        [
          { text: 'Gallery', onPress: () => pickFromGallery(type) },
          { text: 'Files',   onPress: () => pickFromFiles(type)   },
          { text: 'Cancel',  style: 'cancel' },
        ]
      );
    }
  };

  const simulateScan = (type) => {
    const cleanId = currentItem.id.replace('#', '');
    const data =
      type === 'nft'         ? `zeal://item/${cleanId}/transfer`   :
      type === 'label'       ? `zeal://item/${cleanId}/label`       :
                               `zeal://item/${cleanId}/certificate`;
    validateReceiveQR(data, type);
  };

  const handleReceive = async () => {
    await new Promise((r) => setTimeout(r, 800));
    createTransferRequest({
      itemId:   currentItem.id,
      fromUser: currentItem.owner,
      toUser:   currentUser,
    });
    setReceiveSuccess(true);
  };

  const ReceiveStep = ({ number, title, type, scanned, label }) => (
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
                  style={[styles.actionBtn, styles.actionBtnThird]}
                  onPress={() => router.push({
                    pathname: `/(tabs)/item/${encodeURIComponent(currentItem.id)}/scanner`,
                    params: { type },
                  })}
                >
                  <Ionicons name="qr-code-outline" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnThird, styles.actionBtnOutline]}
                  onPress={() => handleUploadQR(type)}
                >
                  <Ionicons name="cloud-upload-outline" size={15} color="#111" />
                  <Text style={[styles.actionBtnText, { color: '#111' }]}>Upload</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.uploadHint}>
                Upload supports Gallery & Files/Documents
              </Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Transfer Ownership</Text>

        {__DEV__ && (
          <View style={styles.devInfo}>
            <Ionicons name="person-circle-outline" size={14} color="#7B3FE4" />
            <Text style={styles.devInfoText}>Logged in as: @{currentUser}</Text>
          </View>
        )}

        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── REQUEST LIST ── */}
        {activeTab === 'Request List' && (
          <View style={styles.tabContent}>
            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="swap-horizontal-outline" size={40} color="#ddd" />
                <Text style={styles.emptyText}>No transfer requests</Text>
                <Text style={styles.emptySubtext}>
                  When someone requests to receive your item,{'\n'}it will appear here.
                </Text>
              </View>
            ) : (
              requests.map((req) => {
                const reqItem = getItemById(req.itemId) ?? currentItem;
                return (
                  <View key={req.id} style={styles.requestCard}>
                    <ItemMiniCard item={reqItem} />
                    <View style={styles.requestInfo}>
                      <View style={styles.requestInfoRow}>
                        <Text style={styles.requestInfoLabel}>Requested by</Text>
                        <Text style={styles.requestInfoValue}>@{req.toUser}</Text>
                      </View>
                      <View style={styles.requestInfoRow}>
                        <Text style={styles.requestInfoLabel}>Date</Text>
                        <Text style={styles.requestInfoValue}>{req.dateRequested}</Text>
                      </View>
                      <View style={styles.requestInfoRow}>
                        <Text style={styles.requestInfoLabel}>Time</Text>
                        <Text style={styles.requestInfoValue}>{req.timeRequested}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(req)}
                      >
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleReject(req.id)}
                      >
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── RECEIVE ── */}
        {activeTab === 'Receive' && (
          <View style={styles.tabContent}>
            <Text style={styles.pageSubTitle}>Receive Ownership</Text>
            <ReceiveStep number={1} title="NFT Items"                 type="nft"         scanned={nftScanned}   label="NFT"         />
            <View style={styles.connector} />
            <ReceiveStep number={2} title="Scan Product Labels"       type="label"       scanned={labelScanned} label="Label"       />
            <View style={styles.connector} />
            <ReceiveStep number={3} title="Scan Physical Certificate" type="certificate" scanned={certScanned}  label="Certificate" />
            <View style={styles.connector} />
            <View style={styles.stepSection}>
              <View style={styles.stepRow}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Request Your Ownership</Text>
                  <TouchableOpacity
                    style={[styles.actionBtn, !canReceive && styles.actionBtnDisabled]}
                    onPress={canReceive ? handleReceive : null}
                    activeOpacity={canReceive ? 0.85 : 1}
                  >
                    <Text style={styles.actionBtnText}>Request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── SEND ── */}
        {activeTab === 'Send' && (
          <View style={styles.tabContent}>
            <Text style={styles.pageSubTitle}>Send Ownership</Text>

            {/* ✅ Instructions only — no QR shown */}
            <View style={styles.instructionCard}>
              {[
                {
                  icon: 'checkmark-circle-outline',
                  color: '#27AE60',
                  title: 'Check item condition',
                  desc: 'Make sure you still have the product and physical certificate in good condition.',
                },
                {
                  icon: 'qr-code-outline',
                  color: '#2980B9',
                  title: 'Share your NFT QR',
                  desc: 'Go to your item detail page (Claimed status) to find and share your NFT QR code with the receiver.',
                },
                {
                  icon: 'pricetag-outline',
                  color: '#E67E22',
                  title: 'Product label scan',
                  desc: 'Let the receiver scan the product label QR code on the physical item.',
                },
                {
                  icon: 'document-text-outline',
                  color: '#8E44AD',
                  title: 'Certificate scan',
                  desc: 'Let the receiver scan the physical certificate QR code.',
                },
                {
                  icon: 'shield-checkmark-outline',
                  color: '#27AE60',
                  title: 'Approve the request',
                  desc: "Go to Request List tab and approve the receiver's transfer request.",
                },
              ].map((step, index) => (
                <View key={index} style={styles.instructionStep}>
                  <View style={[styles.instructionIconBox, { backgroundColor: step.color + '18' }]}>
                    <Ionicons name={step.icon} size={22} color={step.color} />
                  </View>
                  <View style={styles.instructionText}>
                    <View style={styles.instructionTitleRow}>
                      <View style={styles.instructionNum}>
                        <Text style={styles.instructionNumText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.instructionTitle}>{step.title}</Text>
                    </View>
                    <Text style={styles.instructionDesc}>{step.desc}</Text>
                  </View>
                  {index < 4 && <View style={styles.instructionDivider} />}
                </View>
              ))}
            </View>

            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={16} color="#2980B9" />
              <Text style={styles.infoNoteText}>
                After approval, the NFT transfers on blockchain and item leaves your rack.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Approve Modal ── */}
      <Modal visible={showApprove} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, { backgroundColor: '#2980B9' }]}>
              <Ionicons name="swap-horizontal" size={32} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Confirm Transfer</Text>
            <Text style={styles.modalSubtitle}>
              Transfer{' '}
              <Text style={{ fontWeight: '800' }}>{approveItem?.name}</Text>{' '}
              ({approveItem?.id}) to{' '}
              <Text style={{ fontWeight: '800' }}>@{selectedReq?.toUser}</Text>?
            </Text>
            <Text style={styles.modalWarning}>
              This cannot be undone. The NFT will transfer on the blockchain.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={() => setShowApprove(false)}
              >
                <Text style={styles.modalBtnOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#2980B9' }]}
                onPress={handleConfirmApprove}
              >
                <Text style={styles.modalBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Approve Success Modal ── */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, { backgroundColor: '#27AE60' }]}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Transfer Complete!</Text>
            <Text style={styles.modalSubtitle}>
              <Text style={{ fontWeight: '800' }}>{approveItem?.name}</Text>{' '}
              has been transferred to{' '}
              <Text style={{ fontWeight: '800' }}>@{selectedReq?.toUser}</Text>.
              {'\n'}The item has been removed from your rack.
            </Text>
            <TouchableOpacity style={styles.modalBtnFull} onPress={handleDone}>
              <Text style={styles.modalBtnText}>Back to Rack</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Receive Success Modal ── */}
      <Modal visible={receiveSuccess} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, { backgroundColor: '#27AE60' }]}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Request Sent!</Text>
            <Text style={styles.modalSubtitle}>
              Your ownership request has been sent to the sender.
              The item will appear in your rack once the sender approves.
            </Text>
            <TouchableOpacity style={styles.modalBtnFull} onPress={handleDone}>
              <Text style={styles.modalBtnText}>Go to Your Rack</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    height: 44, paddingHorizontal: 16,
    justifyContent: 'center', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingVertical: 8, paddingHorizontal: 4,
  },
  backText:     { fontSize: 17, fontWeight: '600', color: '#111' },
  scroll:       { paddingHorizontal: 20, paddingTop: 20 },
  pageTitle:    { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 8 },
  pageSubTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 20 },

  devInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F3EEFF', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 16, alignSelf: 'flex-start',
  },
  devInfoText: { fontSize: 12, color: '#7B3FE4', fontWeight: '600' },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  tabBtnActive:  { backgroundColor: '#111', borderColor: '#111' },
  tabText:       { fontSize: 12, color: '#555', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  tabContent:    { gap: 0 },

  requestCard: {
    flexDirection: 'row', backgroundColor: '#f9f9f9',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 16,
  },
  itemCard:        { width: 155, height: 230, position: 'relative', backgroundColor: '#111' },
  itemCardImage:   { width: '100%', height: '100%', position: 'absolute' },
  itemCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  itemCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 10,
  },
  brandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  brandLogo:      { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff' },
  brandName:      { color: '#fff', fontSize: 9, fontWeight: '700' },
  tagBadge:       { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagText:        { color: '#fff', fontSize: 9, fontWeight: '800' },
  itemCardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, gap: 1 },
  itemIdText:     { fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  itemName:       { fontSize: 14, fontWeight: '900', color: '#fff' },
  itemSubtitle:   { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  priceBox:       { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 7, gap: 2 },
  priceLabel:     { fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' },
  priceRow:       { flexDirection: 'row', alignItems: 'center' },
  priceMain:      { fontSize: 11, fontWeight: '800', color: '#fff' },
  priceUsd:       { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' },
  polDot:         { backgroundColor: '#7B3FE4' },

  requestInfo:      { flex: 1, padding: 14, gap: 8, justifyContent: 'center' },
  requestInfoRow:   { gap: 2 },
  requestInfoLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  requestInfoValue: { fontSize: 13, fontWeight: '700', color: '#111' },
  approveBtn: {
    backgroundColor: '#111', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', marginTop: 4,
  },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  rejectBtn: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#E74C3C',
    paddingVertical: 10, alignItems: 'center',
  },
  rejectBtnText: { color: '#E74C3C', fontSize: 13, fontWeight: '700' },

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

  btnRow:             { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: '#111', borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  actionBtnThird:    { flex: 1 },
  actionBtnOutline:  { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd' },
  actionBtnDisabled: { backgroundColor: '#aaa' },
  actionBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  uploadHint:        { fontSize: 11, color: '#aaa', marginTop: -4 },

  scannedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  scannedText: { fontSize: 13, fontWeight: '600' },

  instructionCard: {
    backgroundColor: '#f9f9f9', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 16,
  },
  instructionStep:     { position: 'relative' },
  instructionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  instructionNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
  },
  instructionNumText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  instructionIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  instructionText:    { flex: 1 },
  instructionTitle:   { fontSize: 14, fontWeight: '700', color: '#111' },
  instructionDesc:    { fontSize: 13, color: '#666', lineHeight: 20 },
  instructionDivider: { height: 1, backgroundColor: '#ebebeb', marginVertical: 14 },

  infoNote: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#EBF5FB', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#AED6F1',
  },
  infoNoteText: { flex: 1, fontSize: 12, color: '#2980B9', lineHeight: 18 },

  emptyState:   { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyText:    { fontSize: 15, color: '#aaa', fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#ccc', textAlign: 'center', lineHeight: 20 },

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
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  modalTitle:    { fontSize: 22, fontWeight: '900', color: '#111' },
  modalSubtitle: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  modalWarning: {
    fontSize: 12, color: '#E74C3C', textAlign: 'center',
    lineHeight: 18, backgroundColor: '#FEF2F2',
    padding: 10, borderRadius: 10, width: '100%',
  },
  modalBtnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  modalBtn: {
    flex: 1, backgroundColor: '#111', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  modalBtnFull: {
    width: '100%', backgroundColor: '#111', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  modalBtnOutline:     { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd' },
  modalBtnText:        { color: '#fff', fontSize: 14, fontWeight: '800' },
  modalBtnOutlineText: { color: '#111', fontSize: 14, fontWeight: '800' },
});
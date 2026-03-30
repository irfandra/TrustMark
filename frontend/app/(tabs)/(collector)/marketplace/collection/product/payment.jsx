// app/(tabs)/(collector)/marketplace/collection/product/payment.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PolDot = ({ size = 18 }) => (
  <View style={[styles.polDot, { width: size, height: size, borderRadius: size / 2 }]} />
);

const PROCESSING_FEE = 120100;
const DELIVERY_FEE   = 5000;
const NFT_MINT_FEE   = 2000;

function formatPol(num) { return num.toLocaleString(); }

const PHONE_CODES = [
  { code: '+1',   flag: '🇺🇸', label: 'US' },
  { code: '+44',  flag: '🇬🇧', label: 'UK' },
  { code: '+60',  flag: '🇲🇾', label: 'MY' },
  { code: '+62',  flag: '🇮🇩', label: 'ID' },
  { code: '+65',  flag: '🇸🇬', label: 'SG' },
  { code: '+66',  flag: '🇹🇭', label: 'TH' },
  { code: '+81',  flag: '🇯🇵', label: 'JP' },
  { code: '+82',  flag: '🇰🇷', label: 'KR' },
  { code: '+86',  flag: '🇨🇳', label: 'CN' },
  { code: '+91',  flag: '🇮🇳', label: 'IN' },
  { code: '+33',  flag: '🇫🇷', label: 'FR' },
  { code: '+49',  flag: '🇩🇪', label: 'DE' },
  { code: '+61',  flag: '🇦🇺', label: 'AU' },
  { code: '+971', flag: '🇦🇪', label: 'AE' },
];

const COUNTRIES = [
  'Australia', 'Canada', 'China', 'France', 'Germany',
  'India', 'Indonesia', 'Japan', 'Malaysia', 'Singapore',
  'South Korea', 'Thailand', 'United Arab Emirates',
  'United Kingdom', 'United States',
];

export default function PaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { itemId, edition, total, price, name, image, collection } = params;

  const [fullName,          setFullName]          = useState('');
  const [phone,             setPhone]             = useState('');
  const [selectedCode,      setSelectedCode]      = useState(PHONE_CODES[4]);
  const [showCodePicker,    setShowCodePicker]    = useState(false);
  const [country,           setCountry]           = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [state,             setState]             = useState('');
  const [city,              setCity]              = useState('');
  const [postalCode,        setPostalCode]        = useState('');
  const [address,           setAddress]           = useState('');
  const [confirmed,         setConfirmed]         = useState(false);
  const [modalType,         setModalType]         = useState(null);
  const [errors,            setErrors]            = useState({});

  const priceNum   = parseInt((price ?? '0').replace(/[^\d]/g, ''), 10);
  const totalPrice = priceNum + DELIVERY_FEE + NFT_MINT_FEE;

  // ✅ Real-time form validity check
  const isFormValid =
    fullName.trim() &&
    phone.trim() &&
    country.trim() &&
    state.trim() &&
    city.trim() &&
    postalCode.trim() &&
    address.trim() &&
    confirmed;

  const handleConfirm = () => {
    const newErrors = {};
    if (!fullName.trim())   newErrors.fullName   = 'Required';
    if (!phone.trim())      newErrors.phone      = 'Required';
    if (!country.trim())    newErrors.country    = 'Required';
    if (!state.trim())      newErrors.state      = 'Required';
    if (!city.trim())       newErrors.city       = 'Required';
    if (!postalCode.trim()) newErrors.postalCode = 'Required';
    if (!address.trim())    newErrors.address    = 'Required';
    if (!confirmed)         newErrors.confirmed  = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setModalType('success');
  };

  const handleGoToRack = () => {
    setModalType(null);
    router.dismissAll();
    router.replace('/(tabs)/(collector)/rack');
  };

  const handleGoToMarketplace = () => {
    setModalType(null);
    router.dismissAll();
    router.replace('/(tabs)/(collector)/marketplace');
  };

  const handleRetry = () => setModalType(null);

  const inputStyle = (field) => [
    styles.formInput,
    errors[field] && styles.formInputError,
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* BACK */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Your Order</Text>

        {/* ITEM CARD */}
        <View style={styles.itemCard}>
          <Text style={styles.itemCardLabel}>Items</Text>
          <View style={styles.itemCardRow}>
            <Image source={{ uri: image }} style={styles.itemThumb} resizeMode="cover" />
            <View style={styles.itemCardInfo}>
              <View style={styles.itemNameRow}>
                <Text style={styles.itemName}>{name}</Text>
                <Text style={styles.itemIdBadge}>{itemId}</Text>
              </View>
              <Text style={styles.itemCollection}>{collection}</Text>
              <Text style={styles.itemEdition}>
                Edition {edition} of {total} Items in Collection
              </Text>
            </View>
          </View>
        </View>

        {/* RECIPIENT DETAILS */}
        <Text style={styles.sectionTitle}>Recepient Details</Text>

        {/* Full Name */}
        <View style={styles.formField}>
          <TextInput
            style={inputStyle('fullName')}
            value={fullName}
            onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, fullName: null })); }}
            placeholder="Full Name *"
            placeholderTextColor="#bbb"
          />
          {errors.fullName && <Text style={styles.errorText}>Full name is required</Text>}
        </View>

        {/* Phone — numbers only */}
        <View style={styles.formField}>
          <View style={[styles.phoneRow, errors.phone && styles.phoneRowError]}>
            <TouchableOpacity style={styles.codePickerBtn} onPress={() => setShowCodePicker(true)}>
              <Text style={styles.codePickerText}>{selectedCode.flag} {selectedCode.code}</Text>
              <Ionicons name="chevron-down" size={14} color="#888" />
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={(v) => {
                // ✅ Strip non-numeric characters
                const numericOnly = v.replace(/[^0-9]/g, '');
                setPhone(numericOnly);
                setErrors((e) => ({ ...e, phone: null }));
              }}
              placeholder="Phone Number *"
              placeholderTextColor="#bbb"
              keyboardType="number-pad"
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>Phone number is required</Text>}
        </View>

        {/* LOCATION */}
        <Text style={styles.sectionTitle}>Location</Text>

        {/* Country */}
        <View style={styles.formField}>
          <TouchableOpacity
            style={[styles.dropdownBtn, errors.country && styles.formInputError]}
            onPress={() => { setShowCountryPicker(true); setErrors((e) => ({ ...e, country: null })); }}
          >
            <Text style={[styles.dropdownText, !country && styles.dropdownPlaceholder]}>
              {country || 'Country *'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
          {errors.country && <Text style={styles.errorText}>Country is required</Text>}
        </View>

        {/* State */}
        <View style={styles.formField}>
          <TextInput
            style={inputStyle('state')}
            value={state}
            onChangeText={(v) => { setState(v); setErrors((e) => ({ ...e, state: null })); }}
            placeholder="State / Province *"
            placeholderTextColor="#bbb"
          />
          {errors.state && <Text style={styles.errorText}>State is required</Text>}
        </View>

        {/* City */}
        <View style={styles.formField}>
          <TextInput
            style={inputStyle('city')}
            value={city}
            onChangeText={(v) => { setCity(v); setErrors((e) => ({ ...e, city: null })); }}
            placeholder="City *"
            placeholderTextColor="#bbb"
          />
          {errors.city && <Text style={styles.errorText}>City is required</Text>}
        </View>

        {/* Postal Code */}
        <View style={styles.formField}>
          <TextInput
            style={inputStyle('postalCode')}
            value={postalCode}
            onChangeText={(v) => {
              const numericOnly = v.replace(/[^0-9]/g, '');
              setPostalCode(numericOnly);
              setErrors((e) => ({ ...e, postalCode: null }));
            }}
            placeholder="Postal Code *"
            placeholderTextColor="#bbb"
            keyboardType="number-pad"
          />
          {errors.postalCode && <Text style={styles.errorText}>Postal code is required</Text>}
        </View>

        {/* Complete Address */}
        <View style={styles.formField}>
          <TextInput
            style={[inputStyle('address'), styles.formInputMulti]}
            value={address}
            onChangeText={(v) => { setAddress(v); setErrors((e) => ({ ...e, address: null })); }}
            placeholder="Complete Address *"
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={4}
          />
          {errors.address && <Text style={styles.errorText}>Address is required</Text>}
        </View>

        {/* CONFIRMATION CHECKBOX */}
        <TouchableOpacity
          style={styles.confirmRow}
          onPress={() => { setConfirmed(!confirmed); setErrors((e) => ({ ...e, confirmed: null })); }}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxActive, errors.confirmed && styles.checkboxError]}>
            {confirmed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.confirmText}>
              Confirming the address is correct, Wrong address will result in item lost with your own guarantee
            </Text>
            {errors.confirmed && <Text style={styles.errorText}>Please confirm your address</Text>}
          </View>
        </TouchableOpacity>

        {/* PRICE SUMMARY */}
        <View style={styles.priceCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <View style={styles.priceValueRow}>
              <PolDot size={18} />
              <Text style={styles.totalValue}> POL  {formatPol(totalPrice)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <PriceRow label="Processing Fee" value={formatPol(PROCESSING_FEE)} />
          <PriceRow label="Delivery Fee"   value={formatPol(DELIVERY_FEE)} />
          <PriceRow label="NFT Mint Fee"   value={formatPol(NFT_MINT_FEE)} />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ✅ BOTTOM BAR — active only when all fields filled */}
      <TouchableOpacity
        style={[styles.bottomBar, !isFormValid && styles.bottomBarDisabled]}
        onPress={isFormValid ? handleConfirm : null}
        activeOpacity={isFormValid ? 0.85 : 1}
      >
        <Text style={styles.bottomBarTitle}>Confirm Payment</Text>
        <View style={styles.bottomBarRight}>
          <PolDot size={22} />
          <Text style={styles.bottomBarPolText}> POL  {formatPol(totalPrice)}</Text>
        </View>
      </TouchableOpacity>

      {/* ── PHONE CODE PICKER ── */}
      <Modal visible={showCodePicker} transparent animationType="slide" onRequestClose={() => setShowCodePicker(false)}>
        <View style={styles.pickerBackdrop}>
          <TouchableOpacity style={styles.pickerDismiss} onPress={() => setShowCodePicker(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Phone Code</Text>
            <ScrollView>
              {PHONE_CODES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.pickerItem, selectedCode.code === item.code && styles.pickerItemActive]}
                  onPress={() => { setSelectedCode(item); setShowCodePicker(false); }}
                >
                  <Text style={styles.pickerItemText}>{item.flag}  {item.label}  {item.code}</Text>
                  {selectedCode.code === item.code && <Ionicons name="checkmark" size={18} color="#111" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── COUNTRY PICKER ── */}
      <Modal visible={showCountryPicker} transparent animationType="slide" onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.pickerBackdrop}>
          <TouchableOpacity style={styles.pickerDismiss} onPress={() => setShowCountryPicker(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Select Country</Text>
            <ScrollView>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pickerItem, country === c && styles.pickerItemActive]}
                  onPress={() => { setCountry(c); setShowCountryPicker(false); }}
                >
                  <Text style={styles.pickerItemText}>{c}</Text>
                  {country === c && <Ionicons name="checkmark" size={18} color="#111" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── SUCCESS MODAL ── */}
      <Modal visible={modalType === 'success'} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, { backgroundColor: '#22C55E' }]}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Payment Successful!</Text>
            <Text style={styles.modalSubtitle}>
              Your order for <Text style={styles.modalBold}>{name}</Text> ({itemId}) has been confirmed.
            </Text>
            <View style={styles.modalSummary}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Item</Text>
                <Text style={styles.modalSummaryValue} numberOfLines={1}>{name}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Edition</Text>
                <Text style={styles.modalSummaryValue}>{edition} of {total}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Total Paid</Text>
                <View style={styles.modalPriceRow}>
                  <PolDot size={14} />
                  <Text style={styles.modalSummaryValue}> POL {formatPol(totalPrice)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnOutline]} onPress={handleGoToMarketplace}>
                <Text style={styles.modalBtnOutlineText}>Marketplace</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={handleGoToRack}>
                <Text style={styles.modalBtnText}>Your Rack</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── FAILED MODAL ── */}
      <Modal visible={modalType === 'failed'} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, { backgroundColor: '#E74C3C' }]}>
              <Ionicons name="close" size={36} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Payment Failed</Text>
            <Text style={styles.modalSubtitle}>
              Something went wrong while processing your payment. Please check your wallet balance and try again.
            </Text>
            <View style={styles.modalSummary}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Item</Text>
                <Text style={styles.modalSummaryValue} numberOfLines={1}>{name}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Amount</Text>
                <View style={styles.modalPriceRow}>
                  <PolDot size={14} />
                  <Text style={styles.modalSummaryValue}> POL {formatPol(totalPrice)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnOutline]} onPress={handleGoToMarketplace}>
                <Text style={styles.modalBtnOutlineText}>Marketplace</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E74C3C' }]} onPress={handleRetry}>
                <Text style={styles.modalBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const PriceRow = ({ label, value }) => (
  <View style={styles.priceRow}>
    <Text style={styles.priceRowLabel}>{label}</Text>
    <View style={styles.priceValueRow}>
      <PolDot size={14} />
      <Text style={styles.priceRowValue}> POL  {value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { paddingBottom: 0 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8, gap: 4,
  },
  backText: { fontSize: 16, fontWeight: '600', color: '#111' },
  pageTitle: {
    fontSize: 26, fontWeight: '900', color: '#111',
    paddingHorizontal: 16, marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    padding: 14, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  itemCardLabel: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 10 },
  itemCardRow: { flexDirection: 'row', gap: 12 },
  itemThumb: { width: 72, height: 72, borderRadius: 10 },
  itemCardInfo: { flex: 1, gap: 3 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  itemName: { fontSize: 15, fontWeight: '800', color: '#111' },
  itemIdBadge: { fontSize: 12, fontWeight: '600', color: '#888' },
  itemCollection: { fontSize: 12, color: '#555', fontWeight: '500' },
  itemEdition: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#111',
    paddingHorizontal: 16, marginBottom: 10,
  },
  formField: { paddingHorizontal: 16, marginBottom: 12 },
  formInput: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#e8e8e8', paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: '#111',
  },
  formInputError: { borderColor: '#E74C3C' },
  formInputMulti: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
  errorText: { fontSize: 11, color: '#E74C3C', marginTop: 4, marginLeft: 4 },
  phoneRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e8e8e8', overflow: 'hidden',
  },
  phoneRowError: { borderColor: '#E74C3C' },
  codePickerBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 14, gap: 6, borderRightWidth: 1, borderRightColor: '#e8e8e8',
  },
  codePickerText: { fontSize: 14, color: '#111', fontWeight: '600' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, color: '#111' },
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#e8e8e8', paddingHorizontal: 16, paddingVertical: 14,
  },
  dropdownText: { fontSize: 14, color: '#111' },
  dropdownPlaceholder: { color: '#bbb' },
  confirmRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, gap: 12, marginTop: 4, marginBottom: 20,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    borderColor: '#ddd', backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxActive: { backgroundColor: '#111', borderColor: '#111' },
  checkboxError: { borderColor: '#E74C3C' },
  confirmText: { fontSize: 12, color: '#555', lineHeight: 18 },
  priceCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#111' },
  totalValue: { fontSize: 15, fontWeight: '800', color: '#111' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRowLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  priceValueRow: { flexDirection: 'row', alignItems: 'center' },
  priceRowValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  polDot: { backgroundColor: '#7B3FE4' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#111', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    paddingTop: 14, paddingBottom: 34,
  },
  // ✅ Added disabled state
  bottomBarDisabled: { backgroundColor: '#555' },
  bottomBarTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bottomBarRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomBarPolText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerDismiss: { flex: 1 },
  pickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 40, maxHeight: '60%',
  },
  pickerHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd',
    alignSelf: 'center', marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 16, fontWeight: '800', color: '#111',
    paddingHorizontal: 20, marginBottom: 8,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  pickerItemActive: { backgroundColor: '#f9f9f9' },
  pickerItemText: { fontSize: 15, color: '#111' },
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
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111' },
  modalSubtitle: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  modalBold: { fontWeight: '700', color: '#111' },
  modalSummary: {
    width: '100%', backgroundColor: '#f7f7f7', borderRadius: 14,
    padding: 14, gap: 10, marginTop: 4,
  },
  modalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalSummaryLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  modalSummaryValue: { fontSize: 13, fontWeight: '700', color: '#111' },
  modalPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalBtnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  modalBtn: {
    flex: 1, backgroundColor: '#111', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  modalBtnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd' },
  modalBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  modalBtnOutlineText: { color: '#111', fontSize: 14, fontWeight: '800' },
});
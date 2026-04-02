import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList, ScrollView, View, Text, StyleSheet, TouchableOpacity,
  TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collectionService } from '@/services/collectionService';
import WizardStepper from '@/components/shared/wizard-stepper';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const palette = {
  background: '#F6F1E8',
  surface: '#FFFFFF',
  text: '#1E2C3A',
  muted: '#6B7280',
  border: '#E5DED0',
  accent: '#1E2C3A',
  accentSoft: '#D8CCB6',
  field: '#FCFAF5',
  danger: '#B91C1C',
};

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);
const parseNumber = (value) => {
  const parsed = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseSetupData = (rawSetup) => {
  if (!rawSetup) return null;
  try {
    const parsed = JSON.parse(rawSetup);
    if (!parsed?.collectionName) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
};

const parseVariationsDraft = (rawVariations) => {
  if (!rawVariations) return [];
  try {
    const parsed = JSON.parse(rawVariations);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((variation) => ({
        id: String(variation?.id || Date.now()),
        name: String(variation?.name || '').trim(),
        price: String(variation?.price || '').trim(),
        quantity: Number(variation?.quantity || 0),
        description: String(variation?.description || '').trim(),
      }))
      .filter((variation) => variation.name);
  } catch (_error) {
    return [];
  }
};

// ── Main Screen ────────────────────────────────────────────
export default function NewCollectionContinue() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setupData = parseSetupData(parseParam(params.setupData));
  const initialVariations = parseVariationsDraft(parseParam(params.variationsDraft));

  const [variations, setVariations] = useState(initialVariations);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalVariationQuantity = variations.reduce((sum, variation) => sum + Number(variation.quantity || 0), 0);

  const handleBackToSetup = () => {
    const serializedSetupData = JSON.stringify({
      collectionName: setupData?.collectionName || '',
      category: setupData?.category || '',
      about: setupData?.about || '',
      imageUrl: setupData?.imageUrl || '',
    });

    router.replace({
      pathname: '/(tabs)/(creator)/new-collection',
      params: {
        setupData: serializedSetupData,
        variationsDraft: JSON.stringify(variations),
      },
    });
  };

  const handleAddVariation = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', quantity: '', description: '' });
    setShowAddModal(true);
  };

  const handleEditVariation = (variation) => {
    setEditingId(variation.id);
    setFormData({
      name: variation.name,
      price: variation.price,
      quantity: variation.quantity.toString(),
      description: variation.description,
    });
    setShowAddModal(true);
  };

  const handleSaveVariation = () => {
    const nextErrors = {};
    const safeName = formData.name.trim();
    const safePrice = parseNumber(formData.price);
    const safeQuantity = parseNumber(formData.quantity);

    if (!safeName) {
      nextErrors.name = 'Variation name is required';
    }
    if (!Number.isFinite(safePrice) || safePrice <= 0) {
      nextErrors.price = 'Price must be greater than 0';
    }
    if (!Number.isInteger(safeQuantity) || safeQuantity <= 0) {
      nextErrors.quantity = 'Quantity must be a positive whole number';
    }

    const duplicateName = variations.some(
      (variation) =>
        variation.id !== editingId &&
        variation.name.trim().toLowerCase() === safeName.toLowerCase()
    );

    if (duplicateName) {
      nextErrors.name = 'Variation name must be unique';
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const normalizedVariation = {
      name: safeName,
      price: String(safePrice),
      quantity: safeQuantity,
      description: formData.description.trim(),
    };

    if (editingId) {
      setVariations(
        variations.map((v) =>
          v.id === editingId
            ? { ...v, ...normalizedVariation }
            : v
        )
      );
    } else {
      setVariations([
        ...variations,
        {
          id: `${Date.now()}`,
          ...normalizedVariation,
        },
      ]);
    }

    setShowAddModal(false);
    setFormErrors({});
  };

  const handleContinue = async () => {
    if (!setupData) {
      Alert.alert('Missing Setup Data', 'Please complete collection setup first.');
      router.back();
      return;
    }

    if (variations.length === 0) {
      Alert.alert('Validation Error', 'Add at least one variation before continuing.');
      return;
    }

    try {
      setIsSubmitting(true);
      const createdCollection = await collectionService.createCollectionWithVariations({
        collectionName: setupData.collectionName,
        category: setupData.category,
        about: setupData.about,
        imageUrl: setupData.imageUrl,
        totalItems: totalVariationQuantity,
        variations,
      });

      const image = createdCollection.imageUrl || setupData.imageUrl || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800';

      router.replace({
        pathname: '/(tabs)/(creator)/collection-detail',
        params: {
          collectionId: String(createdCollection.id),
          title: createdCollection.collectionName || setupData.collectionName,
          subtitle: createdCollection.season || setupData.category,
          status: 'Draft',
          tag: createdCollection.tag || 'In Stock',
          image: encodeURIComponent(image),
        },
      });
    } catch (error) {
      Alert.alert(
        'Failed To Create Collection',
        error?.message || 'Unable to create collection. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVariation = (id) => {
    setVariations(variations.filter((v) => v.id !== id));
  };

  const ListHeader = () => (
    <>
      <TouchableOpacity style={s.backRow} onPress={handleBackToSetup}>
        <Ionicons name="chevron-back" size={18} color={palette.text} />
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>

      <View style={s.headerCard}>
        <Text style={s.logo}>TRUSTMARK</Text>

        <WizardStepper
          palette={palette}
          steps={[
            { key: 'setup-collection', number: 1, label: 'Collections', active: false, onPress: handleBackToSetup },
            { key: 'setup-variation', number: 2, label: 'Variations', active: true },
          ]}
        />

        <Text style={s.pageTitle}>Setup Variations</Text>
        <Text style={s.pageSubtitle}>Add every variation and quantity to auto-calculate total items.</Text>
      </View>

      <View style={s.summaryCard}>
        <View style={s.summaryRow}>
          <View style={s.summaryInfoWrap}>
            <Text style={s.summaryName} numberOfLines={1}>
              {setupData?.collectionName || 'Collection'}
            </Text>
            <Text style={s.summaryCategory} numberOfLines={1}>
              {setupData?.category || '-'}
            </Text>
            <Text style={s.summaryItems}>
              {totalVariationQuantity.toLocaleString('en-US')} Items (Auto calculated)
            </Text>
          </View>
          <TouchableOpacity
            style={s.newVariationButton}
            onPress={handleAddVariation}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.newVariationText}>New Variation</Text>
          </TouchableOpacity>
        </View>

        <View style={s.columnLabels}>
          <Text style={[s.columnLabel, { flex: 1, marginLeft: 8 }]}>Items</Text>
          <Text style={[s.columnLabel, { flex: 1 }]}>Price</Text>
          <Text style={[s.columnLabel, { flex: 1 }]}>Qty</Text>
          <View style={s.actionHeaderSpacer} />
        </View>

        {variations.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>No variation added yet. Tap New Variation.</Text>
          </View>
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.root}>
      <View style={s.contentRoot}>
        <FlatList
          data={variations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => {
            const numericPrice = Number(item.price || 0);
            const numericQty = Number(item.quantity || 0);

            return (
              <View style={s.variationRow}>
                <Text style={s.variationName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.variationPrice} numberOfLines={1}>
                  USD {numericPrice.toLocaleString('en-US')}
                </Text>
                <Text style={s.variationQty} numberOfLines={1}>
                  {numericQty.toLocaleString('en-US')} Items
                </Text>

                <TouchableOpacity
                  style={s.editButton}
                  onPress={() => handleEditVariation(item)}
                >
                  <Ionicons name="create-outline" size={18} color="#111" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.deleteButton}
                  onPress={() => handleDeleteVariation(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListFooterComponent={<View style={{ height: 36 }} />}
        />

        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.completeButton, (variations.length === 0 || isSubmitting) && s.completeButtonDisabled]}
            onPress={handleContinue}
            disabled={variations.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.completeButtonText}>Complete</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Add/Edit Variation Modal ── */}
        <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
          <SafeAreaView style={s.modalSafe}>
            <View style={s.modalContainer}>
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Text style={s.modalCloseText}>Close</Text>
                </TouchableOpacity>
                <Text style={s.modalTitle}>{editingId ? 'Edit Variation' : 'New Variation'}</Text>
                <View style={{ width: 60 }} />
              </View>

              <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
                <View style={s.formGroup}>
                  <Text style={s.formLabel}>Variation Name</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder="e.g., Hermès Birkin - Size M"
                    placeholderTextColor="#aaa"
                    value={formData.name}
                    onChangeText={(text) => {
                      setFormData({ ...formData, name: text });
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                  />
                  {!!formErrors.name && <Text style={s.errorText}>{formErrors.name}</Text>}
                </View>

                <View style={s.formGroup}>
                  <Text style={s.formLabel}>Description</Text>
                  <TextInput
                    style={[s.formInput, { minHeight: 80 }]}
                    placeholder="Describe this variation..."
                    placeholderTextColor="#aaa"
                    multiline
                    textAlignVertical="top"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                  />
                </View>

                <View style={s.formRow}>
                  <View style={[s.formGroup, { flex: 1 }]}>
                    <Text style={s.formLabel}>Price (USD)</Text>
                    <TextInput
                      style={s.formInput}
                      placeholder="0"
                      placeholderTextColor="#aaa"
                      keyboardType="decimal-pad"
                      value={formData.price}
                      onChangeText={(text) => {
                        const normalized = text.replace(/[^0-9.]/g, '');
                        setFormData({ ...formData, price: normalized });
                        setFormErrors((prev) => ({ ...prev, price: undefined }));
                      }}
                    />
                    {!!formErrors.price && <Text style={s.errorText}>{formErrors.price}</Text>}
                  </View>
                  <View style={[s.formGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={s.formLabel}>Quantity</Text>
                    <TextInput
                      style={s.formInput}
                      placeholder="0"
                      placeholderTextColor="#aaa"
                      keyboardType="number-pad"
                      value={formData.quantity}
                      onChangeText={(text) => {
                        const normalized = text.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, quantity: normalized });
                        setFormErrors((prev) => ({ ...prev, quantity: undefined }));
                      }}
                    />
                    {!!formErrors.quantity && <Text style={s.errorText}>{formErrors.quantity}</Text>}
                  </View>
                </View>
              </ScrollView>

              <View style={s.modalFooter}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={s.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalSaveBtn} onPress={handleSaveVariation}>
                  <Text style={s.modalSaveBtnText}>Save Variation</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  contentRoot: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? 40 : 22,
    paddingTop: isTablet ? 56 : 42,
    paddingBottom: 56,
  },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EFE6D9',
  },
  backText: {
    fontSize: 15,
    color: palette.text,
    marginLeft: 4,
    fontWeight: '600',
  },

  headerCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: isTablet ? 24 : 18,
    paddingVertical: isTablet ? 24 : 18,
    marginBottom: 16,
  },

  logo: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    color: palette.text,
    marginBottom: 16,
  },

  pageTitle: {
    fontSize: isTablet ? 32 : 26,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: palette.muted,
    lineHeight: 20,
  },

  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: isTablet ? 24 : 18,
    paddingVertical: isTablet ? 20 : 16,
    marginBottom: 14,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryInfoWrap: {
    flex: 1,
    marginRight: 12,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
  },
  summaryCategory: {
    fontSize: 13,
    color: palette.text,
    marginTop: 2,
  },
  summaryItems: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  newVariationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  newVariationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  columnLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  columnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
  },
  actionHeaderSpacer: {
    width: 88,
  },

  emptyWrap: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: palette.field,
  },
  emptyText: {
    fontSize: 13,
    color: palette.muted,
  },

  variationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  variationName: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
    fontWeight: '500',
    paddingRight: 8,
  },
  variationPrice: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
    paddingRight: 8,
  },
  variationQty: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
    paddingRight: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.field,
  },
  separator: {
    height: 10,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  bottomBar: {
    paddingHorizontal: isTablet ? 40 : 22,
    paddingVertical: 16,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  completeButton: {
    backgroundColor: palette.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2C3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  modalSafe: { flex: 1, backgroundColor: palette.background },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: palette.surface },
  modalCloseText: { fontSize: 15, fontWeight: '600', color: palette.text },
  modalTitle: { fontSize: 18, fontWeight: '700', color: palette.text },
  modalContent: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, backgroundColor: palette.surface },
  formGroup: { marginBottom: 18 },
  formLabel: { fontSize: 14, fontWeight: '700', color: palette.text, marginBottom: 8 },
  formInput: { backgroundColor: palette.field, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: palette.text, borderWidth: 1, borderColor: palette.border },
  errorText: { marginTop: 6, fontSize: 12, color: palette.danger },
  formRow: { flexDirection: 'row', gap: 12 },
  modalFooter: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border, gap: 12 },
  modalCancelBtn: { flex: 1, borderWidth: 1.5, borderColor: palette.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFFFFF' },
  modalCancelBtnText: { fontSize: 15, fontWeight: '700', color: palette.accent },
  modalSaveBtn: { flex: 1, backgroundColor: palette.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modalSaveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

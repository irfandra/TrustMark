import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, ScrollView, View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collectionService } from '@/services/collectionService';
import WizardStepper from '@/components/shared/wizard-stepper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createCreatorNewCollectionContinueStyles } from '@/constants/styles/creator-new-collection-continue-styles.js';

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
        imageUrl: String(variation?.imageUrl || '').trim(),
      }))
      .filter((variation) => variation.name);
  } catch (_error) {
    return [];
  }
};

export default function NewCollectionContinue() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setupData = parseSetupData(parseParam(params.setupData));
  const initialVariations = parseVariationsDraft(parseParam(params.variationsDraft));

  const [variations, setVariations] = useState(initialVariations);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '', imageUrl: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState(null);

  const totalVariationQuantity = variations.reduce((sum, variation) => sum + Number(variation.quantity || 0), 0);

  const handleBackToSetup = () => {
    const serializedSetupData = JSON.stringify({
      collectionName: setupData?.collectionName || '',
      category: setupData?.category || '',
      about: setupData?.about || '',
      imageUrl: setupData?.imageUrl || '',
    });

    router.replace({
      pathname: '/(collection)/new-collection',
      params: {
        setupData: serializedSetupData,
        variationsDraft: JSON.stringify(variations),
      },
    });
  };

  const handleAddVariation = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', quantity: '', description: '', imageUrl: '' });
    setShowAddModal(true);
  };

  const handleEditVariation = (variation) => {
    setEditingId(variation.id);
    setFormData({
      name: variation.name,
      price: variation.price,
      quantity: variation.quantity.toString(),
      description: variation.description,
      imageUrl: variation.imageUrl || '',
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
      imageUrl: formData.imageUrl.trim(),
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

  const handleSubmit = async (publishNow) => {
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
      setSubmitMode(publishNow ? 'publish' : 'draft');
      const createdCollection = await collectionService.createCollectionWithVariations({
        collectionName: setupData.collectionName,
        category: setupData.category,
        about: setupData.about,
        imageUrl: setupData.imageUrl,
        totalItems: totalVariationQuantity,
        variations,
        publishNow,
      });

      const image = createdCollection.imageUrl || setupData.imageUrl || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800';
      const uiStatus = publishNow ? 'Active' : 'Draft';

      router.replace({
        pathname: '/(collection)/collection-detail',
        params: {
          collectionId: String(createdCollection.id),
          title: createdCollection.collectionName || setupData.collectionName,
          subtitle: createdCollection.category || setupData.category,
          status: uiStatus,
          tag: createdCollection.tag || 'In Stock',
          image: encodeURIComponent(image),
          description: createdCollection.description || setupData.about,
        },
      });
    } catch (error) {
      Alert.alert(
        'Failed To Create Collection',
        error?.message || 'Unable to create collection. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      setSubmitMode(null);
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
          <View style={s.bottomActionRow}>
            <TouchableOpacity
              style={[s.draftButton, (variations.length === 0 || isSubmitting) && s.actionButtonDisabled]}
              onPress={() => handleSubmit(false)}
              disabled={variations.length === 0 || isSubmitting}
            >
              {isSubmitting && submitMode === 'draft' ? (
                <ActivityIndicator size="small" color={palette.accent} />
              ) : (
                <Text style={s.draftButtonText}>Save as Draft</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.publishButton, (variations.length === 0 || isSubmitting) && s.actionButtonDisabled]}
              onPress={() => handleSubmit(true)}
              disabled={variations.length === 0 || isSubmitting}
            >
              {isSubmitting && submitMode === 'publish' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.publishButtonText}>Publish</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

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

                <View style={s.formGroup}>
                  <Text style={s.formLabel}>Variation Image URL (Optional)</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder="https://example.com/variation.jpg"
                    placeholderTextColor="#aaa"
                    value={formData.imageUrl}
                    autoCapitalize="none"
                    onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
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


const s = createCreatorNewCollectionContinueStyles({ palette, isTablet });

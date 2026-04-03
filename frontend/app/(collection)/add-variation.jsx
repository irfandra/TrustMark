import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Switch, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { s } from '@/constants/styles/creator-add-variation-styles.js';

const SPEC_CATEGORIES = ['Size', 'Color', 'Material', 'Year'];

export default function AddVariation() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    size: '',
    color: '',
    material: '',
    year: '',
    inStock: true,
  });
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [activeSpecCategory, setActiveSpecCategory] = useState(null);

  const handleAddSpec = (category) => {
    const value = formData[category.toLowerCase()];
    if (value && !selectedSpecs.some((s) => s.category === category)) {
      setSelectedSpecs([...selectedSpecs, { category, value }]);
      setShowSpecModal(false);
    }
  };

  const handleRemoveSpec = (category) => {
    setSelectedSpecs(selectedSpecs.filter((s) => s.category !== category));
  };

  const handleSaveVariation = () => {
    const requiredFields = ['name', 'price', 'quantity'];
    if (requiredFields.every((field) => formData[field].trim())) {
      router.push({
        pathname: '/(collection)/collection-detail',
        params: { newVariation: JSON.stringify(formData) },
      });
    }
  };

  const getSpecValue = (category) => {
    return formData[category.toLowerCase()] || '';
  };

  const specOptions = {
    Size: ['XS', 'S', 'M', 'L', 'XL', '25cm', '30cm', '35cm'],
    Color: ['Black', 'Brown', 'Red', 'Blue', 'Green', 'White', 'Multi'],
    Material: ['Leather', 'Canvas', 'Wool', 'Cotton', 'Silk', 'Mixed'],
    Year: Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(String),
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Variation</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Variation Details</Text>

            <View style={s.formGroup}>
              <Text style={s.formLabel}>Variation Name *</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g., Hermès Birkin - Size M - Brown"
                placeholderTextColor="#aaa"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
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
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Pricing &amp; Inventory</Text>

            <View style={s.formRow}>
              <View style={[s.formGroup, { flex: 1 }]}>
                <Text style={s.formLabel}>Price (USD) *</Text>
                <TextInput
                  style={s.formInput}
                  placeholder="0"
                  placeholderTextColor="#aaa"
                  keyboardType="decimal-pad"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                />
              </View>
              <View style={[s.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={s.formLabel}>Quantity *</Text>
                <TextInput
                  style={s.formInput}
                  placeholder="0"
                  placeholderTextColor="#aaa"
                  keyboardType="number-pad"
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                />
              </View>
            </View>

            <View style={s.formGroup}>
              <View style={s.switchRow}>
                <Text style={s.formLabel}>In Stock</Text>
                <Switch
                  value={formData.inStock}
                  onValueChange={(value) => setFormData({ ...formData, inStock: value })}
                  trackColor={{ false: '#ddd', true: '#4CAF50' }}
                  thumbColor={formData.inStock ? '#fff' : '#888'}
                />
              </View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Specifications</Text>

            <View style={s.selectedSpecsContainer}>
              {selectedSpecs.map((spec) => (
                <View key={spec.category} style={s.specTag}>
                  <Text style={s.specTagText}>
                    {spec.category}: {spec.value}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveSpec(spec.category)}>
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={s.addSpecButtons}>
              {SPEC_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    s.addSpecBtn,
                    selectedSpecs.some((s) => s.category === category) && s.addSpecBtnActive,
                  ]}
                  onPress={() => {
                    setActiveSpecCategory(category);
                    setShowSpecModal(true);
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color={selectedSpecs.some((s) => s.category === category) ? '#fff' : '#111'}
                  />
                  <Text
                    style={[
                      s.addSpecBtnText,
                      selectedSpecs.some((s) => s.category === category) && s.addSpecBtnTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Summary</Text>
            <View style={s.summaryCard}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Name</Text>
                <Text style={s.summaryValue}>{formData.name || '—'}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Price</Text>
                <Text style={s.summaryValue}>{formData.price ? `${formData.price} USD` : '—'}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Quantity</Text>
                <Text style={s.summaryValue}>{formData.quantity ? `${formData.quantity} items` : '—'}</Text>
              </View>
              <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={s.summaryLabel}>Specs</Text>
                <Text style={s.summaryValue}>{selectedSpecs.length} attributes</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.saveBtn,
              (!formData.name.trim() || !formData.price.trim() || !formData.quantity.trim()) && s.saveBtnDisabled,
            ]}
            disabled={!formData.name.trim() || !formData.price.trim() || !formData.quantity.trim()}
            onPress={handleSaveVariation}
          >
            <Text style={s.saveBtnText}>Save Variation</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showSpecModal} transparent animationType="slide" onRequestClose={() => setShowSpecModal(false)}>
          <SafeAreaView style={s.modalSafe}>
            <View style={s.modalContainer}>
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={() => setShowSpecModal(false)}>
                  <Text style={s.modalCloseText}>Close</Text>
                </TouchableOpacity>
                <Text style={s.modalTitle}>{activeSpecCategory}</Text>
                <View style={{ width: 60 }} />
              </View>

              <FlatList
                data={specOptions[activeSpecCategory] || []}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      s.optionItem,
                      getSpecValue(activeSpecCategory) === item && s.optionItemSelected,
                    ]}
                    onPress={() => {
                      setFormData({
                        ...formData,
                        [activeSpecCategory.toLowerCase()]: item,
                      });
                      handleAddSpec(activeSpecCategory);
                    }}
                  >
                    <Text
                      style={[
                        s.optionText,
                        getSpecValue(activeSpecCategory) === item && s.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {getSpecValue(activeSpecCategory) === item && (
                      <Ionicons name="checkmark" size={20} color="#111" />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={s.specList}
              />
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}


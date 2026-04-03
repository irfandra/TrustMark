import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collectionService } from '@/services/collectionService';
import { createCreatorEditCollectionStyles } from '@/constants/styles/creator-edit-collection-styles.js';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

const STATUS_OPTIONS = ['Draft', 'Active', 'Inactive'];

const normalizeStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'listed') return 'Active';
  if (normalized === 'inactive' || normalized === 'expired') return 'Inactive';
  return 'Draft';
};

export default function EditCollectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const collectionId = parseParam(params.collectionId);
  const initialTitle = parseParam(params.title) || '';
  const initialSubtitle = parseParam(params.subtitle) || '';
  const initialStatus = normalizeStatus(parseParam(params.status));

  const decodedImage = useMemo(() => {
    const rawImage = parseParam(params.image);
    if (!rawImage) return '';

    try {
      return decodeURIComponent(rawImage);
    } catch (_error) {
      return rawImage;
    }
  }, [params.image]);

  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [status, setStatus] = useState(initialStatus);
  const [imageUrl, setImageUrl] = useState(decodedImage);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const safeTitle = String(title || '').trim();
    if (safeTitle.length < 2) {
      Alert.alert('Validation Error', 'Collection name must be at least 2 characters.');
      return;
    }

    if (!collectionId) {
      Alert.alert('Missing Data', 'Collection id is missing. Please reopen from collection detail.');
      return;
    }

    try {
      setIsSaving(true);

      const updatedCollection = await collectionService.updateCollection(collectionId, {
        collectionName: safeTitle,
        season: String(subtitle || '').trim(),
        imageUrl: String(imageUrl || '').trim(),
        status,
        isLimitedEdition: false,
      });

      const nextImage = updatedCollection?.imageUrl || imageUrl || decodedImage || '';

      router.replace({
        pathname: '/(collection)/collection-detail',
        params: {
          collectionId: String(updatedCollection?.id || collectionId),
          title: updatedCollection?.collectionName || safeTitle,
          subtitle: updatedCollection?.season || String(subtitle || '').trim(),
          status: normalizeStatus(updatedCollection?.status || status),
          tag: updatedCollection?.tag || parseParam(params.tag) || 'In Stock',
          image: encodeURIComponent(nextImage),
        },
      });
    } catch (error) {
      Alert.alert('Failed To Update', error?.message || 'Unable to update collection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Edit Collection</Text>

        <Text style={styles.label}>Collection Name</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Collection name"
          placeholderTextColor="#9A8E80"
        />

        <Text style={styles.label}>Category / Season</Text>
        <TextInput
          style={styles.input}
          value={subtitle}
          onChangeText={setSubtitle}
          placeholder="e.g., Luxury Bags"
          placeholderTextColor="#9A8E80"
        />

        <Text style={styles.label}>Banner Image URL</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          placeholderTextColor="#9A8E80"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.rowWrap}>
          {STATUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.pillButton, status === option && styles.pillButtonActive]}
              onPress={() => setStatus(option)}
            >
              <Text style={[styles.pillText, status === option && styles.pillTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.helperText}>
          Stock label is calculated automatically from produced vs in-stock item count.
        </Text>

        <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createCreatorEditCollectionStyles({ isTablet });

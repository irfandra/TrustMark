import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView, View, Text, Image,
  StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';
import { s } from '@/constants/styles/creator-collection-detail-styles.js';

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

const getStockBadgeStyle = (label) => {
  const normalized = String(label || '').trim().toLowerCase();
  if (normalized === 'low stock') {
    return { backgroundColor: '#D95F47', color: '#FFF9F0' };
  }
  if (normalized === 'medium stock') {
    return { backgroundColor: '#B6842D', color: '#FFF9F0' };
  }
  if (normalized === 'out of stock') {
    return { backgroundColor: '#6B5A4B', color: '#FFF9F0' };
  }
  return { backgroundColor: '#2D7A4E', color: '#FFF9F0' };
};

export default function CollectionDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [catalogItems, setCatalogItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState('');

  const collectionId = parseParam(params.collectionId);

  const loadCatalogItems = useCallback(async (showInitialLoader = true) => {
    if (!collectionId) {
      setCatalogItems([]);
      setLoadError('Missing collection id');
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
      return;
    }

    try {
      if (showInitialLoader) {
        setIsLoading(true);
      }
      setLoadError('');
      const data = await collectionService.getProductsByCollection(collectionId);
      setCatalogItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setCatalogItems([]);
      setLoadError(error?.message || 'Failed to load collection products');
    } finally {
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadCatalogItems();
  }, [loadCatalogItems]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCatalogItems(false);
  }, [loadCatalogItems]);

  const heroImage = params.image
    ? decodeURIComponent(params.image)
    : 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800';
  const title = parseParam(params.title) || 'Collection';
  const subtitle = parseParam(params.subtitle) || 'Product Collection';
  const status = parseParam(params.status) || 'Draft';
  const tag = parseParam(params.tag) || 'In Stock';
 const description = parseParam(params.description) || 'No description provided for this collection.';
  const stockBadgeStyle = getStockBadgeStyle(tag);

  const totalItems = useMemo(() => {
    const total = catalogItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return total.toLocaleString();
  }, [catalogItems]);

  const stockLeftItems = useMemo(() => {
    const stockLeft = catalogItems.reduce((sum, item) => {
      const total = Number(item.total || 0);
      const available = Number(item.available || 0);
      const normalizedAvailable = Math.max(Math.min(available, total), 0);
      return sum + normalizedAvailable;
    }, 0);

    return stockLeft.toLocaleString();
  }, [catalogItems]);

  const filtered = catalogItems.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) ||
           i.collection.toLowerCase().includes(search.toLowerCase())
  );

  const handleCardPress = (item) =>
    router.push({
      pathname: '/(collection)/item-detail',
      params: { itemId: item.id, name: item.name, collection: item.collection, brand: item.brand, available: item.available, total: item.total, priceAmount: item.priceAmount, priceUsd: item.priceUsd, currency: item.currency, image: encodeURIComponent(item.image) },
    });

  const deleteCollection = useCallback(async () => {
    if (!collectionId || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await collectionService.deleteCollection(collectionId);
      router.replace('/(tabs)/(collection)/collection');
    } catch (error) {
      Alert.alert('Delete Failed', error?.message || 'Unable to delete collection. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [collectionId, isDeleting, router]);

  const handleDeletePress = useCallback(() => {
    if (!collectionId) {
      Alert.alert('Missing Collection', 'Collection id is missing. Please reopen collection detail from list.');
      return;
    }

    Alert.alert(
      'Delete Collection',
      'This will permanently delete the collection and cannot be undone. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteCollection,
        },
      ]
    );
  }, [collectionId, deleteCollection]);

  const handleBackToCollectionHome = useCallback(() => {
    router.replace('/(tabs)/(collection)/collection');
  }, [router]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#1E2C3A" />
          }
        >

          <View style={s.heroWrap}>
            <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={s.heroOverlay} />
            <TouchableOpacity style={s.backBtn} onPress={handleBackToCollectionHome}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <View style={s.heroContent}>
              <View style={[s.stockBadge, { backgroundColor: stockBadgeStyle.backgroundColor }]}> 
                <Text style={[s.stockBadgeText, { color: stockBadgeStyle.color }]}>{tag}</Text>
              </View>
              <Text style={s.heroTitle}>{title}</Text>
              <View style={s.heroSubRow}>
                <Text style={s.heroSubText}>{subtitle}</Text>
                <Text style={s.heroDivider}>  |  </Text>
                <Text style={s.heroDraft}>{status}</Text>
              </View>
            </View>
          </View>

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Total Produced</Text>
              <Text style={s.statValue}>{totalItems}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Stock Left</Text>
              <Text style={s.statValue}>{stockLeftItems}</Text>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.bodyText}>
              {description}
            </Text>
          </View>

          {isLoading && (
            <View style={s.loadingWrap}>
              <LoadingPulse label="Loading products..." />
            </View>
          )}

          {!isLoading && !!loadError && (
            <View style={s.errorWrap}>
              <Text style={s.errorText}>{loadError}</Text>
            </View>
          )}

          <View style={s.catalogHeaderRow}>
            <View style={s.catalogTitleWrap}>
              <Text style={s.catalogTitle}>Catalog Library</Text>
              <Text style={s.catalogCount}>{filtered.length} of {catalogItems.length}</Text>
            </View>
           
          </View>

          <View style={s.searchWrap}>
            <Ionicons name="search" size={18} color="#7B6A58" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search catalog items"
              placeholderTextColor="#9E8F7C"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={s.catalogList}>
            {filtered.length === 0 ? (
              <View style={s.emptyCatalogWrap}>
                <Text style={s.emptyCatalogText}>No catalog items match your search.</Text>
              </View>
            ) : (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={s.catalogCard}
                  activeOpacity={0.9}
                  onPress={() => handleCardPress(item)}
                >
                  <Image source={{ uri: item.image }} style={s.cardThumb} resizeMode="cover" />

                  <View style={s.cardBody}>
                    <View style={s.cardTopRow}>
                      <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                      <View style={s.chevronWrap}>
                        <Ionicons name="chevron-forward" size={14} color="#1E2C3A" />
                      </View>
                    </View>

                    <Text style={s.cardCollection} numberOfLines={1}>{item.collection}</Text>

                    <View style={s.metaRow}>
                      <View style={s.metaPill}>
                        <Text style={s.metaPillText}>{item.status}</Text>
                      </View>
                      <View style={s.metaPill}>
                        <Text style={s.metaPillText}>
                          {Number(item.available || 0).toLocaleString()} / {Number(item.total || 0).toLocaleString()} Available
                        </Text>
                      </View>
                    </View>

                    <View style={s.cardPriceRow}>
                      <Text style={s.cardPriceToken}>USD</Text>
                      <Text style={s.cardPriceAmount}>{item.priceAmount}</Text>
                      {!!item.priceUsd && <Text style={s.cardPriceUsd}>{item.priceUsd}</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            style={s.mintBtn}
            onPress={() => router.push({
              pathname: '/(collection)/generate-all-qr-collections',
              params: { collectionId },
            })}
          >
            <Text style={s.mintBtnText}>Check Certificate QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.deleteBtn, isDeleting && s.deleteBtnDisabled]} onPress={handleDeletePress} disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFF9F0" />
            ) : (
              <Ionicons name="trash" size={22} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() =>
              router.push({
                pathname: '/(collection)/edit-collection',
                params: {
                  collectionId,
                  title,
                  subtitle,
                  status,
                  tag,
                  image: params.image,
                },
              })
            }
          >
            <Ionicons name="create-outline" size={22} color="#222" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


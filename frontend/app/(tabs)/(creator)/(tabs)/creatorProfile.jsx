import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brandService } from '@/services/brandService';
import LoadingPulse from '@/components/shared/loading-pulse';

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_LOGO = '';

export default function CreatorProfileScreen() {
  const [brand, setBrand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadProfile = async (showInitialLoader = true) => {
    try {
      if (showInitialLoader) {
        setIsLoading(true);
      }
      setLoadError('');
      const data = await brandService.getCreatorBrandProfile();
      setBrand(data);
    } catch (error) {
      setBrand(null);
      setLoadError(error?.message || 'Failed to load creator profile');
    } finally {
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const profile = useMemo(() => {
    if (brand) {
      return {
        brandName: brand.brandName || 'Brand',
        statusText: brand.verified ? 'Brand Verified' : 'Your Request is being evaluated',
        statusColor: brand.verified ? '#0F9D58' : '#E10600',
        banner: brand.companyBanner || DEFAULT_BANNER,
        logo: brand.logo || DEFAULT_LOGO,
        companyAddress: brand.companyAddress || '-',
        personName: brand.personInChargeName || brand.ownerName || '-',
        personEmail: brand.personInChargeEmail || brand.companyEmail || '-',
        personRole: brand.personInChargeRole || '-',
        personPhone: brand.personInChargePhone || '-',
      };
    }

    return {
      brandName: 'TRUSTMARK',
      statusText: 'Your Request is being evaluated',
      statusColor: '#E10600',
      banner: DEFAULT_BANNER,
      logo: DEFAULT_LOGO,
      companyAddress: '-',
      personName: '-',
      personEmail: '-',
      personRole: '-',
      personPhone: '-',
    };
  }, [brand]);

  const reloadProfile = async () => {
    loadProfile();
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProfile(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#1E2C3A" />
        }
      >
      
        <Text style={styles.pageTitle}>Brand</Text>

        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle-outline" size={22} color={profile.statusColor} />
          <Text style={[styles.statusText, { color: profile.statusColor }]}>{profile.statusText}</Text>
        </View>

        <ImageBackground source={{ uri: profile.banner }} style={styles.banner} imageStyle={styles.bannerImage}>
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerIdentity}>
            <View style={styles.logoWrap}>
              {!!profile.logo && <Image source={{ uri: profile.logo }} style={styles.brandLogo} />}
            </View>
            <Text style={styles.brandName} numberOfLines={1}>
              {profile.brandName}
            </Text>
          </View>
        </ImageBackground>

        {isLoading && (
          <View style={styles.loadingWrap}>
            <LoadingPulse label="Loading creator profile..." />
          </View>
        )}

        {!isLoading && !!loadError && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={reloadProfile}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Company Address</Text>
        <Text style={styles.sectionBody}>{profile.companyAddress}</Text>

        <Text style={styles.sectionTitle}>Person In Charge Detail</Text>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Full Name</Text>
            <Text style={styles.gridValue}>{profile.personName}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Email</Text>
            <Text style={styles.gridValue}>{profile.personEmail}</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Role</Text>
            <Text style={styles.gridValue}>{profile.personRole}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Phone Number</Text>
            <Text style={styles.gridValue}>{profile.personPhone}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F1E8',
  },
  scrollContainer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 34,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modePill: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D6C8B5',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFF9F0',
  },
  modeOff: {
    width: 48,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  modeOn: {
    width: 52,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E2C3A',
  },
  brandHeading: {
    fontSize: 44,
    fontWeight: '900',
    color: '#1E2C3A',
    letterSpacing: -1,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: '#1E2C3A',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  banner: {
    height: 180,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  bannerImage: {
    borderRadius: 26,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,44,58,0.42)',
  },
  bannerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF9F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  brandName: {
    fontSize: 30,
    color: '#FFF9F0',
    fontWeight: '800',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 8,
  },
  loadingText: {
    color: '#6E6356',
    fontSize: 13,
  },
  errorWrap: {
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3CEC7',
    backgroundColor: '#F9F2F0',
    padding: 10,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  retryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E2C3A',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF9F0',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#1E2C3A',
    letterSpacing: -0.2,
  },
  sectionBody: {
    color: '#6F5E4C',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 22,
    marginBottom: 8,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 14,
    color: '#3D4D61',
    fontWeight: '600',
    marginBottom: 2,
  },
  gridValue: {
    color: '#6F5E4C',
    fontSize: 14,
    lineHeight: 19,
  },
});

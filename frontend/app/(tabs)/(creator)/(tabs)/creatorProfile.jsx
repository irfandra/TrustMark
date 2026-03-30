import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brandService } from '@/services/brandService';
import LoadingPulse from '@/components/shared/loading-pulse';

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_LOGO = '';

const truncateWallet = (value) => {
  const wallet = String(value || '').trim();
  if (!wallet) return '-';
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
};

const getFileName = (url) => {
  if (!url) return 'No request letter uploaded';
  try {
    const withoutQuery = url.split('?')[0];
    return decodeURIComponent(withoutQuery.substring(withoutQuery.lastIndexOf('/') + 1));
  } catch (_error) {
    return 'Request Letter.pdf';
  }
};

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
        statusText: brand.verified ? 'Your request has been approved' : 'Your Request is being evaluated',
        statusColor: brand.verified ? '#0F9D58' : '#E10600',
        banner: brand.companyBanner || DEFAULT_BANNER,
        logo: brand.logo || DEFAULT_LOGO,
        companyAddress: brand.companyAddress || '-',
        wallet: brand.companyWalletAddress || '-',
        personName: brand.personInChargeName || brand.ownerName || '-',
        personEmail: brand.personInChargeEmail || brand.companyEmail || '-',
        personRole: brand.personInChargeRole || '-',
        personPhone: brand.personInChargePhone || '-',
        requestLetterUrl: brand.statementLetterUrl || '',
      };
    }

    return {
      brandName: 'ZEAL',
      statusText: 'Your Request is being evaluated',
      statusColor: '#E10600',
      banner: DEFAULT_BANNER,
      logo: DEFAULT_LOGO,
      companyAddress: '-',
      wallet: '-',
      personName: '-',
      personEmail: '-',
      personRole: '-',
      personPhone: '-',
      requestLetterUrl: '',
    };
  }, [brand]);

  const openRequestLetter = async () => {
    if (!profile.requestLetterUrl) {
      Alert.alert('Unavailable', 'No request letter found for this brand.');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(profile.requestLetterUrl);
      if (!canOpen) {
        Alert.alert('Unavailable', 'Cannot open request letter URL.');
        return;
      }

      await Linking.openURL(profile.requestLetterUrl);
    } catch (_error) {
      Alert.alert('Unavailable', 'Cannot open request letter URL.');
    }
  };

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
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#111" />
        }
      >
      
        <Text style={styles.pageTitle}>Brand</Text>

        <View style={styles.statusRow}>
          <Ionicons name="information-circle" size={22} color={profile.statusColor} />
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

        <Text style={styles.sectionTitle}>Company Crypto Wallet</Text>
        <View style={styles.walletCard}>
          <View style={styles.walletLeft}>
            <Image
              source={{ uri: 'https://seeklogo.com/images/M/metamask-logo-09EDE53DBD-seeklogo.com.png' }}
              style={styles.walletIcon}
            />
            <View>
              <Text style={styles.walletName}>Metamask</Text>
              <Text style={styles.walletAddress}>{truncateWallet(profile.wallet)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.manageButton}>
            <Text style={styles.manageText}>Manage</Text>
          </TouchableOpacity>
        </View>

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

        <Text style={styles.sectionTitle}>Request Letter</Text>
        <TouchableOpacity style={styles.fileRow} onPress={openRequestLetter}>
          <View style={styles.fileIconWrap}>
            <Ionicons name="document-attach-outline" size={22} color="#8A8A8A" />
          </View>
          <Text style={styles.fileName} numberOfLines={1}>
            {getFileName(profile.requestLetterUrl)}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#A1A1A1" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
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
  zeal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.4,
  },
  modePill: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  modeOff: {
    width: 48,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeOn: {
    width: 52,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  brandHeading: {
    fontSize: 44,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: '#111',
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
    backgroundColor: 'rgba(0,0,0,0.28)',
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
    backgroundColor: '#fff',
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
    color: '#fff',
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
    color: '#666',
    fontSize: 13,
  },
  errorWrap: {
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3C2C2',
    backgroundColor: '#FFF4F4',
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
    backgroundColor: '#111',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#111',
    letterSpacing: -0.2,
  },
  sectionBody: {
    color: '#222',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  walletIcon: {
    width: 44,
    height: 44,
  },
  walletName: {
    fontSize: 16,
    color: '#111',
    fontWeight: '700',
  },
  walletAddress: {
    fontSize: 13,
    color: '#333',
  },
  manageButton: {
    width: 106,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    color: '#111',
    fontWeight: '600',
    marginBottom: 2,
  },
  gridValue: {
    color: '#8A8A8A',
    fontSize: 14,
    lineHeight: 19,
  },
  fileRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
  fileIconWrap: {
    width: 36,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 14,
    color: '#7A7A7A',
    flex: 1,
  },
});

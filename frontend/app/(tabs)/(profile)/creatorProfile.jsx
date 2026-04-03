import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingPulse from '@/components/shared/loading-pulse';
import { useRole } from '@/components/context/RoleContext';
import { creatorProfileStyles as styles } from '@/constants/styles/creator-profile-styles';

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_LOGO = '';
const DEFAULT_PROFILE = {
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

const mapCreatorProfile = (creatorProfile) => {
  if (!creatorProfile) {
    return DEFAULT_PROFILE;
  }

  return {
    brandName: creatorProfile.brandName || 'Brand',
    statusText: creatorProfile.verified ? 'Brand Verified' : 'Your Request is being evaluated',
    statusColor: creatorProfile.verified ? '#0F9D58' : '#E10600',
    banner: creatorProfile.companyBanner || DEFAULT_BANNER,
    logo: creatorProfile.logo || DEFAULT_LOGO,
    companyAddress: creatorProfile.companyAddress || '-',
    personName: creatorProfile.personInChargeName || creatorProfile.ownerName || '-',
    personEmail: creatorProfile.personInChargeEmail || creatorProfile.companyEmail || '-',
    personRole: creatorProfile.personInChargeRole || '-',
    personPhone: creatorProfile.personInChargePhone || '-',
  };
};

export default function CreatorProfileScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    creatorProfile,
    isCreatorProfileLoading,
    creatorProfileError,
    reloadCreatorProfile,
  } = useRole();

  const profile = mapCreatorProfile(creatorProfile);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await reloadCreatorProfile(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
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

        {isCreatorProfileLoading && (
          <View style={styles.loadingWrap}>
            <LoadingPulse label="Loading creator profile..." />
          </View>
        )}

        {!isCreatorProfileLoading && !!creatorProfileError && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{creatorProfileError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => reloadCreatorProfile(true)}>
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


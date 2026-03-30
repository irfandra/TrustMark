import React from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function AccountScreen() {
  const router = useRouter();

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Header */}
        <Text style={styles.header}>Account</Text>

        {/* Profile Section */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1457449940276-e8deed18bfff?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>Gerry Julian</Text>
            <Text style={styles.handle}>@glimpse27</Text>
          </View>
        </View>

        {/* Wallet Section */}
        <View style={styles.walletCard}>
          <Text style={styles.walletTitle}>Your Wallet</Text>
          <View style={styles.walletBox}>
            <Image
              source={{
                uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/3840px-MetaMask_Fox.svg.png',
              }}
              style={styles.walletIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.walletName}>Metamask</Text>
              <Text style={styles.walletAddress}>0xa12asd1235f425...</Text>
            </View>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => router.push('/wallet/settings')}
            >
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ Change Password — passes showBack param */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNavigation('/(auth)/changepassword?showBack=true')}
        >
          <Text style={styles.menuText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNavigation('/(settings)/faquser')}
        >
          <Text style={styles.menuText}>FAQ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNavigation('/(settings)/useterms')}
        >
          <Text style={styles.menuText}>Terms Of Use</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNavigation('/(settings)/privacypolicy')}
        >
          <Text style={styles.menuText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            console.log('Signing out...');
            router.push('/login');
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flex: 1, marginTop: 10 },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  header: { fontSize: 28, fontWeight: '600', marginBottom: 20 },
  profileCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: { height: 60, width: 60, borderRadius: 30, marginRight: 15 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  handle: { color: '#ccc', fontSize: 14 },
  walletCard: { marginBottom: 20 },
  walletTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  walletBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  walletIcon: { height: 32, width: 32, marginRight: 10 },
  walletName: { fontWeight: '600', fontSize: 16 },
  walletAddress: { color: '#666', fontSize: 13 },
  manageButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageText: { color: '#fff', fontWeight: '600' },
  menuButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  menuText: { fontWeight: '600' },
  signOutButton: {
    backgroundColor: 'red',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  signOutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bottomSpacer: { height: 40 },
});
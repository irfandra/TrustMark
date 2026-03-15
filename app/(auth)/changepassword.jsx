import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [doPasswordsMatch, setDoPasswordsMatch] = useState(false);

  // Password validation (same as Register)
  useEffect(() => {
    const minLength = newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    setIsPasswordValid(minLength && hasUpperCase && hasNumber);
    setDoPasswordsMatch(
      newPassword === confirmPassword && newPassword.length > 0,
    );
  }, [newPassword, confirmPassword]);

  const handleBack = () => router.back();

  const handleChangePassword = () => {
    if (!email.trim() || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    console.log('Password changed for:', email);
    router.push('/login');
  };

  const allFieldsValid =
    email.trim() && isPasswordValid && doPasswordsMatch;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>ZEAL</Text>
            <Text style={styles.mainTitle}>Change Your Password</Text>
            <Text style={styles.subTitle}>Renew your password</Text>
          </View>

          {/* Email */}
          <View style={styles.section}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#B0B0B0"
            />
          </View>

          {/* New Password - Register Style */}
          <View style={styles.section}>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="New Password"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                placeholderTextColor="#B0B0B0"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  style={styles.eyeicon}
                  size={22}
                  color="#222"
                />
              </TouchableOpacity>
            </View>

            {/* Password Criteria - Register Style */}
            <View style={styles.passwordCriteria}>
              <Text style={{ color: newPassword.length >= 8 ? 'green' : '#B0B0B0' }}>
                • Minimum 8 characters
              </Text>
              <Text style={{ color: /[A-Z]/.test(newPassword) ? 'green' : '#B0B0B0' }}>
                • At least one uppercase letter
              </Text>
              <Text style={{ color: /[0-9]/.test(newPassword) ? 'green' : '#B0B0B0' }}>
                • At least one number
              </Text>
            </View>
          </View>

          {/* Confirm Password - Register Style */}
          <View style={styles.section}>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirm New Password"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                placeholderTextColor="#B0B0B0"
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
                <Ionicons
                  name={showConfirm ? 'eye' : 'eye-off'}
                  style={styles.eyeicon}
                  size={22}
                  color="#222"
                />
              </TouchableOpacity>
            </View>

            {/* Password Match Indicator */}
            {(newPassword.length > 0 || confirmPassword.length > 0) && (
              <Text
                style={{
                  color: doPasswordsMatch ? 'green' : 'red',
                  marginBottom: 12,
                }}
              >
                {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.changeButton,
              !allFieldsValid && styles.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleChangePassword}
            disabled={!allFieldsValid}
          >
            <Text style={styles.changeButtonText}>Change Password</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 17,
    color: '#111',
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 40, marginTop: 16 },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
    textAlign: 'left',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'left',
  },
  subTitle: {
    fontSize: 18,
    color: '#444',
    marginTop: 4,
    textAlign: 'left',
  },
  section: { marginBottom: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#222',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eyeicon: {
    marginLeft: 10,
  },
  passwordCriteria: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  changeButton: {
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    opacity: 1,
  },
  buttonDisabled: { opacity: 0.5 },
  changeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
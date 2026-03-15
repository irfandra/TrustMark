import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [doPasswordsMatch, setDoPasswordsMatch] = useState(false);

  // Validate password & match
  useEffect(() => {
    const minLength = form.password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(form.password);
    const hasNumber = /[0-9]/.test(form.password);

    setIsPasswordValid(minLength && hasUpperCase && hasNumber);
    setDoPasswordsMatch(
      form.password === form.confirmPassword && form.password.length > 0,
    );
  }, [form.password, form.confirmPassword]);

  const allFieldsFilled =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.userName.trim() &&
    isPasswordValid &&
    doPasswordsMatch &&
    agreed;

  const handleInputChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = () => {
    console.log('Register pressed with:', form);
    router.replace('/accountactivation');
  };

  const handleConnectMetamask = () => {
    console.log('Connect to Metamask pressed');
  };

  const handleBack = () => {
    router.back();
  };

  const handleTermsPress = () => {
    router.push('/useterms');
  };

  const handlePrivacyPress = () => {
    router.push('/privacypolicy');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#111" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Logo */}
          <View style={styles.header}>
            <Text style={styles.logo}>ZEAL</Text>
            <Text style={styles.mainTitle}>Register New Account</Text>
          </View>

          {/* Crypto Wallet */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Crypto Wallet<Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.metamaskButton}
              onPress={handleConnectMetamask}
              activeOpacity={0.8}
            >
              <Text style={styles.metamaskText}>Connect to Metamask</Text>
              <MaterialCommunityIcons
                name="wallet"
                size={28}
                color="#F6851B"
                style={styles.metamaskIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Account<Text style={styles.asterisk}>*</Text>
            </Text>

            {/* First & Last Name */}
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="First Name"
                value={form.firstName}
                onChangeText={text => handleInputChange('firstName', text)}
                autoCapitalize="words"
                placeholderTextColor="#B0B0B0"
              />
              <TextInput
                style={[styles.input, styles.inputHalf, { marginLeft: 12 }]}
                placeholder="Last Name"
                value={form.lastName}
                onChangeText={text => handleInputChange('lastName', text)}
                autoCapitalize="words"
                placeholderTextColor="#B0B0B0"
              />
            </View>

            {/* Email & Username */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={form.email}
              onChangeText={text => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#B0B0B0"
            />
            <TextInput
              style={styles.input}
              placeholder="User Name"
              value={form.userName}
              onChangeText={text => handleInputChange('userName', text)}
              autoCapitalize="none"
              placeholderTextColor="#B0B0B0"
            />

            {/* Password */}
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                value={form.password}
                onChangeText={text => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#B0B0B0"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  style={[styles.eyeicon]}
                  size={22}
                  color="#222"
                />
              </TouchableOpacity>
            </View>

            {/* Password Criteria */}
            <View style={styles.passwordCriteria}>
              <Text
                style={{
                  color: form.password.length >= 8 ? 'green' : '#B0B0B0',
                }}
              >
                • Minimum 8 characters
              </Text>
              <Text
                style={{
                  color: /[A-Z]/.test(form.password) ? 'green' : '#B0B0B0',
                }}
              >
                • At least one uppercase letter
              </Text>
              <Text
                style={{
                  color: /[0-9]/.test(form.password) ? 'green' : '#B0B0B0',
                }}
              >
                • At least one number
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChangeText={text =>
                  handleInputChange('confirmPassword', text)
                }
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                placeholderTextColor="#B0B0B0"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye' : 'eye-off'}
                  style={[styles.eyeicon]}
                  size={22}
                  color="#222"
                />
              </TouchableOpacity>
            </View>

            {/* Password Match */}
            {(form.password.length > 0 || form.confirmPassword.length > 0) && (
              <Text
                style={{
                  color: doPasswordsMatch ? 'green' : 'red',
                  marginBottom: 12,
                }}
              >
                {doPasswordsMatch
                  ? 'Passwords match'
                  : 'Passwords do not match'}
              </Text>
            )}
          </View>

          {/* Checkbox with Clickable Legal Links */}
          <View style={styles.legalRow}>
            <TouchableOpacity
              style={[styles.checkbox, agreed && styles.checkboxChecked]}
              onPress={() => setAgreed(v => !v)}
              activeOpacity={0.8}
            >
              {agreed && <Ionicons name="checkmark" size={18} color="#fff" />}
            </TouchableOpacity>
            <Text style={styles.legalText}>
              I agree to this application{' '}
              <Text style={styles.legalLink} onPress={handleTermsPress}>
                Terms of Use
              </Text>{' '}
              and its{' '}
              <Text style={styles.legalLink} onPress={handlePrivacyPress}>
                Privacy Policy
              </Text>
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              !allFieldsFilled && styles.registerButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={!allFieldsFilled}
          >
            <Text style={styles.registerButtonText}>REGISTER</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Do you have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
    marginTop: 16,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  asterisk: {
    fontStyle: 'italic',
    color: '#F00',
    fontWeight: 'bold',
  },
  metamaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metamaskText: {
    fontSize: 17,
    color: '#222',
    fontWeight: '500',
  },
  metamaskIcon: {
    marginLeft: 1,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  eyeicon: {
    marginLeft: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#222',
    marginBottom: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passwordCriteria: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#B0B0B0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  legalText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
  },
  legalLink: {
    color: '#222',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 32,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  loginLink: {
    fontSize: 15,
    color: '#111',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
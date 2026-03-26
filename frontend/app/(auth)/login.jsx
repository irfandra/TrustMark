import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWallet } from "../../components/context/WalletContext";

export default function LoginScreen() {
  const router = useRouter();
  const { wallet, connectWallet, isConnecting, signMessage } = useWallet();

  const getAPIBase = () => {
    if (Platform.OS === "android") return "http://10.0.2.2:8080/api/v1";
    return "http://127.0.0.1:8080/api/v1";
  };

  const API_BASE = getAPIBase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFormValid = email.trim() && password.trim();

  // ─── Email Login ───────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem("accessToken", data.data.accessToken);
        await AsyncStorage.setItem("refreshToken", data.data.refreshToken);
        router.replace("/(tabs)");
      } else {
        Alert.alert("Login Failed", data.error?.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Error", err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ─── Wallet Login (One Click) ──────────────────────────────────
const handleLoginWithWallet = async () => {
  setLoading(true);
  try {
    // Step 1: Connect wallet
    let activeWallet = wallet;
    if (!activeWallet) {
      activeWallet = await connectWallet();
      if (!activeWallet) {
        Alert.alert("Error", "Failed to connect wallet");
        return;
      }
    }

    // Step 2: Check if address is registered in DB
    const checkResponse = await fetch(
      `${API_BASE}/auth/wallet/check?address=${activeWallet.address}`
    );
    if (!checkResponse.ok) {
      Alert.alert("Error", `Server error: ${checkResponse.status}`);
      return;
    }
    const checkData = await checkResponse.json();

    // ✅ Not registered → go to register with address pre-filled
    if (!checkData.data.isRegistered) {
      router.push({
        pathname: "/register",
        params: { walletAddress: activeWallet.address },
      });
      return;
    }

    // Step 3: Get nonce
    const nonceResponse = await fetch(
      `${API_BASE}/auth/wallet/nonce?address=${activeWallet.address}`
    );
    if (!nonceResponse.ok) {
      Alert.alert("Error", `Server error: ${nonceResponse.status}`);
      return;
    }
    const nonceData = await nonceResponse.json();
    if (!nonceData.success) {
      Alert.alert("Error", nonceData.error?.message || "Failed to get nonce");
      return;
    }

    const message = nonceData.data.message;

    // Step 4: Sign in MetaMask (real signing — no private key in app)
    const signature = await signMessage(message, activeWallet.address);
    if (!signature) {
      Alert.alert("Signing Failed", "Message signing was cancelled or failed");
      return;
    }

    // Step 5: Login
    const loginResponse = await fetch(`${API_BASE}/auth/wallet/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: activeWallet.address,
        signature,
        message,
      }),
    });
    if (!loginResponse.ok) {
      Alert.alert("Error", `Server error: ${loginResponse.status}`);
      return;
    }

    const loginData = await loginResponse.json();
    if (loginData.success) {
      await AsyncStorage.setItem("accessToken", loginData.data.accessToken);
      await AsyncStorage.setItem("refreshToken", loginData.data.refreshToken);
      router.replace("/(tabs)");
    } else {
      Alert.alert("Error", loginData.error?.message || "Wallet login failed");
    }

  } catch (err) {
    console.error("Wallet login error:", err);
    Alert.alert("Wallet Login Error", err?.message || "An unexpected error occurred");
  } finally {
    setLoading(false);
  }
};

  const handleForgotPassword = () => router.push("/forgotpassword");
  const handleBack = () => router.back();
  const handleRegister = () => router.push("/register");

  return (
    <SafeAreaView style={styles.safeArea}>
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>ZEAL</Text>
            <Text style={styles.mainTitle}>Login</Text>
          </View>

          {/* Email Input */}
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

          {/* Password Input */}
          <View style={styles.section}>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#B0B0B0"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={22}
                  color="#222"
                  style={styles.eyeIcon}
                />
              </Pressable>
            </View>
            <Pressable onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Email Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              (!isFormValid || loading) && styles.loginButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>LOGIN</Text>
            )}
          </TouchableOpacity>

          {/* Wallet Login Button */}
          <TouchableOpacity
            style={[
              styles.metamaskButton,
              (isConnecting || loading) && styles.metamaskButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleLoginWithWallet}
            disabled={isConnecting || loading}
          >
            {isConnecting || loading ? (
              <ActivityIndicator color="#F6851B" />
            ) : (
              <>
                <Text style={styles.metamaskText}>
                  {wallet
                    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
                    : "Login with MetaMask"}
                </Text>
                <MaterialCommunityIcons
                  name="wallet"
                  size={24}
                  color="#F6851B"
                  style={styles.metamaskIcon}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have any account?</Text>
            <Pressable onPress={handleRegister}>
              <Text style={styles.registerLink}>Register Account</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  headerBar: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 17,
    color: "#111",
    fontWeight: "600",
    marginLeft: 8,
  },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 40, marginTop: 16 },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 12,
    textAlign: "left",
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    textAlign: "left",
  },
  section: { marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#222",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eyeIcon: { marginLeft: 12 },
  forgotPassword: {
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
    textAlign: "right",
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: "#111",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonDisabled: { opacity: 0.5 },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  metamaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 32,
  },
  metamaskButtonDisabled: { opacity: 0.6 },
  metamaskText: { fontSize: 17, color: "#222", fontWeight: "500" },
  metamaskIcon: { marginLeft: 12 },
  footer: { alignItems: "center" },
  footerText: { fontSize: 14, color: "#888", marginBottom: 8 },
  registerLink: {
    fontSize: 15,
    color: "#111",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
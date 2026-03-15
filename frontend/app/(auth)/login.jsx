import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
} from 'react-native';

export default function LoginScreen() {
    const router = useRouter();

    // Input states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Validation
    const isFormValid = email.trim() && password.trim();

    // Handlers
    const handleLogin = () => {
        console.log('Login pressed with:', { email });
        router.replace('/(tabs)');
    };

    const handleLoginMetamask = () => {
        console.log('Login with Metamask pressed');
        // Add metamask login logic
    };

    const handleForgotPassword = () => {
        console.log('Forgot password pressed');
        router.push('/forgotpassword');
    };

    const handleBack = () => {
        router.back();
    };

    const handleRegister = () => {
        console.log('Register clicked');
        router.push('/register');
    };

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
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <View style={styles.header}>
                        <Text style={styles.logo}>ZEAL</Text>
                        <Text style={styles.mainTitle}>Login</Text>
                    </View>

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
                                    name={showPassword ? 'eye' : 'eye-off'}
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

                    <TouchableOpacity
                        style={[styles.loginButton, !isFormValid && styles.loginButtonDisabled]}
                        activeOpacity={0.8}
                        onPress={handleLogin}
                        disabled={!isFormValid}
                    >
                        <Text style={styles.loginButtonText}>LOGIN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.metamaskButton}
                        activeOpacity={0.8}
                        onPress={handleLoginMetamask}
                    >
                        <Text style={styles.metamaskText}>Login with Metamask</Text>
                        <MaterialCommunityIcons
                            name="wallet"
                            size={24}
                            color="#F6851B"
                            style={styles.metamaskIcon}
                        />
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have any account ?</Text>
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
    logo: { fontSize: 32, fontWeight: 'bold', color: '#111', marginBottom: 12, textAlign: 'left' },
    mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'left' },
    section: { marginBottom: 20 },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#222',
    },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    eyeIcon: { marginLeft: 12 },
    forgotPassword: { fontSize: 15, color: '#222', fontWeight: '500', textAlign: 'right', marginTop: 4 },
    loginButton: { backgroundColor: '#111', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
    loginButtonDisabled: { opacity: 0.5 },
    loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    metamaskButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 18,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    metamaskText: { fontSize: 17, color: '#222', fontWeight: '500' },
    metamaskIcon: { marginLeft: 12 },
    footer: { alignItems: 'center' },
    footerText: { fontSize: 14, color: '#888', marginBottom: 8 },
    registerLink: { fontSize: 15, color: '#111', fontWeight: 'bold', textDecorationLine: 'underline' },
});
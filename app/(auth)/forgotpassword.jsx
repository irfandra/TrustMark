import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const progressAnim = useRef(new Animated.Value(1)).current;
    const intervalIdRef = useRef(null); // ✅ Removed TypeScript type

    const TIMER_DURATION = 5000;

    const handleResetPassword = () => {
        if (!email.trim()) return;
        
        console.log('Reset password for:', email);
        setShowModal(true);
        startTimer();
    };

    const handleChangePassword = () => {
        router.push('/changepassword');
    };

    const startTimer = () => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
        }
        
        progressAnim.setValue(1);
        setCountdown(5);
        
        Animated.timing(progressAnim, {
            toValue: 0,
            duration: TIMER_DURATION,
            useNativeDriver: false,
        }).start();

        const intervalId = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    setShowModal(false);
                    setTimeout(() => {
                        router.push('/login');
                    }, 300);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        intervalIdRef.current = intervalId;
    };

    const handleBack = () => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }
        router.back();
    };

    useEffect(() => {
        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
        };
    }, []);

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
                        <Text style={styles.mainTitle}>Forgot Password?</Text>
                    </View>

                    <View style={styles.section}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#B0B0B0"
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            !email.trim() && styles.loginButtonDisabled
                        ]}
                        activeOpacity={0.8}
                        onPress={handleResetPassword}
                        disabled={!email.trim()}
                    >
                        <Text style={styles.loginButtonText}>RESET PASSWORD</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.changePasswordLink}
                        onPress={handleChangePassword}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.changePasswordText}>
                            I have the link. Take me to change password
                        </Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </ScrollView>

            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                            <Text style={styles.modalTitle}>Password Recovery Link Sent!</Text>
                            <Text style={styles.modalSubtitle}>
                                Check your registered email for the password reset link
                            </Text>

                            <View style={styles.timerContainer}>
                                <Animated.View
                                    style={[
                                        styles.timerBar,
                                        {
                                            width: progressAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            }),
                                        },
                                    ]}
                                />
                            </View>

                            <Text style={styles.timerText}>
                                Redirecting to login in{' '}
                                <Text style={styles.timerBold}>{countdown}s</Text>
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#222',
        textAlign: 'left',
    },
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
    loginButton: {
        backgroundColor: '#111',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 16,
        opacity: 1,
    },
    loginButtonDisabled: { opacity: 0.5 },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    changePasswordLink: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    changePasswordText: {
        fontSize: 16,
        color: '#222',
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        margin: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalContent: { alignItems: 'center', gap: 16 },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111',
        textAlign: 'center',
        marginTop: 8,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    timerContainer: {
        height: 4,
        width: 200,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    timerBar: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    timerText: { fontSize: 15, color: '#666' },
    timerBold: { fontWeight: 'bold', color: '#111' },
});
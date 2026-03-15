// AccountActivation.jsx - With 30s countdown timer for resend

import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AccountActivation() {
  const [code, setCode] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    let interval;

    if (countdown > 0 && !canResend) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
      setCountdown(30);
    }

    return () => clearInterval(interval);
  }, [countdown, canResend]);

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
  };

  const handleConfirm = () => {
    const confirmationCode = code.join('');
    console.log('Code entered:', confirmationCode);
  };

  const handleResend = () => {
    setCanResend(false);
    console.log('Resend code requested');
    // Add your resend API call here
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>ZEAL</Text>

        <Text style={styles.title}>Account Confirmation</Text>
        <Text style={styles.subtitle}>
          Check your new incoming email{'\n'}and fill the confirmation code
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.codeInput}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              keyboardType="numeric"
              maxLength={1}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResend}
          disabled={!canResend}
          style={[
            styles.resendContainer,
            !canResend && styles.resendDisabled
          ]}
        >
          <Text
            style={[
              styles.resendText,
              !canResend && styles.resendCountdownText
            ]}
          >
            {!canResend ? `Re-send in ${countdown}s` : 'Re-send confirmation Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#333',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 40,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    width: '100%',
  },
  codeInput: {
    width: 68,
    height: 68,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 18,
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 24,
  },
  confirmText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 17,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  resendCountdownText: {
    color: '#999',
  },
  resendDisabled: {
    opacity: 0.6,
  },
});
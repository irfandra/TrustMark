import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';


export default function AuthenticityCheckScreen() {
  const steps = [
    { id: 1, title: 'Select NFT Items', button: '+ Select NFT' },
    { id: 2, title: 'Scan Product Labels', button: '+ Scan Product Labels' },
    { id: 3, title: 'Scan Physical Certificate', button: '+ Scan Physical Certificate' },
    { id: 4, title: 'Finish & Check Result', button: 'Check Result' },
  ];

  return (
    <ScrollView style={styles.container}>

    
      {/* Header */}
      <Text style={styles.title}>Authenticity Check</Text>

      {/* Steps */}
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepSection}>
          <View style={styles.row}>
            <View style={styles.circle}>
              <Text style={styles.circleText}>{step.id}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.buttonText}>{step.button}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {index !== steps.length - 1 && <View style={styles.connector} />}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 30,
  },
  stepSection: {
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    marginLeft: 15,
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  connector: {
    height: 35,
    width: 2,
    backgroundColor: '#ccc',
    marginLeft: 17,
    marginTop: 5,
  },
});

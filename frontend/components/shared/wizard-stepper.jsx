import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WizardStepper({ steps, palette }) {
  return (
    <View style={styles.stepRow}>
      {steps.map((step, index) => {
        const isActive = Boolean(step.active);

        return (
          <React.Fragment key={step.key || String(step.number || index)}>
            <TouchableOpacity
              style={[styles.stepCircle, isActive ? styles.stepActive : styles.stepInactive, {
                backgroundColor: isActive ? palette.accent : palette.accentSoft,
              }]}
              activeOpacity={isActive ? 1 : 0.85}
              disabled={isActive || !step.onPress}
              onPress={step.onPress}
              accessibilityRole="button"
            >
              <Text style={[styles.stepNumber, { color: isActive ? '#fff' : palette.text }]}>
                {step.number}
              </Text>
            </TouchableOpacity>
            <View style={styles.stepTextWrap}>
              <Text style={[styles.stepLabel, { color: isActive ? palette.text : palette.muted }]}>Setup</Text>
              <Text style={[styles.stepLabel, { color: isActive ? palette.text : palette.muted }]}>{step.label}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 10,
    flexWrap: 'wrap',
  },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    opacity: 1,
  },
  stepInactive: {
    opacity: 1,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepTextWrap: {
    marginRight: 20,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
});

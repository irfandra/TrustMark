import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../constants/styles/wizard-stepper-styles';

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


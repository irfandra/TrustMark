import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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

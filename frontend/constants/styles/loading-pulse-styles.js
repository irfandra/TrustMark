import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#111',
  },
  text: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
});

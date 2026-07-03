import { View, Text, StyleSheet } from 'react-native';

export default function FeatureRow({ label, included = true }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.icon, { color: included ? '#6366f1' : '#cbd5e1' }]}>
        {included ? '✓' : '✕'}
      </Text>
      <Text style={[styles.label, { color: included ? '#334155' : '#94a3b8' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  icon: {
    fontSize: 14,
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
});

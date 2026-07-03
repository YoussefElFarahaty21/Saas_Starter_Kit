import { View, Text, StyleSheet } from 'react-native';

const BADGE_CONFIG = {
  free: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: 'Free' },
  pro: { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd', label: 'Pro' },
  enterprise: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', label: 'Enterprise' },
};

export default function PlanBadge({ plan = 'free', size = 'sm' }) {
  const cfg = BADGE_CONFIG[plan] || BADGE_CONFIG.free;
  const isLg = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          paddingVertical: isLg ? 6 : 3,
          paddingHorizontal: isLg ? 14 : 10,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: cfg.text,
            fontSize: isLg ? 13 : 11,
          },
        ]}
      >
        {cfg.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

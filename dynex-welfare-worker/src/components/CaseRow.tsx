import React from 'react';
import { format } from 'date-fns';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GrievanceMasterRow } from '../types/database';
import { colors, fontSize, radius, spacing, statusColors } from '../theme';
import { useLanguage, localizeCategory, localizeStatus } from '../context/LanguageContext';

// One row of the tabular case list shared by the Dashboard's "recent
// cases" table and the full My Cases screen -- same four columns
// (reference / category / status / date) in both places so the two
// screens read as one consistent system rather than two different UIs.
export default function CaseRow({
  item,
  onPress,
}: {
  item: GrievanceMasterRow;
  onPress: () => void;
}) {
  const { strings } = useLanguage();
  const statusColor = statusColors[item.status] ?? colors.textMuted;
  let shortDate = item.date_received;
  try {
    shortDate = format(new Date(item.date_received), 'MMM d');
  } catch {
    // keep the raw value if it doesn't parse
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.colRef}>
        <Text style={styles.refNo} numberOfLines={1}>
          {item.grievance_id}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {localizeCategory(strings, item.category)}
        </Text>
      </View>
      <View style={styles.colStatus}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
          {localizeStatus(strings, item.status)}
        </Text>
      </View>
      <Text style={styles.colDate} numberOfLines={1}>
        {shortDate}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  rowPressed: { backgroundColor: colors.bg },
  colRef: { flex: 1.3, paddingRight: spacing.xs },
  refNo: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  category: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  colStatus: { flex: 1.1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: fontSize.xs, fontWeight: '700' },
  colDate: { flex: 0.75, fontSize: fontSize.xs, color: colors.textFaint, textAlign: 'right' },
});

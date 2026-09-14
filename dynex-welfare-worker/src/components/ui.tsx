import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, radius, spacing, fontSize } from '../theme';

// Every screen renders inside this instead of a bare `View`/`ScrollView` so
// its content is always inset from the status bar / notch at the top.
// Screens that live inside a bottom-tab navigator already have their
// bottom edge kept clear by the tab bar itself, so `edges` defaults to
// just `['top']` -- pass `['top', 'bottom']` for screens that sit outside
// the tab navigator (the auth flow) with nothing else reserving that space.
export function Screen({
  children,
  style,
  edges = ['top'],
}: {
  children: React.ReactNode;
  style?: any;
  edges?: Edge[];
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.screenRoot, style]}>
      {children}
    </SafeAreaView>
  );
}

// A single stat in a `StatRow` -- a big number over a short label, used on
// the dashboard to summarize a worker's cases at a glance.
export function StatTile({
  value,
  label,
  color = colors.text,
}: {
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.statRow}>{children}</View>;
}

// Column headings for the tabular case lists (Dashboard's "recent cases"
// and the full My Cases list share this same row shape). The three flex
// ratios below intentionally mirror `CaseRow`'s own column widths so the
// header lines up with the data underneath it.
export function TableHeader({ columns }: { columns: [string, string, string] }) {
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.colRef]} numberOfLines={1}>
        {columns[0]}
      </Text>
      <Text style={[styles.tableHeaderText, styles.colStatus]} numberOfLines={1}>
        {columns[1]}
      </Text>
      <Text style={[styles.tableHeaderText, styles.colDate]} numberOfLines={1}>
        {columns[2]}
      </Text>
    </View>
  );
}

export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={styles.centerFill}>
      <ActivityIndicator color={colors.brand} size="large" />
      {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.centerFill}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '1A', borderColor: color + '40' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.brand : '#fff'} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.buttonTextSecondary,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      style={[styles.input, props.multiline && styles.inputMultiline, props.style]}
      {...props}
    />
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: colors.bg },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  statValue: { fontSize: fontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  tableHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  colRef: { flex: 1.3 },
  colStatus: { flex: 1.1 },
  colDate: { flex: 0.75, textAlign: 'right' },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingLabel: { marginTop: spacing.md, color: colors.textMuted, fontSize: fontSize.sm },
  errorTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  errorMessage: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  retryButton: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: fontSize.sm },
  badge: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: colors.brand },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  buttonDanger: { backgroundColor: colors.danger },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  buttonTextSecondary: { color: colors.text },
  field: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
});

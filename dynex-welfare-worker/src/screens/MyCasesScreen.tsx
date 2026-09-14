import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { fetchMyGrievances } from '../lib/api';
import type { GrievanceMasterRow } from '../types/database';
import CaseRow from '../components/CaseRow';
import { ErrorView, LoadingView, PrimaryButton, TableHeader } from '../components/ui';
import { colors, fontSize, spacing } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import type { CasesStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<CasesStackParamList, 'MyCases'>;

export default function MyCasesScreen() {
  const navigation = useNavigation<Nav>();
  const { strings } = useLanguage();
  const [rows, setRows] = useState<GrievanceMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchMyGrievances();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load your cases.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // This screen sits inside a native-stack navigator with its own header
  // (see CasesNavigator/HomeNavigator), which already insets its content
  // below the status bar -- so, unlike the headerless tab screens, it
  // uses a plain View rather than the `Screen` safe-area wrapper.
  if (loading && rows.length === 0) {
    return (
      <View style={styles.root}>
        <LoadingView label={strings.common.loading} />
      </View>
    );
  }
  if (error && rows.length === 0) {
    return (
      <View style={styles.root}>
        <ErrorView message={error} onRetry={() => load()} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        style={styles.screen}
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brand} />
        }
        ListHeaderComponent={
          rows.length > 0 ? (
            <TableHeader
              columns={[strings.dashboard.colRef, strings.dashboard.colStatus, strings.dashboard.colDate]}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <CaseRow item={item} onPress={() => navigation.navigate('CaseDetail', { id: item.id })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{strings.myCases.empty}</Text>
            <View style={{ height: spacing.lg }} />
            <PrimaryButton
              label={strings.myCases.reportIssue}
              onPress={() => navigation.getParent()?.navigate('Submit' as never)}
            />
          </View>
        }
        ListFooterComponent={
          rows.length > 0 ? <Text style={styles.hint}>{strings.myCases.refreshHint}</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
  list: { padding: spacing.md, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl * 2, paddingHorizontal: spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center' },
  hint: { textAlign: 'center', color: colors.textFaint, fontSize: fontSize.xs, marginTop: spacing.md },
});

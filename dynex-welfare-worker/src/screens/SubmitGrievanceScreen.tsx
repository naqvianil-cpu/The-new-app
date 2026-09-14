import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage, localizeCategory, localizePriority } from '../context/LanguageContext';
import { useLookups } from '../context/LookupsContext';
import { submitGrievance, uploadEvidencePhoto } from '../lib/api';
import { Chip, Field, PrimaryButton, Screen, TextField } from '../components/ui';
import { colors, fontSize, radius, spacing } from '../theme';
import type { TabParamList } from '../navigation/types';

type Nav = BottomTabNavigationProp<TabParamList, 'Submit'>;

const CONFIDENTIALITY_OPTIONS = (strings: ReturnType<typeof useLanguage>['strings']) =>
  [
    { value: 'standard' as const, label: strings.submit.confidentialityStandard },
    { value: 'confidential' as const, label: strings.submit.confidentialityConfidential },
    { value: 'anonymous' as const, label: strings.submit.confidentialityAnonymous },
  ];

// A numbered section heading -- gives the single scrolling form a clear
// step-by-step shape (details, then evidence, then review & submit)
// without the added complexity of an actual multi-page wizard.
function SectionHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{step}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export default function SubmitGrievanceScreen() {
  const navigation = useNavigation<Nav>();
  const { worker } = useAuth();
  const { strings, lang, isRTL } = useLanguage();
  const { lookups } = useLookups();

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priorityId, setPriorityId] = useState<number | null>(null);
  const [confidentiality, setConfidentiality] = useState<'standard' | 'confidential' | 'anonymous'>(
    'standard'
  );
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lookups || !worker) return null;

  const canSubmit = categoryId && description.trim().length > 0;

  const addPhoto = (asset: ImagePicker.ImagePickerAsset) => {
    setPhotos((prev) => [...prev, asset]);
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) addPhoto(result.assets[0]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) addPhoto(result.assets[0]);
  };

  const resetForm = () => {
    setCategoryId(null);
    setPriorityId(null);
    setConfidentiality('standard');
    setDescription('');
    setPhotos([]);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !worker.project_id) return;
    setSubmitting(true);
    setError(null);
    try {
      const grievance = await submitGrievance({
        projectId: worker.project_id,
        categoryId,
        description: description.trim(),
        confidentiality,
        priorityId: priorityId ?? undefined,
        language: lang,
      });

      // The case itself is the thing that matters -- if a photo fails to
      // upload after the case was already created successfully, that's a
      // secondary problem worth surfacing, not a reason to tell the
      // worker their report failed.
      let failedPhotos = 0;
      for (const asset of photos) {
        try {
          await uploadEvidencePhoto({
            workerId: worker.id,
            grievanceId: grievance.id,
            localUri: asset.uri,
            fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
            mimeType: asset.mimeType ?? 'image/jpeg',
          });
        } catch {
          failedPhotos += 1;
        }
      }

      const message =
        failedPhotos > 0
          ? `${strings.submit.successMessage} (${failedPhotos} ${strings.evidence.uploadError})`
          : strings.submit.successMessage;

      Alert.alert(strings.submit.successTitle, `${grievance.reference_no}: ${message}`, [
        {
          text: strings.common.ok,
          onPress: () => {
            resetForm();
            navigation.navigate('Cases', { screen: 'MyCases' });
          },
        },
      ]);
    } catch (e: any) {
      setError(e?.message ?? strings.submit.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  const textAlign = isRTL ? 'right' : 'left';

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>{strings.submit.title}</Text>
          <Text style={styles.subheading}>{strings.submit.subtitle}</Text>

          <View style={styles.card}>
            <SectionHeader step={1} title={strings.submit.description} />

            <Field label={strings.submit.category} required>
              <View style={styles.chipWrap}>
                {lookups.categories.map((c) => (
                  <Chip
                    key={c.id}
                    label={localizeCategory(strings, c.name)}
                    active={categoryId === c.id}
                    onPress={() => setCategoryId(c.id)}
                  />
                ))}
              </View>
            </Field>

            <Field label={strings.submit.urgency}>
              <View style={styles.chipWrap}>
                {lookups.priorities.map((p) => (
                  <Chip
                    key={p.id}
                    label={localizePriority(strings, p.name)}
                    active={priorityId === p.id}
                    onPress={() => setPriorityId(p.id)}
                  />
                ))}
              </View>
            </Field>

            <Field label={strings.submit.confidentiality}>
              <View style={styles.chipWrap}>
                {CONFIDENTIALITY_OPTIONS(strings).map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    active={confidentiality === o.value}
                    onPress={() => setConfidentiality(o.value)}
                  />
                ))}
              </View>
            </Field>

            <Field label={strings.submit.description} required>
              <TextField
                value={description}
                onChangeText={setDescription}
                placeholder={strings.submit.descriptionPlaceholder}
                multiline
                numberOfLines={6}
                style={{ textAlign, minHeight: 120 }}
              />
            </Field>
          </View>

          <View style={styles.card}>
            <SectionHeader step={2} title={strings.evidence.title} subtitle={strings.evidence.submitHint} />

            <View style={styles.actionsRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <PrimaryButton label={strings.evidence.takePhoto} onPress={takePhoto} variant="secondary" />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={strings.evidence.chooseFromLibrary}
                  onPress={pickFromLibrary}
                  variant="secondary"
                />
              </View>
            </View>

            {photos.length > 0 ? (
              <View style={styles.thumbRow}>
                {photos.map((p) => (
                  <View key={p.uri} style={styles.thumbWrap}>
                    <Image source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
                    <Pressable style={styles.thumbRemove} onPress={() => removePhoto(p.uri)} hitSlop={8}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <SectionHeader step={3} title={strings.submit.submitButton} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={strings.submit.submitButton}
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
            />
          </View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  heading: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  subheading: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 19 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg, gap: spacing.sm },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: '#fff', fontWeight: '800', fontSize: fontSize.xs },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  sectionSubtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  error: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row' },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  thumbWrap: { width: 72, height: 72 },
  thumb: { width: '100%', height: '100%', borderRadius: radius.md, backgroundColor: colors.bg },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { isAdmin as isAdminUser, canEnableListings } from '../../lib/access';
import { normalizeListingRecord } from '../../lib/listingHelpers';
import {
  stepsFor, toFormState, toPayload, validateSpace, emptySpace, emptyManagedOffice, emptyPg, emptyPrivateOffice,
} from '../../lib/spaceForm';
import { VERTICALS } from '../../constants/inventory';
import { colors } from '../../constants/theme';
import LoadingScreen from '../ui/LoadingScreen';
import {
  BasicsStep, LocationStep, PlansStep, HoursStep, AmenitiesStep, PhotosStep, ContactsStep, AboutStep, SeoStep,
} from './steps';
import { MoBasicsStep, MoLocationStep, MoPlansStep, BuildingStep } from './moSteps';
import { PoBasicsStep, PoFacilitiesStep } from './poSteps';
import {
  PgBasicsStep, PgLocationStep, PgRoomsStep, PgServicesStep, PgAmenitiesStep, PgAboutStep,
} from './pgSteps';

const STEP_VIEWS = {
  basics: BasicsStep,
  location: LocationStep,
  plans: PlansStep,
  hours: HoursStep,
  amenities: AmenitiesStep,
  photos: PhotosStep,
  contacts: ContactsStep,
  about: AboutStep,
  seo: SeoStep,
  moBasics: MoBasicsStep,
  moLocation: MoLocationStep,
  moPlans: MoPlansStep,
  building: BuildingStep,
  poBasics: PoBasicsStep,
  poFacilities: PoFacilitiesStep,
  pgBasics: PgBasicsStep,
  pgLocation: PgLocationStep,
  pgRooms: PgRoomsStep,
  pgServices: PgServicesStep,
  pgAmenities: PgAmenitiesStep,
  pgAbout: PgAboutStep,
};

const NO_OPTIONS = { brands: [], amenities: [], planTypes: [], countries: [], spaceTags: [], durations: [], statuses: [] };

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/browser');
}

/**
 * Add or edit a website coworking space, managed office or PG, step by step.
 * `spaceId` = edit (the section comes from the record), none = add a `vertical`.
 */
export default function SpaceEditor({ spaceId, vertical: addVertical = 'coworking' }) {
  const isEdit = Boolean(spaceId);
  const { user } = useAuth();
  const admin = isAdminUser(user);
  const canEnable = canEnableListings(user);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const spaceQ = useQuery({
    queryKey: ['space-edit', spaceId],
    queryFn: () => mobileApi.getSpaceForEdit(spaceId),
    enabled: isEdit,
    gcTime: 0,
  });
  const vertical = isEdit
    ? spaceQ.data?.vertical || 'coworking'
    : ['managed-office', 'coliving', 'private-office'].includes(addVertical) ? addVertical : 'coworking';
  const V = VERTICALS[vertical];
  const mo = vertical === 'managed-office';
  const pg = vertical === 'coliving';
  const po = vertical === 'private-office';
  const what = mo ? 'managed office' : pg ? 'PG' : po ? 'private office' : 'coworking space';
  const STEPS = stepsFor(vertical);
  const optionsQ = useQuery({
    queryKey: ['space-editor-options', vertical],
    queryFn: () => mobileApi.getSpaceEditorOptions(vertical),
    staleTime: 10 * 60e3,
    enabled: !isEdit || Boolean(spaceQ.data),
  });

  const [form, setForm] = useState(() => (isEdit ? null : toFormState(
    mo ? emptyManagedOffice() : pg ? emptyPg() : po ? emptyPrivateOffice() : emptySpace(),
  )));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const original = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: `${isEdit ? 'Edit' : 'Add'} ${what}` });
  }, [navigation, isEdit, what]);

  useEffect(() => {
    if (isEdit && spaceQ.data && !form) {
      original.current = spaceQ.data;
      setForm(toFormState(spaceQ.data));
    }
  }, [isEdit, spaceQ.data, form]);

  // New spaces default to India when it's in the list.
  useEffect(() => {
    if (isEdit || !optionsQ.data || !form || form.location.country) return;
    const india = optionsQ.data.countries.find((c) => /^india$/i.test(c.name));
    if (india) {
      setForm((p) => ({
        ...p,
        location: { ...p.location, country: india.id },
        labels: { ...p.labels, country: india.name },
        // Managed office plans default to the "Office Space" category, as in the admin panel.
        ...(mo && optionsQ.data.defaultPlanType
          ? { plans: p.plans.map((pl) => ({ ...pl, type: pl.type || optionsQ.data.defaultPlanType })) }
          : {}),
      }));
    }
  }, [isEdit, optionsQ.data, form]);

  // New coworking spaces start with the common amenities ticked (set in the admin amenity list).
  const amenityDefaultsApplied = useRef(false);
  useEffect(() => {
    if (isEdit || mo || pg || po || !form || amenityDefaultsApplied.current) return;
    const defaults = optionsQ.data?.defaultAmenities;
    if (!Array.isArray(defaults)) return;
    amenityDefaultsApplied.current = true;
    if (defaults.length && !(form.amenities || []).length) setForm((p) => ({ ...p, amenities: [...defaults] }));
  }, [isEdit, mo, pg, optionsQ.data, form]);

  const update = useCallback((fn) => {
    setDirty(true);
    setError('');
    setForm((p) => (typeof fn === 'function' ? fn(p) : fn));
  }, []);
  const patch = useCallback((key, value, extra) => update((p) => ({ ...p, [key]: value, ...(extra || {}) })), [update]);

  // Ask before throwing away unsaved changes.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || saveMutation.isPending || saveMutation.isSuccess) return;
      e.preventDefault();
      Alert.alert('Discard changes?', `Your changes to this ${mo || po ? 'office' : pg ? 'PG' : 'space'} are not saved.`, [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { ...toPayload(form, original.current), vertical };
      return isEdit ? mobileApi.updateSpace(spaceId, body) : mobileApi.createSpace(body);
    },
    onSuccess: async (saved) => {
      const listing = normalizeListingRecord(saved);
      const id = listing?.id || spaceId;
      queryClient.setQueryData(['listing', id], listing);
      queryClient.removeQueries({ queryKey: ['space-edit', id] });
      await queryClient.invalidateQueries({ queryKey: ['listings'] });
      setDirty(false);
      if (isEdit) {
        Alert.alert('Saved', po ? 'Changes are saved.' : 'Changes are saved. The website shows them right away.', [{ text: 'OK', onPress: leave }]);
      } else {
        const live = listing?.status?.key === 'approved';
        const where = po ? 'Inventory' : 'the website';
        Alert.alert(
          mo ? 'Managed office added' : pg ? 'PG added' : po ? 'Private office added' : 'Space added',
          live ? `It is live on ${where}.` : `Saved as ${pg ? 'In progress' : 'Pending'}. ${canEnable ? 'Approve it from the listing page to put it live.' : `It goes live on ${where} once someone allowed to enable properties approves it.`}`,
          [{ text: mo || po ? 'View office' : pg ? 'View PG' : 'View space', onPress: () => router.replace(`/(tabs)/browser/${id}`) }],
        );
      }
    },
    onError: (err) => {
      setError(err.message || 'Could not save.');
      Alert.alert('Not saved', err.message || 'Could not save.');
    },
  });

  if (!optionsQ.data || (isEdit && spaceQ.isLoading) || !form) {
    if (optionsQ.error || spaceQ.error) {
      return <LoadingScreen label={(optionsQ.error || spaceQ.error)?.message || 'Could not open the space'} />;
    }
    return <LoadingScreen label={isEdit ? 'Opening…' : 'Preparing form…'} />;
  }

  const options = optionsQ.data || NO_OPTIONS;
  const current = STEPS[step];
  const View_ = STEP_VIEWS[current.key];
  const uploading = form.photos.some((p) => p.uploading);
  const saving = saveMutation.isPending;
  const last = step === STEPS.length - 1;

  const goTo = (i) => {
    setStep(i);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const save = () => {
    if (uploading) {
      Alert.alert('Photos still uploading', 'Wait for the photos to finish uploading, then save.');
      return;
    }
    const problem = validateSpace(form);
    if (problem) {
      setError(problem.message);
      goTo(problem.step);
      return;
    }
    saveMutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { backgroundColor: V.color, width: `${Math.round(((step + 1) / STEPS.length) * 100)}%` }]} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rail} contentContainerStyle={s.railContent}>
        {STEPS.map((st, i) => (
          <Pressable key={st.key} style={[s.stepChip, i === step && { backgroundColor: V.soft, borderColor: V.color }]} onPress={() => goTo(i)}>
            <Ionicons name={st.icon} size={14} color={i === step ? V.color : colors.muted} />
            <Text style={[s.stepChipText, i === step && { color: V.color }]}>{st.short}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView ref={scrollRef} style={s.flex} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <View style={s.head}>
          <View style={[s.vPill, { backgroundColor: V.soft }]}>
            <Ionicons name={V.icon} size={13} color={V.color} />
            <Text style={[s.vPillText, { color: V.color }]}>{V.label}</Text>
          </View>
          <Text style={[s.stepCount, { color: V.color }]}>Step {step + 1} of {STEPS.length}</Text>
          <Text style={s.title}>{current.title}</Text>
          <Text style={s.sub}>{current.sub}</Text>
        </View>
        {error ? (
          <View style={s.error}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}
        <View_
          form={form}
          setForm={update}
          patch={patch}
          options={options}
          isEdit={isEdit}
          isAdmin={admin}
          canEnable={canEnable}
        />
      </ScrollView>

      <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
        {step > 0 ? (
          <Pressable style={s.backBtn} onPress={() => goTo(step - 1)} disabled={saving}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
          </Pressable>
        ) : null}
        {!last ? (
          <Pressable style={[s.nextBtn, !isEdit && { backgroundColor: V.color, borderColor: V.color }]} onPress={() => goTo(step + 1)} disabled={saving}>
            <Text style={[s.nextText, !isEdit && { color: '#fff' }]}>Next: {STEPS[step + 1].short}</Text>
            <Ionicons name="chevron-forward" size={16} color={isEdit ? colors.ink : '#fff'} />
          </Pressable>
        ) : null}
        {isEdit || last ? (
          <Pressable style={[s.saveBtn, { backgroundColor: V.color }, (saving || uploading) && s.off]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle" size={18} color="#fff" />}
            <Text style={s.saveText}>{saving ? 'Saving…' : isEdit ? 'Save' : mo || po ? 'Add office' : pg ? 'Add PG' : 'Add space'}</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface2 },
  progressTrack: { height: 4, backgroundColor: colors.border },
  progressFill: { height: 4, backgroundColor: colors.brand },
  rail: { maxHeight: 52, flexGrow: 0, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  railContent: { paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  stepChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  stepChipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  stepChipText: { fontSize: 12.5, fontWeight: '700', color: colors.muted },
  stepChipTextOn: { color: colors.brandInk },
  body: { padding: 16, paddingBottom: 40 },
  head: { marginBottom: 16 },
  vPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  vPillText: { fontSize: 12, fontWeight: '800' },
  stepCount: { fontSize: 12, fontWeight: '800', color: colors.brandInk, textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 4 },
  sub: { fontSize: 13.5, color: colors.muted, marginTop: 3 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12,
    backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#F3C4C4', marginBottom: 14,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 13.5, fontWeight: '600' },
  footer: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  backBtn: {
    width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  primary: { backgroundColor: colors.brand, borderColor: colors.brand },
  nextText: { fontWeight: '800', color: colors.ink, fontSize: 14.5 },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: colors.brand,
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  off: { opacity: 0.6 },
});

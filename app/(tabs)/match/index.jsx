import { useCallback, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileApi } from '../../../lib/api';
import { useProposal } from '../../../context/ProposalContext';
import RequireScreen from '../../../components/RequireScreen';
import MatchCard from '../../../components/ui/MatchCard';
import { colors } from '../../../constants/theme';
import {
  SAMPLE_ENQUIRY, INITIAL_REQ, reqToApi, apiToReq, parseSourceLabel,
} from '../../../constants/match';
import { inr } from '@spacehaat/utils';

export default function SmartMatchScreen() {
  const insets = useSafeAreaInsets();
  const [enquiry, setEnquiry] = useState(SAMPLE_ENQUIRY);
  const [matchReq, setMatchReq] = useState(INITIAL_REQ);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [parseSource, setParseSource] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isParsing, setIsParsing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [isAddingProposal, setIsAddingProposal] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const { addManyToProposal } = useProposal();

  const runMatch = useCallback(async ({ enquiryText, requirements } = {}) => {
    setIsMatching(true);
    try {
      const payload = { limit: 12 };
      if (enquiryText?.trim()) payload.enquiry = enquiryText.trim();
      if (requirements) payload.requirements = reqToApi(requirements);

      const data = await mobileApi.smartMatch(payload);
      setResults(data.matches || []);
      setMeta(data.meta || null);
      setParseSource(data.parseSource || null);
      if (data.requirements) setMatchReq(apiToReq(data.requirements));
      setHasRun(true);
      setSelectedIds(new Set());
    } catch (err) {
      Alert.alert('Match failed', err.message || 'Could not run Smart Match');
    } finally {
      setIsMatching(false);
    }
  }, []);

  const parseEnquiry = async () => {
    if (!enquiry.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await mobileApi.smartMatchParse(enquiry.trim());
      const next = apiToReq(parsed.requirements);
      setMatchReq(next);
      setParseSource(parsed.source);
      await runMatch({ enquiryText: enquiry, requirements: next });
    } catch (err) {
      Alert.alert('Parse failed', err.message || 'Could not parse enquiry');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createLeadFromMatch = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setIsCreatingLead(true);
    try {
      const lead = await mobileApi.createLeadFromMatch({
        enquiry: enquiry.trim(),
        city: matchReq.city,
        locality: matchReq.locality,
        teamSize: matchReq.teamSize,
        budgetPerSeat: matchReq.budgetPerSeat,
        moveIn: matchReq.moveIn,
        amenities: matchReq.amenities,
        spaceTypes: matchReq.spaceTypes,
        listingIds: ids,
      });
      Alert.alert('Lead created', `${lead.displayTitle || lead.name || 'Lead'} added to pipeline.`, [
        { text: 'View lead', onPress: () => router.push(`/(tabs)/leads/${lead.id}`) },
        { text: 'OK' },
      ]);
      setSelectedIds(new Set());
    } catch (err) {
      Alert.alert('Could not create lead', err.message);
    } finally {
      setIsCreatingLead(false);
    }
  };

  const addToProposalFromMatch = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setIsAddingProposal(true);
    try {
      const { added } = await addManyToProposal(ids);
      Alert.alert(
        'Added to proposal',
        added ? `${added} space${added === 1 ? '' : 's'} added to your proposal draft.` : 'All selected spaces are already in your proposal.',
        [
          { text: 'Open builder', onPress: () => router.push('/(tabs)/proposals/builder') },
          { text: 'OK' },
        ],
      );
      setSelectedIds(new Set());
    } catch (err) {
      Alert.alert('Could not add', err.message || 'Failed to update proposal');
    } finally {
      setIsAddingProposal(false);
    }
  };

  const busy = isParsing || isMatching || isCreatingLead || isAddingProposal;

  return (
    <RequireScreen screen="match">
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          Paste a client message — AI extracts requirements and ranks your inventory.
        </Text>

        <View style={styles.panel}>
          <Text style={styles.lab}>Client enquiry</Text>
          <TextInput
            style={styles.enquiryInput}
            multiline
            value={enquiry}
            onChangeText={setEnquiry}
            placeholder="Paste WhatsApp or email enquiry…"
            placeholderTextColor={colors.faint}
            textAlignVertical="top"
          />
          <View style={styles.actions}>
            {parseSource ? (
              <View style={styles.sourcePill}>
                <Ionicons name="sparkles" size={12} color={colors.brand} />
                <Text style={styles.sourceText}>{parseSourceLabel(parseSource)}</Text>
              </View>
            ) : <View />}
            <Pressable
              style={[styles.primaryBtn, (busy || !enquiry.trim()) && styles.btnOff]}
              disabled={busy || !enquiry.trim()}
              onPress={parseEnquiry}
            >
              {isParsing ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Parse & match</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {(matchReq.city || matchReq.teamSize > 0) ? (
          <View style={styles.summary}>
            {matchReq.city ? <Text style={styles.chip}>📍 {matchReq.locality ? `${matchReq.locality}, ` : ''}{matchReq.city}</Text> : null}
            {matchReq.teamSize > 0 ? <Text style={styles.chip}>👥 {matchReq.teamSize} seats</Text> : null}
            {matchReq.budgetPerSeat > 0 ? <Text style={styles.chip}>💰 ≤ {inr(matchReq.budgetPerSeat)}/seat</Text> : null}
            {matchReq.moveIn ? <Text style={styles.chip}>📅 {matchReq.moveIn}</Text> : null}
          </View>
        ) : null}

        <View style={styles.matchHead}>
          {hasRun ? (
            <Text style={styles.matchHeadText}>
              <Text style={styles.bold}>{results.length}</Text> ranked matches
              {meta ? ` · scored ${meta.totalScored} listings` : ''}
            </Text>
          ) : (
            <Text style={styles.matchHeadText}>Paste an enquiry and tap Parse & match.</Text>
          )}
          <Pressable
            style={[styles.secondaryBtn, busy && styles.btnOff]}
            disabled={busy}
            onPress={() => runMatch({ enquiryText: enquiry, requirements: matchReq })}
          >
            {isMatching ? <ActivityIndicator color={colors.brand} /> : (
              <>
                <Ionicons name="flash-outline" size={16} color={colors.brand} />
                <Text style={styles.secondaryBtnText}>Re-run</Text>
              </>
            )}
          </Pressable>
        </View>

        {busy && !results.length ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.emptyText}>Scoring inventory…</Text>
          </View>
        ) : null}

        {!busy && hasRun && !results.length ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={28} color={colors.faint} />
            <Text style={styles.emptyText}>No strong matches. Try widening budget or changing locality.</Text>
          </View>
        ) : null}

        {results.map((r) => (
          <MatchCard
            key={r.listing.id}
            match={r}
            selected={selectedIds.has(r.listing.id)}
            onPress={() => toggleSelected(r.listing.id)}
          />
        ))}
      </ScrollView>

      {selectedIds.size > 0 ? (
        <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.selectedCount}>{selectedIds.size} selected</Text>
          <Pressable style={styles.clearBtn} onPress={() => setSelectedIds(new Set())}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, styles.barBtn, isAddingProposal && styles.btnOff]}
            disabled={isAddingProposal}
            onPress={addToProposalFromMatch}
          >
            {isAddingProposal ? <ActivityIndicator color={colors.brand} /> : (
              <Text style={styles.secondaryBtnText}>Add to proposal</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, styles.createBtn, isCreatingLead && styles.btnOff]}
            disabled={isCreatingLead}
            onPress={createLeadFromMatch}
          >
            {isCreatingLead ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.primaryBtnText}>Create lead</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
    </RequireScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  intro: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 12 },
  panel: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  lab: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.faint, marginBottom: 8 },
  enquiryInput: {
    minHeight: 120, maxHeight: 180, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 12, fontSize: 14, color: colors.ink, backgroundColor: colors.surface2,
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  sourcePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  sourceText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.brand, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  btnOff: { opacity: 0.5 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    fontSize: 12, fontWeight: '600', color: colors.ink,
    backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
  },
  matchHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, gap: 8,
  },
  matchHeadText: { flex: 1, fontSize: 13, color: colors.muted },
  bold: { fontWeight: '800', color: colors.ink },
  empty: { alignItems: 'center', padding: 32, gap: 10 },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 14 },
  stickyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  selectedCount: { flex: 1, fontWeight: '700', color: colors.ink },
  clearBtn: { paddingVertical: 10, paddingHorizontal: 8 },
  clearBtnText: { color: colors.muted, fontWeight: '600' },
  createBtn: { justifyContent: 'center' },
  barBtn: { paddingHorizontal: 10 },
});

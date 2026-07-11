import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { mobileApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { coverNote } from '../lib/listingHelpers';

const ProposalContext = createContext(null);

function applyDraftState(draft, setters) {
  if (!draft) return;
  setters.setProposalIds(draft.listingIds || []);
  setters.setProposalTitle(draft.title || '');
  setters.setClient(draft.client || { name: '', company: '' });
  setters.setCoverNoteText(draft.coverNote || '');
  setters.setCoverNoteIdx(draft.coverNoteIdx ?? 0);
  setters.setLinkedLead(
    draft.leadId ? { id: draft.leadId, title: draft.leadTitle || '' } : null,
  );
}

export function ProposalProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [proposalIds, setProposalIds] = useState([]);
  const [proposalTitle, setProposalTitle] = useState('');
  const [client, setClient] = useState({ name: '', company: '' });
  const [coverNoteText, setCoverNoteText] = useState('');
  const [coverNoteIdx, setCoverNoteIdx] = useState(0);
  const [linkedLead, setLinkedLead] = useState(null);
  const [editingProposalId, setEditingProposalId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const coverNoteTimer = useRef(null);
  const titleTimer = useRef(null);

  const resetWorkspace = useCallback(() => {
    setProposalIds([]);
    setProposalTitle('');
    setClient({ name: '', company: '' });
    setCoverNoteText('');
    setCoverNoteIdx(0);
    setLinkedLead(null);
    setEditingProposalId(null);
    setLoaded(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      resetWorkspace();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await mobileApi.getProposalDraft();
        if (cancelled) return;
        applyDraftState(data?.draft, {
          setProposalIds,
          setProposalTitle,
          setClient,
          setCoverNoteText,
          setCoverNoteIdx,
          setLinkedLead,
        });
      } catch {
        // draft may not exist yet
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, resetWorkspace]);

  const applyProposalDraft = useCallback((draft, sourceProposalId = null) => {
    applyDraftState(draft, {
      setProposalIds,
      setProposalTitle,
      setClient,
      setCoverNoteText,
      setCoverNoteIdx,
      setLinkedLead,
    });
    setEditingProposalId(sourceProposalId || null);
  }, []);

  const addToProposal = useCallback(async (id, listingHint) => {
    if (proposalIds.includes(id)) return { ok: false, reason: 'already' };
    const prev = proposalIds;
    const nextIds = [...prev, id];
    setProposalIds(nextIds);
    try {
      await mobileApi.updateProposalDraft({ listingIds: nextIds });
      return { ok: true, listing: listingHint };
    } catch (e) {
      setProposalIds(prev);
      throw e;
    }
  }, [proposalIds]);

  const addManyToProposal = useCallback(async (ids) => {
    const unique = ids.filter((id) => !proposalIds.includes(id));
    if (!unique.length) return { added: 0 };
    const prev = proposalIds;
    const nextIds = [...prev, ...unique];
    setProposalIds(nextIds);
    try {
      await mobileApi.updateProposalDraft({ listingIds: nextIds });
      return { added: unique.length };
    } catch (e) {
      setProposalIds(prev);
      throw e;
    }
  }, [proposalIds]);

  const removeFromProposal = useCallback(async (id) => {
    const prev = proposalIds;
    const nextIds = prev.filter((x) => x !== id);
    setProposalIds(nextIds);
    try {
      await mobileApi.updateProposalDraft({ listingIds: nextIds });
    } catch (e) {
      setProposalIds(prev);
      throw e;
    }
  }, [proposalIds]);

  const reorderProposal = useCallback(async (ids) => {
    const prev = proposalIds;
    setProposalIds(ids);
    try {
      await mobileApi.updateProposalDraft({ listingIds: ids });
    } catch (e) {
      setProposalIds(prev);
      throw e;
    }
  }, [proposalIds]);

  const updateClient = useCallback(async (nextClient) => {
    setClient(nextClient);
    try {
      await mobileApi.updateProposalDraft({ client: nextClient });
    } catch {
      // local preview still works
    }
  }, []);

  const updateCoverNote = useCallback((text) => {
    setCoverNoteText(text);
    if (coverNoteTimer.current) clearTimeout(coverNoteTimer.current);
    coverNoteTimer.current = setTimeout(() => {
      mobileApi.updateProposalDraft({ coverNote: text }).catch(() => {});
    }, 600);
  }, []);

  const updateProposalTitle = useCallback((title) => {
    setProposalTitle(title);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      mobileApi.updateProposalDraft({ title }).catch(() => {});
    }, 500);
  }, []);

  const updateCoverNoteIdx = useCallback(async (idx, text) => {
    setCoverNoteIdx(idx);
    setCoverNoteText(text);
    try {
      await mobileApi.updateProposalDraft({ coverNoteIdx: idx, coverNote: text });
    } catch {
      // silent
    }
  }, []);

  const regenerateCoverNote = useCallback(async (itemCount) => {
    const nextIdx = (coverNoteIdx + 1) % 3;
    const text = coverNote(client, itemCount, nextIdx);
    await updateCoverNoteIdx(nextIdx, text);
    return text;
  }, [coverNoteIdx, client, updateCoverNoteIdx]);

  const loadStoredProposal = useCallback(async (id) => {
    const result = await mobileApi.loadProposalToDraft(id);
    applyProposalDraft(result.draft, result.sourceProposalId || id);
    return result;
  }, [applyProposalDraft]);

  const startDraftFromMatch = useCallback(async (ids, matchClient, lead) => {
    setProposalIds(ids);
    setClient(matchClient || { name: '', company: '' });
    setCoverNoteText('');
    setCoverNoteIdx(0);
    setLinkedLead(lead || null);
    setEditingProposalId(null);
    await mobileApi.updateProposalDraft({
      listingIds: ids,
      client: matchClient || { name: '', company: '' },
      coverNote: '',
      coverNoteIdx: 0,
      leadId: lead?.id || null,
    });
  }, []);

  const isInProposal = useCallback((id) => proposalIds.includes(id), [proposalIds]);

  const value = useMemo(() => ({
    loaded,
    proposalIds,
    proposalTitle,
    client,
    coverNoteText,
    coverNoteIdx,
    linkedLead,
    editingProposalId,
    proposalCount: proposalIds.length,
    isInProposal,
    addToProposal,
    addManyToProposal,
    removeFromProposal,
    reorderProposal,
    updateClient,
    updateCoverNote,
    updateProposalTitle,
    updateCoverNoteIdx,
    regenerateCoverNote,
    applyProposalDraft,
    loadStoredProposal,
    startDraftFromMatch,
    resetWorkspace,
    setEditingProposalId,
  }), [
    loaded, proposalIds, proposalTitle, client, coverNoteText, coverNoteIdx,
    linkedLead, editingProposalId, isInProposal, addToProposal, addManyToProposal,
    removeFromProposal, reorderProposal, updateClient, updateCoverNote,
    updateProposalTitle, updateCoverNoteIdx, regenerateCoverNote, applyProposalDraft,
    loadStoredProposal, startDraftFromMatch, resetWorkspace,
  ]);

  return (
    <ProposalContext.Provider value={value}>
      {children}
    </ProposalContext.Provider>
  );
}

export function useProposal() {
  const ctx = useContext(ProposalContext);
  if (!ctx) throw new Error('useProposal must be used within ProposalProvider');
  return ctx;
}

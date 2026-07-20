/**
 * @param {(path: string, opts?: { method?: string, body?: unknown, formData?: boolean }) => Promise<unknown>} request
 */
export function createApiMethods(request) {
  return {
    async login(email, password, platform) {
      const data = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email,
          password,
          ...(platform ? { platform } : {}),
        },
      });
      return data;
    },

    async loginMobile(email, password) {
      const data = await request('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password, platform: 'mobile' },
      });
      return data;
    },

    async logout(refreshToken) {
      await request('/api/v1/auth/logout', {
        method: 'POST',
        body: refreshToken ? { refreshToken } : {},
      });
    },

    async refresh(refreshToken) {
      const data = await request('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      return data;
    },

    async getMe() {
      return request('/api/v1/auth/me');
    },

    async listUsers() {
      const data = await request('/api/v1/users');
      return data.items || [];
    },

    async createUser(payload) {
      const data = await request('/api/v1/users', { method: 'POST', body: payload });
      return data.item;
    },

    async updateUser(id, payload) {
      const data = await request(`/api/v1/users/${id}`, { method: 'PATCH', body: payload });
      return data.item;
    },

    async listListings(filters = {}) {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '' || v === 'All' || v === 'All cities') return;
        if (Array.isArray(v)) {
          if (v.length) qs.set(k, v.join(','));
          return;
        }
        if (typeof v === 'boolean') {
          if (v) qs.set(k, 'true');
          return;
        }
        qs.set(k, String(v));
      });
      const q = qs.toString();
      return request(`/api/v1/listings${q ? `?${q}` : ''}`);
    },

    async getListing(id) {
      const data = await request(`/api/v1/listings/${id}`);
      return data.item;
    },

    async createListing(payload) {
      const data = await request('/api/v1/listings', { method: 'POST', body: payload });
      return data.item;
    },

    async updateListing(id, payload) {
      const data = await request(`/api/v1/listings/${id}`, { method: 'PATCH', body: payload });
      return data.item;
    },

    async verifyListing(id) {
      const data = await request(`/api/v1/listings/${id}/verify`, { method: 'POST' });
      return data.item;
    },

    async deleteListing(id) {
      const data = await request(`/api/v1/listings/${id}`, { method: 'DELETE' });
      return data;
    },

    async getProposalDraft() {
      return request('/api/v1/proposals/draft');
    },

    async updateProposalDraft(payload) {
      const data = await request('/api/v1/proposals/draft', { method: 'PATCH', body: payload });
      return data.draft;
    },

    async sendProposal(channel, sentBy = '', render = null, title = '', leadId = null) {
      const data = await request('/api/v1/proposals/draft/send', {
        method: 'POST',
        body: {
          channel,
          sentBy,
          ...(render ? { render } : {}),
          ...(title ? { title } : {}),
          ...(leadId ? { leadId } : {}),
        },
      });
      return data;
    },

    async generateProposalPdf(render = null, title = '', updateProposalId = null, leadId = null) {
      const data = await request('/api/v1/proposals/draft/pdf', {
        method: 'POST',
        body: {
          ...(render ? { render } : {}),
          ...(title ? { title } : {}),
          ...(updateProposalId ? { updateProposalId } : {}),
          ...(leadId ? { leadId } : {}),
        },
      });
      return data;
    },

    async listProposals({ page = 1, limit = 15, search = '' } = {}) {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      return request(`/api/v1/proposals?${params}`);
    },

    async getProposal(id) {
      const data = await request(`/api/v1/proposals/${id}`);
      return data.item;
    },

    async loadProposalToDraft(id) {
      const data = await request(`/api/v1/proposals/${id}/load-draft`, { method: 'POST' });
      return data;
    },

    async createProposalShareLink(id) {
      return request(`/api/v1/proposals/${id}/share-link`, { method: 'POST' });
    },

    async markProposalFeedbackSeen(id) {
      return request(`/api/v1/proposals/${id}/feedback/seen`, { method: 'POST' });
    },

    async getPublicProposal(token) {
      return request(`/api/v1/public/proposals/${token}`);
    },

    async updatePublicProposal(token, payload) {
      return request(`/api/v1/public/proposals/${token}`, { method: 'PATCH', body: payload });
    },

    async listActivity(limit = 20) {
      const data = await request(`/api/v1/activity?limit=${limit}`);
      return data.items || [];
    },

    async getDashboardStats() {
      const data = await request('/api/v1/dashboard/stats');
      return data.stats;
    },

    async smartMatchParse(enquiry) {
      const data = await request('/api/v1/smart-match/parse', {
        method: 'POST',
        body: { enquiry },
      });
      return data;
    },

    async smartMatch(payload) {
      const data = await request('/api/v1/smart-match', {
        method: 'POST',
        body: payload,
      });
      return data;
    },

    async listLeads({
      page = 1,
      limit = 20,
      search = '',
      stage = '',
      status = '',
      city = '',
      assignee = '',
      source = '',
      dateFrom = '',
      dateTo = '',
    } = {}) {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      const stageFilter = stage || status;
      if (stageFilter) params.set('stage', stageFilter);
      if (city && city !== 'All cities') params.set('city', city);
      if (assignee) params.set('assignee', assignee);
      if (source) params.set('source', source);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return request(`/api/v1/leads?${params}`);
    },

    async listLeadAssignees(city = '') {
      const params = new URLSearchParams();
      if (city && city !== 'All cities') params.set('city', city);
      const q = params.toString();
      return request(`/api/v1/leads/assignees${q ? `?${q}` : ''}`);
    },

    async getLead(id) {
      const data = await request(`/api/v1/leads/${id}`);
      return data.item;
    },

    async createLead(payload) {
      const data = await request('/api/v1/leads', { method: 'POST', body: payload });
      return data.item;
    },

    async parseLead(enquiry) {
      return request('/api/v1/leads/parse', {
        method: 'POST',
        body: { enquiry },
      });
    },

    async createLeadFromMatch(payload) {
      const data = await request('/api/v1/leads/from-match', { method: 'POST', body: payload });
      return data.item;
    },

    async updateLead(id, payload) {
      const data = await request(`/api/v1/leads/${id}`, { method: 'PATCH', body: payload });
      return data.item;
    },

    async deleteLead(id) {
      return request(`/api/v1/leads/${id}`, { method: 'DELETE' });
    },

    async addLeadNote(id, text) {
      const data = await request(`/api/v1/leads/${id}/notes`, { method: 'POST', body: { text } });
      return data.item;
    },

    async setLeadReminder(id, { dueAt, note }) {
      const data = await request(`/api/v1/leads/${id}/reminder`, {
        method: 'POST',
        body: { dueAt, ...(note ? { note } : {}) },
      });
      return data.item;
    },

    async listRecentClients() {
      const data = await request('/api/v1/clients/recent');
      return data.items || [];
    },

    async uploadImages(files, listingId) {
      const form = new FormData();
      [...files].forEach((file) => form.append('images', file));
      if (listingId) form.append('listingId', String(listingId));

      const data = await request('/api/v1/uploads/images', {
        method: 'POST',
        body: form,
        formData: true,
      });
      return data.items || [];
    },

    async registerDevice({ token, platform }) {
      await request('/api/v1/devices/register', {
        method: 'POST',
        body: { token, platform },
      });
    },

    async unregisterDevice(token) {
      await request('/api/v1/devices/unregister', {
        method: 'POST',
        body: { token },
      });
    },
  };
}

/**
 * Legacy web export names mapped onto createApiMethods.
 * @param {(path: string, opts?: object) => Promise<unknown>} request
 */
export function bindLegacyApiExports(request) {
  const m = createApiMethods(request);

  return {
    apiLogin: async (email, password) => {
      const data = await m.login(email, password);
      return data.user;
    },
    apiLogout: () => m.logout(),
    apiGetMe: () => m.getMe(),
    apiListUsers: () => m.listUsers(),
    apiCreateUser: (payload) => m.createUser(payload),
    apiUpdateUser: (id, payload) => m.updateUser(id, payload),
    apiListListings: (filters) => m.listListings(filters),
    apiGetListing: (id) => m.getListing(id),
    apiCreateListing: (payload) => m.createListing(payload),
    apiUpdateListing: (id, payload) => m.updateListing(id, payload),
    apiVerifyListing: (id) => m.verifyListing(id),
    apiDeleteListing: (id) => m.deleteListing(id),
    apiGetProposalDraft: () => m.getProposalDraft(),
    apiUpdateProposalDraft: (payload) => m.updateProposalDraft(payload),
    apiSendProposal: (channel, sentBy, render, title, leadId) => m.sendProposal(channel, sentBy, render, title, leadId),
    apiGenerateProposalPdf: (render, title, updateProposalId, leadId) => m.generateProposalPdf(render, title, updateProposalId, leadId),
    apiListProposals: (opts) => m.listProposals(opts),
    apiGetProposal: (id) => m.getProposal(id),
    apiLoadProposalToDraft: (id) => m.loadProposalToDraft(id),
    apiCreateProposalShareLink: (id) => m.createProposalShareLink(id),
    apiMarkProposalFeedbackSeen: (id) => m.markProposalFeedbackSeen(id),
    apiGetPublicProposal: (token) => m.getPublicProposal(token),
    apiUpdatePublicProposal: (token, payload) => m.updatePublicProposal(token, payload),
    apiListActivity: (limit) => m.listActivity(limit),
    apiGetDashboardStats: () => m.getDashboardStats(),
    apiSmartMatchParse: (enquiry) => m.smartMatchParse(enquiry),
    apiSmartMatch: (payload) => m.smartMatch(payload),
    apiListLeads: (opts) => m.listLeads(opts),
    apiListLeadAssignees: (city) => m.listLeadAssignees(city),
    apiGetLead: (id) => m.getLead(id),
    apiCreateLead: (payload) => m.createLead(payload),
    apiParseLead: (enquiry) => m.parseLead(enquiry),
    apiCreateLeadFromMatch: (payload) => m.createLeadFromMatch(payload),
    apiUpdateLead: (id, payload) => m.updateLead(id, payload),
    apiDeleteLead: (id) => m.deleteLead(id),
    apiAddLeadNote: (id, text) => m.addLeadNote(id, text),
    apiSetLeadReminder: (id, payload) => m.setLeadReminder(id, payload),
    apiListRecentClients: () => m.listRecentClients(),
    apiUploadImages: (files, listingId) => m.uploadImages(files, listingId),
    methods: m,
  };
}

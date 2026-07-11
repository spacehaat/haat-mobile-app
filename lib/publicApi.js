import { createApiClient } from '@spacehaat/api-client/client';
import { createApiMethods } from '@spacehaat/api-client/methods';
import { apiBaseUrl } from '../constants/theme';

const { request } = createApiClient({ baseUrl: apiBaseUrl });

/** Unauthenticated API for the client proposal portal. */
export const publicApi = createApiMethods(request);

export function publicProposalPdfUrl(token) {
  return `${apiBaseUrl}/api/v1/public/proposals/${encodeURIComponent(token)}/pdf`;
}

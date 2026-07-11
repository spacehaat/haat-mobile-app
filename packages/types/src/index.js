/** @typedef {'admin' | 'member'} UserRole */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 * @property {string[]} cities
 * @property {string[]} permissions
 * @property {boolean} [active]
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {unknown[]} items
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 */

/**
 * @typedef {'new' | 'qualified' | 'proposal_sent' | 'visit_scheduled' | 'negotiation' | 'won' | 'lost'} LeadStage
 */

/**
 * @typedef {'manual' | 'whatsapp' | 'website' | 'referral' | 'smart_match'} LeadSource
 */

/**
 * @typedef {Object} LeadNote
 * @property {string} text
 * @property {string} who
 * @property {string} at
 */

/**
 * @typedef {Object} Lead
 * @property {string} id
 * @property {string} [leadDate]
 * @property {string} [name]
 * @property {string} [contact]
 * @property {string} [email]
 * @property {string} [company]
 * @property {string[]} [interestedIn]
 * @property {string} [city]
 * @property {string} [microlocation]
 * @property {number | string} [seats]
 * @property {LeadStage} [stage]
 * @property {LeadSource} [source]
 * @property {number | string} [budget]
 * @property {string} [moveIn]
 * @property {string} [rawEnquiry]
 * @property {string} [assigneeId]
 * @property {string} [assigneeName]
 * @property {string[]} [listingIds]
 * @property {string[]} [proposalIds]
 * @property {LeadNote[]} [notes]
 * @property {string} [dueAt]
 */

/**
 * @typedef {Object} Listing
 * @property {string} id
 * @property {string} [operator]
 * @property {string} [city]
 * @property {string} [micro]
 * @property {string} [type]
 * @property {string} [verifiedAt]
 */

/**
 * @typedef {Object} Proposal
 * @property {string} id
 * @property {string} [title]
 * @property {string} [status]
 * @property {string} [sentAt]
 * @property {string} [clientName]
 * @property {string} [clientCompany]
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} LoginResponse
 * @property {User} user
 * @property {AuthTokens} [tokens]
 */

export {};

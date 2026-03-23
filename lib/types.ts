export type SignalSource = 'github-issue' | 'tech-debt' | 'doc-drift'

export type SignalStatus =
  | 'unscoped'
  | 'scoping'
  | 'scoped'
  | 'executing'
  | 'done'
  | 'error'

export type Confidence = 'high' | 'medium' | 'low'

export interface ScopeResult {
  confidence: Confidence
  reasoning: string
  plan: string[]
  files_to_change: string[]
}

export interface Signal {
  id: string
  source: SignalSource
  title: string
  description: string
  file?: string
  status: SignalStatus
  sessionId?: string
  sessionUrl?: string
  scopeResult?: ScopeResult
  prUrl?: string
  // GitHub-specific
  issueNumber?: number
  issueUrl?: string
  labels?: string[]
}

// Hardcoded tech debt signals (D)
export const TECH_DEBT_SIGNALS: Omit<Signal, 'status'>[] = [
  {
    id: 'td-1',
    source: 'tech-debt',
    title: 'Remove ENABLE_LEGACY_AUTH feature flag',
    description: 'Flag set to True since Nov 2022. OAuth migration is complete. Legacy auth path and LEGACY_SESSION_TIMEOUT constant can be safely removed.',
    file: 'src/auth/auth_service.py',
    labels: ['feature-flag'],
  },
  {
    id: 'td-2',
    source: 'tech-debt',
    title: 'Remove ENABLE_MFA_ENFORCEMENT dead flag',
    description: 'Flag has been False since Q1 2023 when enforcement was deferred. MFA is not enforced and the flag is never checked in any meaningful path.',
    file: 'src/auth/auth_service.py',
    labels: ['feature-flag'],
  },
  {
    id: 'td-3',
    source: 'tech-debt',
    title: 'Remove unused _legacy_session_cleanup function',
    description: 'Function is defined but never called anywhere in the codebase since the OAuth migration. Safe to delete.',
    file: 'src/auth/auth_service.py',
    labels: ['dead-code'],
  },
  {
    id: 'td-4',
    source: 'tech-debt',
    title: 'Remove legacy /api/v1/legacy/export route',
    description: 'Endpoint was removed from the product in 2023. The route handler still exists but returns 410. Should be deleted entirely.',
    file: 'src/api/routes.py',
    labels: ['dead-code'],
  },
]

// Hardcoded doc drift signals (E)
export const DOC_DRIFT_SIGNALS: Omit<Signal, 'status'>[] = [
  {
    id: 'doc-1',
    source: 'doc-drift',
    title: 'API docs: token expiry documented as 24h, actual is 1h',
    description: 'docs/api/reference.md states tokens expire after 86400 seconds. New sessions expire after 3600 seconds. Misleading for new integrations.',
    file: 'docs/api/reference.md',
    labels: ['docs'],
  },
  {
    id: 'doc-2',
    source: 'doc-drift',
    title: 'API docs: GET /users/:id error behavior incorrect',
    description: 'Docs say endpoint returns 404 when user not found. Actual behavior is 200 with empty object (bug ACME-2301). Docs should reflect actual behavior until bug is fixed.',
    file: 'docs/api/reference.md',
    labels: ['docs'],
  },
  {
    id: 'doc-3',
    source: 'doc-drift',
    title: 'API docs: minimum charge amount outdated',
    description: 'Docs state minimum charge is 50 cents. Actual minimum is 100 cents. Partners are submitting charges that fail validation.',
    file: 'docs/api/reference.md',
    labels: ['docs'],
  },
]

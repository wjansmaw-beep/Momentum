import { Company } from '../product/localIntelligence';

export type SharedGuideDepth = 'quiet' | 'guide' | 'deep';
export type SharedCoordination = 'leave-together' | 'meet-there';
export type SharedRole = 'host' | 'guest';

export type SharedParticipant = {
  id: string;
  name: string;
  role: SharedRole;
  status: 'ready' | 'invited';
};

export type SharedCapsuleInvite = {
  version: 1;
  invitationId: string;
  experienceId: string;
  title: string;
  promise: string;
  duration: number;
  hostName: string;
  company: Exclude<Company, 'solo'>;
  guideDepth: SharedGuideDepth;
  coordination: SharedCoordination;
  createdAt: string;
};

export type SharedCapsuleState = {
  invitationId: string;
  role: SharedRole;
  participants: SharedParticipant[];
  coordination: SharedCoordination;
  localOnly: true;
  readiness: {
    timing: boolean;
    pace: boolean;
    practical: boolean;
  };
};

const inviteParameter = 'momentumInvite';
const inviteLifetimeMs = 72 * 60 * 60 * 1000;

export type SharedInviteReadResult =
  | { state: 'none' }
  | { state: 'invalid' }
  | { state: 'expired'; invite: SharedCapsuleInvite }
  | { state: 'valid'; invite: SharedCapsuleInvite };

const safeName = (value: string) => value.trim().slice(0, 40) || 'Iemand';

export function createSharedInvite(input: Omit<SharedCapsuleInvite, 'version' | 'invitationId' | 'createdAt' | 'hostName'> & { hostName?: string }): SharedCapsuleInvite {
  return {
    ...input,
    version: 1,
    invitationId: `invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    hostName: safeName(input.hostName ?? ''),
  };
}

export function encodeSharedInvite(invite: SharedCapsuleInvite): string {
  return encodeURIComponent(JSON.stringify(invite));
}

export function decodeSharedInvite(value: string | null | undefined): SharedCapsuleInvite | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<SharedCapsuleInvite>;
    if (parsed.version !== 1 || !parsed.invitationId || !parsed.experienceId || !parsed.title || !parsed.promise || !parsed.hostName || !parsed.duration || !parsed.createdAt) return null;
    if (!['together', 'family'].includes(parsed.company ?? '')) return null;
    if (!['quiet', 'guide', 'deep'].includes(parsed.guideDepth ?? '')) return null;
    if (!['leave-together', 'meet-there'].includes(parsed.coordination ?? '')) return null;
    return parsed as SharedCapsuleInvite;
  } catch {
    return null;
  }
}

export function readInviteFromCurrentUrl(): SharedInviteReadResult {
  if (typeof window === 'undefined') return { state: 'none' };
  const value = new URLSearchParams(window.location.search).get(inviteParameter);
  if (!value) return { state: 'none' };
  const invite = decodeSharedInvite(value);
  if (!invite) return { state: 'invalid' };
  const createdAt = new Date(invite.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return { state: 'invalid' };
  if (Date.now() - createdAt > inviteLifetimeMs) return { state: 'expired', invite };
  return { state: 'valid', invite };
}

export function buildInviteUrl(invite: SharedCapsuleInvite): string | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set(inviteParameter, encodeSharedInvite(invite));
  return url.toString();
}

export function clearInviteFromCurrentUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete(inviteParameter);
  window.history.replaceState({}, '', url.toString());
}

export function sharedStateFromInvite(invite: SharedCapsuleInvite, guestName: string): SharedCapsuleState {
  return {
    invitationId: invite.invitationId,
    role: 'guest',
    coordination: invite.coordination,
    localOnly: true,
    readiness: { timing: false, pace: false, practical: false },
    participants: [
      { id: 'host', name: safeName(invite.hostName), role: 'host', status: 'ready' },
      { id: 'guest', name: safeName(guestName), role: 'guest', status: 'ready' },
    ],
  };
}

export function hostSharedState(invite: SharedCapsuleInvite): SharedCapsuleState {
  return {
    invitationId: invite.invitationId,
    role: 'host',
    coordination: invite.coordination,
    localOnly: true,
    readiness: { timing: false, pace: false, practical: false },
    participants: [
      { id: 'host', name: safeName(invite.hostName), role: 'host', status: 'ready' },
      { id: 'guest', name: 'Uitgenodigde', role: 'guest', status: 'invited' },
    ],
  };
}

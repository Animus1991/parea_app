import { describe, expect, it } from 'vitest';
import type { User } from '../types';
import {
  areConnected,
  canViewerContactOrganizer,
  canViewerMessageUser,
  canViewerSeeProfile,
  isBlockedBetween,
  projectProfileForViewer,
  shareEventGroup,
  shouldShowProfilePhoto,
} from './profilePrivacy';

function user(partial: Partial<User> & { id: string; name: string }): User {
  return {
    ageRange: '25-34',
    city: 'Athens',
    interests: ['Music'],
    trustTier: '1_explorer',
    reliabilityScore: 80,
    badges: [],
    emailVerified: true,
    phoneVerified: false,
    paymentVerified: false,
    idVerified: false,
    isOrganizer: false,
    ...partial,
  };
}

describe('profilePrivacy', () => {
  const alex = user({ id: 'u1', name: 'Alex', connections: ['u2'], photoUrl: 'https://x/a.jpg', bio: 'hi' });
  const sam = user({ id: 'u2', name: 'Sam', connections: ['u1'], photoUrl: 'https://x/s.jpg' });
  const stranger = user({ id: 'u3', name: 'Pat', photoUrl: 'https://x/p.jpg', bio: 'secret' });
  const organizer = user({
    id: 'org1',
    name: 'Org',
    isOrganizer: true,
    photoUrl: 'https://x/o.jpg',
    bio: 'host bio',
    privacy: {
      profileVisibility: 'connections',
      messagePermission: 'connections',
      shareLocation: true,
      revealPhoto: true,
      allowMutualPing: true,
      allowOrganizerMsg: true,
    },
  });

  it('areConnected is mutual-aware', () => {
    expect(areConnected(alex, sam)).toBe(true);
    expect(areConnected(alex, stranger)).toBe(false);
  });

  it('shareEventGroup detects co-membership', () => {
    const groups = [
      { members: ['u1', 'u3'], hostId: 'u1', status: 'confirmed' as const },
    ];
    expect(shareEventGroup('u1', 'u3', groups)).toBe(true);
    expect(shareEventGroup('u1', 'u2', groups)).toBe(false);
  });

  it('blocks either direction', () => {
    expect(isBlockedBetween(alex, stranger, ['u3'])).toBe(true);
    expect(
      isBlockedBetween(alex, { ...stranger, blockedUserIds: ['u1'] }, []),
    ).toBe(true);
  });

  it('gates private non-organizer profiles as hidden', () => {
    const privateUser = {
      ...stranger,
      privacy: {
        profileVisibility: 'private' as const,
        messagePermission: 'everyone' as const,
        shareLocation: true,
        revealPhoto: true,
        allowMutualPing: true,
        allowOrganizerMsg: true,
      },
    };
    const access = canViewerSeeProfile(alex, privateUser);
    expect(access.allowed).toBe(false);
    expect(access.level).toBe('hidden');
  });

  it('shows limited organizer card when connections-only', () => {
    const access = canViewerSeeProfile(stranger, organizer);
    expect(access.allowed).toBe(true);
    expect(access.level).toBe('limited');
    const projected = projectProfileForViewer(stranger, organizer);
    expect(projected.bio).toBeUndefined();
    expect(projected.photoUrl).toBeUndefined();
    expect(projected.showContact).toBe(false);
  });

  it('allows full profile for connections', () => {
    const connectedOrg = {
      ...organizer,
      connections: ['u3'],
    };
    const viewer = { ...stranger, connections: ['org1'] };
    const access = canViewerSeeProfile(viewer, connectedOrg);
    expect(access.level).toBe('full');
    expect(shouldShowProfilePhoto(viewer, connectedOrg)).toBe(true);
  });

  it('messagePermission connections blocks strangers', () => {
    const gated = {
      ...sam,
      privacy: {
        profileVisibility: 'public' as const,
        messagePermission: 'connections' as const,
        shareLocation: true,
        revealPhoto: true,
        allowMutualPing: true,
        allowOrganizerMsg: true,
      },
    };
    expect(canViewerMessageUser(stranger, gated).allowed).toBe(false);
    expect(canViewerMessageUser(alex, gated).allowed).toBe(true);
  });

  it('messagePermission groups allows shared event group only', () => {
    const gated = {
      ...stranger,
      privacy: {
        profileVisibility: 'public' as const,
        messagePermission: 'groups' as const,
        shareLocation: true,
        revealPhoto: true,
        allowMutualPing: true,
        allowOrganizerMsg: true,
      },
    };
    const groups = [{ members: ['u1', 'u3'], hostId: 'u1', status: 'confirmed' as const }];
    expect(canViewerMessageUser(alex, gated, { groups }).allowed).toBe(true);
    expect(canViewerMessageUser(sam, gated, { groups }).allowed).toBe(false);
  });

  it('organizer contact respects allowOrganizerMsg', () => {
    const closed = {
      ...organizer,
      privacy: { ...organizer.privacy!, allowOrganizerMsg: false, messagePermission: 'everyone' as const },
    };
    expect(canViewerContactOrganizer(alex, closed).allowed).toBe(false);
  });

  it('hides photo when revealPhoto is false for non-connections', () => {
    const shy = {
      ...stranger,
      privacy: {
        profileVisibility: 'public' as const,
        messagePermission: 'everyone' as const,
        shareLocation: true,
        revealPhoto: false,
        allowMutualPing: true,
        allowOrganizerMsg: true,
      },
    };
    expect(shouldShowProfilePhoto(alex, shy)).toBe(false);
  });
});

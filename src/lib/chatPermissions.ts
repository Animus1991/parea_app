import type { Conversation, ChatPermissions } from '../types/chat';
import type { User } from '../types';
import { useStore } from '../store';

export function canOpenConversation(
  viewer: User | null,
  conversation: Conversation,
  ctx: {
    groups: { id: string; members: string[]; hostId?: string; eventId: string }[];
    companyJoinRequests: {
      id: string;
      status: string;
      fromUserId: string;
      targetUserId?: string;
      companyRequestId: string;
      chatUnlocked?: boolean;
    }[];
    blockedUserIds?: string[];
  },
): ChatPermissions {
  if (!viewer) {
    return { canRead: false, canSend: false, canReport: false, canPersist: false, reasonIfLocked: { el: 'Σύνδεση απαιτείται', en: 'Sign in required' } };
  }

  if (ctx.blockedUserIds?.some((id) => conversation.participantUserIds.includes(id) && id !== viewer.id)) {
    return { canRead: false, canSend: false, canReport: false, canPersist: false, reasonIfLocked: { el: 'Αποκλεισμένη συνομιλία', en: 'Blocked conversation' } };
  }

  if (conversation.status === 'frozen' || conversation.status === 'reported') {
    return {
      canRead: true,
      canSend: false,
      canReport: true,
      canPersist: false,
      reasonIfLocked: { el: 'Παγωμένη από συντονισμό', en: 'Frozen by moderation' },
    };
  }

  if (conversation.status === 'expired') {
    return {
      canRead: true,
      canSend: false,
      canReport: false,
      canPersist: false,
      reasonIfLocked: { el: 'Η συνομιλία έληξε μετά την εκδήλωση', en: 'Chat expired after the event' },
    };
  }

  if (!conversation.participantUserIds.includes(viewer.id) && conversation.organizerUserId !== viewer.id) {
    return {
      canRead: false,
      canSend: false,
      canReport: false,
      canPersist: false,
      reasonIfLocked: { el: 'Δεν έχετε πρόσβαση', en: 'You do not have access' },
    };
  }

  if (conversation.status === 'locked') {
    return {
      canRead: false,
      canSend: false,
      canReport: true,
      canPersist: false,
      reasonIfLocked: {
        el: 'Το chat ξεκλειδώνεται μετά την αποδοχή αιτήματος',
        en: 'Chat unlocks after the request is accepted',
      },
    };
  }

  if (conversation.status === 'pending') {
    const isParty = conversation.participantUserIds.includes(viewer.id);
    return {
      canRead: isParty,
      canSend: false,
      canReport: true,
      canPersist: false,
      reasonIfLocked: {
        el: 'Σε αναμονή αποδοχής και των δύο πλευρών',
        en: 'Waiting for both sides to accept',
      },
    };
  }

  if (conversation.type === 'organizer_announcement') {
    const inGroup = conversation.groupId
      ? ctx.groups.some((g) => g.id === conversation.groupId && g.members.includes(viewer.id))
      : false;
    const isOrganizer = conversation.organizerUserId === viewer.id;
    return {
      canRead: inGroup || conversation.participantUserIds.includes(viewer.id) || isOrganizer,
      canSend: false,
      canReport: true,
      canPersist: false,
      reasonIfLocked: { el: 'Ανακοίνωση διοργανωτή — μόνο ανάγνωση', en: 'Organizer update — read only' },
    };
  }

  return {
    canRead: true,
    canSend: conversation.status === 'active' || conversation.status === 'persistent',
    canReport: true,
    canPersist: conversation.canPersist,
  };
}

export function useChatPermission(conversation: Conversation | null): ChatPermissions {
  const viewer = useStore((s) => s.currentUser);
  const groups = useStore((s) => s.groups);
  const companyJoinRequests = useStore((s) => s.companyJoinRequests);
  if (!conversation) {
    return { canRead: false, canSend: false, canReport: false, canPersist: false };
  }
  return canOpenConversation(viewer, conversation, { groups, companyJoinRequests });
}

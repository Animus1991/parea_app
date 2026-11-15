/**
 * After an AI tool runs, refresh the surfaces that consume the mutated topics
 * (CFB invalidation map — Zustand-sized).
 */
import { useChatStore } from '../store/chatStore';
import { useStore } from '../store';

export type InvalidationTopic =
  | 'events'
  | 'groups'
  | 'saved'
  | 'notifications'
  | 'connections'
  | 'company'
  | 'profile'
  | 'settings'
  | 'challenges'
  | 'chat'
  | 'wallet';

const ACTION_TOPICS: Record<string, InvalidationTopic[]> = {
  save_event: ['saved', 'events'],
  unsave_event: ['saved', 'events'],
  join_waitlist: ['events', 'groups'],
  start_join_flow: ['groups', 'events'],
  leave_group: ['groups', 'events', 'chat'],
  create_event: ['events'],
  draft_event: ['events'],
  send_group_message: ['chat'],
  open_chat: ['chat'],
  respond_connection_request: ['connections', 'notifications'],
  respond_company_join: ['company', 'groups', 'chat', 'notifications'],
  find_company: ['company'],
  list_forming_plans: ['company'],
  mark_notifications_read: ['notifications'],
  summarize_notifications: ['notifications'],
  update_bio: ['profile'],
  draft_profile: ['profile'],
  add_interest: ['profile'],
  remove_interest: ['profile'],
  update_privacy: ['settings', 'profile'],
  update_notification_prefs: ['settings', 'notifications'],
  set_theme: ['settings'],
  set_language: ['settings'],
  set_home_layout: ['settings'],
  start_verification: ['profile', 'settings'],
  open_feedback: ['events'],
  join_challenge: ['challenges', 'profile'],
  summarize_wallet: ['wallet'],
  export_agenda: ['events'],
  whats_new: ['notifications', 'company', 'chat'],
};

/** Topics declared for an action (empty = no side-effect refresh). */
export function topicsForAction(name: string): InvalidationTopic[] {
  return ACTION_TOPICS[name] ?? [];
}

/**
 * Soft refresh: bump store subscribers by re-writing the same slices.
 * Chat unread is re-derived from conversations; notifications stay as-is
 * (already mutated by the action) but we touch the array to wake listeners.
 */
export function invalidateTopics(topics: InvalidationTopic[]): void {
  if (topics.length === 0) return;
  const uniq = [...new Set(topics)];
  const s = useStore.getState();

  if (uniq.includes('notifications')) {
    useStore.setState({ notifications: [...s.notifications] });
  }
  if (uniq.includes('events') || uniq.includes('saved')) {
    useStore.setState({
      events: [...s.events],
      savedEvents: [...s.savedEvents],
    });
  }
  if (uniq.includes('groups')) {
    useStore.setState({ groups: [...s.groups] });
  }
  if (uniq.includes('connections')) {
    useStore.setState({
      connectionRequests: [...s.connectionRequests],
      users: [...s.users],
    });
  }
  if (uniq.includes('company')) {
    useStore.setState({
      companyRequests: [...s.companyRequests],
      companyJoinRequests: [...s.companyJoinRequests],
    });
  }
  if (uniq.includes('profile') || uniq.includes('settings')) {
    useStore.setState({
      currentUser: s.currentUser ? { ...s.currentUser } : s.currentUser,
      userSettings: { ...s.userSettings },
      theme: s.theme,
    });
  }
  if (uniq.includes('challenges')) {
    useStore.setState({ challengesJoined: [...s.challengesJoined] });
  }
  if (uniq.includes('chat')) {
    const chat = useChatStore.getState();
    useChatStore.setState({ conversations: [...chat.conversations] });
  }
  if (uniq.includes('wallet')) {
    /* demo KPIs are local to WalletPageContent — bump user so organizer views re-read */
    useStore.setState({ currentUser: s.currentUser ? { ...s.currentUser } : s.currentUser });
  }
}

export function invalidateAfterAction(actionName: string): void {
  invalidateTopics(topicsForAction(actionName));
}

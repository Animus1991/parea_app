import type { User } from '../types';

export interface NextBestAction {
  id: string;
  titleEl: string;
  titleEn: string;
  descriptionEl: string;
  descriptionEn: string;
  path: string;
  priority: number;
}

interface OptimizerInput {
  user: User | null;
  onboardingCompleted: boolean;
  unreadNotifications: number;
  unreadChats: number;
  upcomingPlansCount: number;
  savedEventsCount: number;
  profileInterestsCount: number;
  hasBio: boolean;
}

export function getNextBestActions(input: OptimizerInput): NextBestAction[] {
  const actions: NextBestAction[] = [];

  if (!input.user) return actions;

  if (!input.onboardingCompleted) {
    actions.push({
      id: 'finish-onboarding',
      titleEl: 'Ολοκλήρωσε το onboarding',
      titleEn: 'Finish onboarding',
      descriptionEl: 'Ρύθμισε ενδιαφέροντα και προτιμήσεις για καλύτερα matches.',
      descriptionEn: 'Set interests and preferences for better matches.',
      path: '/onboarding',
      priority: 100,
    });
  }

  if (input.profileInterestsCount < 3) {
    actions.push({
      id: 'add-interests',
      titleEl: 'Πρόσθεσε τουλάχιστον 3 ενδιαφέροντα',
      titleEn: 'Add at least 3 interests',
      descriptionEl: 'Βελτιώνει τα event matches κατά ~20%.',
      descriptionEn: 'Improves event matches by ~20%.',
      path: '/profile',
      priority: 90,
    });
  }

  if (!input.hasBio) {
    actions.push({
      id: 'write-bio',
      titleEl: 'Γράψε μια σύντομη bio',
      titleEn: 'Write a short bio',
      descriptionEl: 'Οι οργανωτές εμπιστεύονται πιο εύκολα πλήρη προφίλ.',
      descriptionEn: 'Organizers trust complete profiles more easily.',
      path: '/profile',
      priority: 85,
    });
  }

  if (input.upcomingPlansCount === 0) {
    actions.push({
      id: 'browse-events',
      titleEl: 'Βρες την επόμενη εκδήλωση',
      titleEn: 'Find your next event',
      descriptionEl: 'Το ημερολόγιό σου είναι κενό — δες τις κατηγορίες.',
      descriptionEn: 'Your calendar is empty — browse categories.',
      path: '/categories',
      priority: 80,
    });
  }

  if (input.unreadChats > 0) {
    actions.push({
      id: 'reply-chats',
      titleEl: `Απάντησε σε ${input.unreadChats} συνομιλίες`,
      titleEn: `Reply to ${input.unreadChats} chats`,
      descriptionEl: 'Κράτα την ομάδα ενεργή πριν την εκδήλωση.',
      descriptionEn: 'Keep the group active before the event.',
      path: '/chats',
      priority: 75,
    });
  }

  if (input.unreadNotifications > 0) {
    actions.push({
      id: 'check-notifications',
      titleEl: 'Έλεγξε τις ειδοποιήσεις σου',
      titleEn: 'Check your notifications',
      descriptionEl: 'Μπορεί να υπάρχουν νέα matches ή μηνύματα.',
      descriptionEn: 'You may have new matches or messages.',
      path: '/notifications',
      priority: 70,
    });
  }

  if (input.savedEventsCount > 0 && input.upcomingPlansCount === 0) {
    actions.push({
      id: 'join-saved',
      titleEl: 'Μπες σε μια αποθηκευμένη εκδήλωση',
      titleEn: 'Join a saved event',
      descriptionEl: 'Έχεις αποθηκευμένα events χωρίς ενεργό πλάνο.',
      descriptionEn: 'You have saved events without an active plan.',
      path: '/saved',
      priority: 65,
    });
  }

  actions.push({
    id: 'buddy-seek',
    titleEl: 'Ψάξε παρέα (Buddy Seek)',
    titleEn: 'Find company (Buddy Seek)',
    descriptionEl: 'Δες ποιος ψάχνει συνοδεία για τις ίδιες εκδηλώσεις.',
    descriptionEn: 'See who is looking for company for the same events.',
    path: '/buddy-seek',
    priority: 50,
  });

  return actions.sort((a, b) => b.priority - a.priority);
}

export function computeProfileCompletion(user: User | null, hasBio: boolean): {
  percent: number;
  nextActionEl: string;
  nextActionEn: string;
  nextPath: string;
} {
  if (!user) {
    return { percent: 0, nextActionEl: 'Σύνδεση', nextActionEn: 'Sign in', nextPath: '/login' };
  }

  let score = 20;
  if (user.photoUrl) score += 15;
  if (hasBio && user.bio?.trim()) score += 15;
  if ((user.interests?.length ?? 0) >= 1) score += 10;
  if ((user.interests?.length ?? 0) >= 3) score += 15;
  if (user.trustTier !== '1_explorer') score += 15;
  if (user.idVerified) score += 10;

  const percent = Math.min(100, score);

  if (!user.photoUrl) {
    return { percent, nextActionEl: 'Πρόσθεσε φωτογραφία (+15%)', nextActionEn: 'Add a photo (+15%)', nextPath: '/profile' };
  }
  if (!hasBio || !user.bio?.trim()) {
    return { percent, nextActionEl: 'Γράψε bio (+15%)', nextActionEn: 'Write a bio (+15%)', nextPath: '/profile' };
  }
  if ((user.interests?.length ?? 0) < 3) {
    return { percent, nextActionEl: 'Πρόσθεσε 3 ενδιαφέροντα (+15%)', nextActionEn: 'Add 3 interests (+15%)', nextPath: '/profile' };
  }
  if (user.trustTier === '1_explorer') {
    return { percent, nextActionEl: 'Ολοκλήρωσε επαλήθευση (+15%)', nextActionEn: 'Complete verification (+15%)', nextPath: '/verification' };
  }

  return {
    percent,
    nextActionEl: 'Το προφίλ σου είναι σχεδόν πλήρες',
    nextActionEn: 'Your profile is nearly complete',
    nextPath: '/profile',
  };
}

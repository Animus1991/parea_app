// Entry point for our pages
import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { AppShell } from "./components/layout/AppShell";
import { RouteLifecycle } from "./components/common/RouteLifecycle";
import { OfflineBanner } from "./components/common/OfflineBanner";
import { CspViolationToast } from "./components/common/CspViolationToast";
import { CommandPalette } from "./components/common/CommandPalette";
import { RequireAdmin } from "./components/auth/RequireAdmin";
import { CopilotBridge } from "./components/copilot/CopilotBridge";
import { useStore } from "./store";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { PageLoading } from "./components/common/PageLoading";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { routeLoaders, prefetchWhenIdle } from './lib/routeLoaders';

// Route-level code-splitting (lazy-loaded pages)
const Home = lazy(routeLoaders.home);
const NotFound = lazy(routeLoaders.notFound);
const EventDetail = lazy(routeLoaders.eventDetail);
const Plans = lazy(routeLoaders.plans);
const TrustCenter = lazy(routeLoaders.trustCenter);
const Profile = lazy(routeLoaders.profile);
const AdminDashboard = lazy(routeLoaders.adminDashboard);
const OrganizerDashboard = lazy(routeLoaders.organizerDashboard);
const JoinGroupFlow = lazy(routeLoaders.joinGroupFlow);
const GroupChat = lazy(routeLoaders.groupChat);
const OrganizerProfile = lazy(routeLoaders.organizerProfile);
const Notifications = lazy(routeLoaders.notifications);
const Categories = lazy(routeLoaders.categories);
const NearbyGroups = lazy(routeLoaders.nearbyGroups);
const History = lazy(routeLoaders.history);
const SavedEvents = lazy(routeLoaders.savedEvents);
const ReportIssue = lazy(routeLoaders.reportIssue);
const PostEventFeedback = lazy(routeLoaders.postEventFeedback);
const Login = lazy(routeLoaders.login);
const MyCalendar = lazy(routeLoaders.myCalendar);
const MyConnections = lazy(routeLoaders.myConnections);
const Inbox = lazy(routeLoaders.inbox);
const CreateEventFlow = lazy(routeLoaders.createEventFlow);
const Wallet = lazy(routeLoaders.wallet);
const VerificationCenter = lazy(routeLoaders.verificationCenter);
const SettingsAndPrivacy = lazy(routeLoaders.settingsAndPrivacy);
const HelpCenter = lazy(routeLoaders.helpCenter);
const Achievements = lazy(routeLoaders.achievements);
const Leaderboard = lazy(routeLoaders.leaderboard);
const Challenges = lazy(routeLoaders.challenges);
const Onboarding = lazy(routeLoaders.onboarding);
const BuddySeek = lazy(routeLoaders.buddySeek);
const Wall = lazy(routeLoaders.wall);
const PersonProfile = lazy(routeLoaders.personProfile);
const OurNight = lazy(routeLoaders.ourNight);
const Collections = lazy(routeLoaders.collections);
const InvitePublic = lazy(routeLoaders.invitePublic);
const OrganizerEmbed = lazy(routeLoaders.organizerEmbed);

/** Pages anyone with the link may open, without an account (Φ27). */
function isPublicPath(pathname: string): boolean {
  return /^\/i\/[^/]+$/.test(pathname) || /^\/embed\/organizer\/[^/]+$/.test(pathname);
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const onboardingCompleted = useStore((state) => state.onboardingCompleted);
  const demoMode = useStore((state) => state.demoMode);

  // Instant navigation: while the browser is idle, fetch the pages people open
  // next (Home from the login page; the main destinations once signed in).
  const onLogin = location.pathname === "/login";
  const signedIn = Boolean(currentUser);
  useEffect(() => {
    if (onLogin) return prefetchWhenIdle(["/"]);
    if (!signedIn) return;
    return prefetchWhenIdle(["/", "/events/_", "/categories", "/plans", "/buddy-seek", "/saved", "/chats", "/profile", "/notifications", "/wall"]);
  }, [onLogin, signedIn]);

  const publicPage = isPublicPath(location.pathname);
  useEffect(() => {
    if (!currentUser && location.pathname !== "/login" && !publicPage) {
      navigate("/login");
    }
  }, [currentUser, location.pathname, navigate, publicPage]);

  useEffect(() => {
    if (
      currentUser &&
      !demoMode &&
      !onboardingCompleted &&
      !publicPage &&
      location.pathname !== "/onboarding" &&
      location.pathname !== "/login"
    ) {
      navigate("/onboarding");
    }
  }, [currentUser, onboardingCompleted, demoMode, location.pathname, navigate, publicPage]);

  // Invite pages and the organizer widget render on their own, signed in or not.
  if (publicPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <RouteLifecycle />
        <Suspense fallback={<PageLoading />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/i/:inviteId" element={<ErrorBoundary><InvitePublic /></ErrorBoundary>} />
            <Route path="/embed/organizer/:id" element={<ErrorBoundary><OrganizerEmbed /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </QueryClientProvider>
    );
  }

  if (!currentUser && location.pathname !== "/login") {
    return null; // wait for redirect
  }

  if (location.pathname === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <RouteLifecycle />
        <OfflineBanner />
        <CspViolationToast />
        <AnimatePresence mode="popLayout">
        <Suspense fallback={<PageLoading />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouteLifecycle />
      <OfflineBanner />
      <CspViolationToast />
      <CommandPalette />
      <CopilotBridge />
      <AppShell>
      <AnimatePresence mode="popLayout">
        <Suspense fallback={<PageLoading />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/categories" element={<ErrorBoundary><Categories /></ErrorBoundary>} />
            <Route path="/nearby" element={<ErrorBoundary><NearbyGroups /></ErrorBoundary>} />

            <Route path="/events/:eventId" element={<ErrorBoundary><EventDetail /></ErrorBoundary>} />
            <Route path="/events/:eventId/join" element={<ErrorBoundary><JoinGroupFlow /></ErrorBoundary>} />

            <Route path="/agenda" element={<ErrorBoundary><MyCalendar /></ErrorBoundary>} />
            <Route path="/calendar" element={<Navigate to="/agenda" replace />} />
            <Route path="/plans" element={<ErrorBoundary><Plans /></ErrorBoundary>} />
            <Route path="/buddy-seek" element={<ErrorBoundary><BuddySeek /></ErrorBoundary>} />
            <Route path="/history" element={<ErrorBoundary><History /></ErrorBoundary>} />
            <Route
              path="/history/feedback/:eventId"
              element={<ErrorBoundary><PostEventFeedback /></ErrorBoundary>}
            />
            <Route path="/saved" element={<ErrorBoundary><SavedEvents /></ErrorBoundary>} />

            <Route path="/connections" element={<ErrorBoundary><MyConnections /></ErrorBoundary>} />
            <Route path="/chats" element={<ErrorBoundary><Inbox /></ErrorBoundary>} />
            <Route path="/chat/:groupId" element={<ErrorBoundary><GroupChat /></ErrorBoundary>} />

            <Route path="/manage" element={<ErrorBoundary><OrganizerDashboard /></ErrorBoundary>} />
            <Route path="/create" element={<ErrorBoundary><CreateEventFlow /></ErrorBoundary>} />
            <Route path="/wallet" element={<ErrorBoundary><Wallet /></ErrorBoundary>} />

            <Route path="/verification" element={<ErrorBoundary><VerificationCenter /></ErrorBoundary>} />
            <Route path="/trust" element={<ErrorBoundary><TrustCenter /></ErrorBoundary>} />
            <Route path="/report" element={<ErrorBoundary><ReportIssue /></ErrorBoundary>} />

            <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
            <Route path="/organizer/:id" element={<ErrorBoundary><OrganizerProfile /></ErrorBoundary>} />
            <Route path="/u/:id" element={<ErrorBoundary><PersonProfile /></ErrorBoundary>} />
            <Route path="/wall" element={<ErrorBoundary><Wall /></ErrorBoundary>} />
            <Route path="/night/:groupId" element={<ErrorBoundary><OurNight /></ErrorBoundary>} />
            <Route path="/collections" element={<ErrorBoundary><Collections /></ErrorBoundary>} />
            <Route path="/collections/:id" element={<ErrorBoundary><Collections /></ErrorBoundary>} />

            <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><SettingsAndPrivacy /></ErrorBoundary>} />
            <Route path="/help" element={<ErrorBoundary><HelpCenter /></ErrorBoundary>} />

            <Route path="/admin" element={<ErrorBoundary><RequireAdmin><AdminDashboard /></RequireAdmin></ErrorBoundary>} />
            <Route path="/achievements" element={<ErrorBoundary><Achievements /></ErrorBoundary>} />
            <Route path="/leaderboard" element={<ErrorBoundary><Leaderboard /></ErrorBoundary>} />
            <Route path="/challenges" element={<ErrorBoundary><Challenges /></ErrorBoundary>} />
            <Route path="/onboarding" element={<ErrorBoundary><Onboarding /></ErrorBoundary>} />

            {/* 404 catch-all */}
            <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </AppShell>
    </QueryClientProvider>
  );
}

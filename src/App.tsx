// Entry point for our pages
import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { AppShell } from "./components/layout/AppShell";
import { RouteLifecycle } from "./components/common/RouteLifecycle";
import { OfflineBanner } from "./components/common/OfflineBanner";
import { CommandPalette } from "./components/common/CommandPalette";
import { useStore } from "./store";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { PageLoading } from "./components/common/PageLoading";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Route-level code-splitting (lazy-loaded pages)
const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/not-found"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Plans = lazy(() => import("./pages/Plans"));
const TrustCenter = lazy(() => import("./pages/TrustCenter"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const OrganizerDashboard = lazy(() => import("./pages/OrganizerDashboard"));
const JoinGroupFlow = lazy(() => import("./components/groups/JoinGroupFlow"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const OrganizerProfile = lazy(() => import("./pages/OrganizerProfile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Categories = lazy(() => import("./pages/Categories"));
const NearbyGroups = lazy(() => import("./pages/NearbyGroups"));
const History = lazy(() => import("./pages/History"));
const SavedEvents = lazy(() => import("./pages/SavedEvents"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const PostEventFeedback = lazy(() => import("./pages/PostEventFeedback"));
const Login = lazy(() => import("./pages/Login"));
const MyCalendar = lazy(() => import("./pages/MyCalendar"));
const MyConnections = lazy(() => import("./pages/MyConnections"));
const Inbox = lazy(() => import("./pages/Inbox"));
const CreateEventFlow = lazy(() => import("./pages/CreateEventFlow"));
const Wallet = lazy(() => import("./pages/Wallet"));
const VerificationCenter = lazy(() => import("./pages/VerificationCenter"));
const SettingsAndPrivacy = lazy(() => import("./pages/SettingsAndPrivacy"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const BuddySeek = lazy(() => import("./pages/BuddySeek"));

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const onboardingCompleted = useStore((state) => state.onboardingCompleted);
  const demoMode = useStore((state) => state.demoMode);

  useEffect(() => {
    if (!currentUser && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [currentUser, location.pathname, navigate]);

  useEffect(() => {
    if (
      currentUser &&
      !demoMode &&
      !onboardingCompleted &&
      location.pathname !== "/onboarding" &&
      location.pathname !== "/login"
    ) {
      navigate("/onboarding");
    }
  }, [currentUser, onboardingCompleted, demoMode, location.pathname, navigate]);

  if (!currentUser && location.pathname !== "/login") {
    return null; // wait for redirect
  }

  if (location.pathname === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <RouteLifecycle />
        <OfflineBanner />
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
      <CommandPalette />
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

            <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><SettingsAndPrivacy /></ErrorBoundary>} />
            <Route path="/help" element={<ErrorBoundary><HelpCenter /></ErrorBoundary>} />

            <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
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

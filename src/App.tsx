// Entry point for our pages
import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { AppShell } from "./components/layout/AppShell";
import { useStore } from "./store";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { useLanguage } from "./lib/i18n";

// Route-level code-splitting (lazy-loaded pages)
const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/not-found"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Plans = lazy(() => import("./pages/Plans"));
const TrustCenter = lazy(() => import("./pages/TrustCenter"));
const Profile = lazy(() => import("./pages/Profile"));
const SettingsPage = lazy(() => import("./pages/AdminDashboard")); // using as Settings mock
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

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const { t } = useLanguage();

  useEffect(() => {
    if (!currentUser && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [currentUser, location.pathname, navigate]);

  if (!currentUser && location.pathname !== "/login") {
    return null; // wait for redirect
  }

  if (location.pathname === "/login") {
    return (
      <AnimatePresence mode="popLayout">
        <Suspense fallback={<div className="p-4 text-[13.8px]">{t('Φόρτωση…', 'Loading…')}</div>}>
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    );
  }

  return (
    <AppShell>
      <AnimatePresence mode="popLayout">
        <Suspense fallback={<div className="p-4 text-[13.8px]">{t('Φόρτωση…', 'Loading…')}</div>}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/categories" element={<ErrorBoundary><Categories /></ErrorBoundary>} />
            <Route path="/nearby" element={<ErrorBoundary><NearbyGroups /></ErrorBoundary>} />

            <Route path="/events/:eventId" element={<ErrorBoundary><EventDetail /></ErrorBoundary>} />
            <Route path="/events/:eventId/join" element={<ErrorBoundary><JoinGroupFlow /></ErrorBoundary>} />

            <Route path="/agenda" element={<ErrorBoundary><MyCalendar /></ErrorBoundary>} />
            <Route path="/plans" element={<ErrorBoundary><Plans /></ErrorBoundary>} />
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

            <Route path="/admin" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="/achievements" element={<ErrorBoundary><Achievements /></ErrorBoundary>} />

            {/* 404 catch-all */}
            <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </AppShell>
  );
}

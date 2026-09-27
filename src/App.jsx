import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FindTutorPage from './pages/FindTutorPage';
import SessionsPage from './pages/SessionsPage';
import ActivityPage from './pages/ActivityPage';
import RequestsPage from './pages/RequestsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import SubjectsPage from './pages/SubjectsPage';
import ProfilePage from './pages/ProfilePage';
import TutorDetailPage from './pages/TutorDetailPage';
import FormPage from './pages/FormPage';
import NotFoundPage from './pages/NotFoundPage';
import AppShell from './components/AppShell';
import SettingsDrawer from './components/SettingsDrawer';
import { DEMO_ACCOUNTS, INITIAL_REQUESTS, INITIAL_SESSIONS, TUTORS } from './data/mockData';
import { seedAvailability, slotKey } from './lib/slots';

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function ProtectedRoutes({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  // The midterm uses simulated authentication: the matched demo account is stored in state.
  const [user, setUser] = useState(() => read('pcl-user-v7', null));
  const [theme, setTheme] = useState(() => read('pcl-theme-v7', 'light'));
  const [accent, setAccent] = useState(() => read('pcl-accent-v7', '#0B8F68'));
  const [collapsed, setCollapsed] = useState(() => read('pcl-sidebar-v7', false));
  const [settingsOpen, setSettingsOpen] = useState(false);
  // `requests` is the single source of truth. Which slice a person sees is
  // derived per role below, so a booking is visible to the Student and the Tutor
  // at the same time instead of living in two separate arrays.
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [availability, setAvailability] = useState(() => seedAvailability(TUTORS));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pcl-theme-v7', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    localStorage.setItem('pcl-accent-v7', JSON.stringify(accent));
  }, [accent]);

  useEffect(() => {
    localStorage.setItem('pcl-sidebar-v7', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (user) localStorage.setItem('pcl-user-v7', JSON.stringify(user));
    else localStorage.removeItem('pcl-user-v7');
  }, [user]);

  // Login checks the hardcoded account list; no backend or real auth is needed for UTS.
  const login = (credentials) => {
    const account = DEMO_ACCOUNTS.find(
      (item) => item.username === credentials.username && item.password === credentials.password && item.role === credentials.role,
    );
    if (!account) return false;
    setUser(account);
    return true;
  };

  const logout = () => setUser(null);

  const updateUser = (patch) => {
    setUser((current) => current ? { ...current, ...patch } : current);
  };

  // Booking creates both sides of the same request so Student and Tutor views stay in sync.
  const createSession = (payload) => {
    const stamp = Date.now();
    const sessionId = `s${stamp}`;
    const requestId = `r${stamp}`;
    const request = {
      id: requestId,
      sessionId,
      tutorId: payload.tutorId,
      tutorName: payload.tutorName,
      studentName: user.name,
      studentInitials: user.initials,
      subject: payload.subject,
      topic: payload.topic,
      date: payload.date,
      time: payload.time,
      mode: payload.mode,
      // The meeting place is part of the request, not just the session, so the tutor
      // can see where an in-person booking will happen before accepting it.
      location: payload.location || '',
      status: 'Pending',
      custom: payload.custom,
      message: payload.notes || 'Student requested support.',
    };
    const session = { ...payload, id: sessionId, studentName: user.name, status: 'Pending' };
    setSessions((items) => [session, ...items]);
    setRequests((items) => [request, ...items]);
    return request;
  };

  // Tutor decisions update the request and its matching session together.
  const requestAction = (id, action, details = {}) => {
    const matched = requests.find((item) => item.id === id);
    if (!matched) return;

    const nextRequestStatus = action === 'confirmed' ? 'Confirmed' : action === 'rejected' ? 'Rejected' : 'Suggested';
    const nextSessionStatus = action === 'confirmed' ? 'Confirmed' : action === 'rejected' ? 'Cancelled' : 'Pending';

    // Only schedule fields are copied across, and the tutor's reply is kept in its own
    // `suggestion` field. The student's original message is never overwritten, so the
    // request and the matching session can no longer end up describing the same
    // booking in two different ways.
    const schedule = {};
    ['date', 'time', 'alternative'].forEach((field) => {
      if (details[field] !== undefined) schedule[field] = details[field];
    });
    const suggestion = details.suggestion ? { suggestion: details.suggestion } : {};

    setRequests((items) => items.map((item) => item.id === id ? { ...item, status: nextRequestStatus, ...schedule, ...suggestion } : item));
    setSessions((items) => items.map((session) => session.id === matched.sessionId ? { ...session, status: nextSessionStatus, ...schedule } : session));
  };

  // Slots are stored as objects so a published in-person hour keeps its mode and
  // meeting place all the way to the booking form.
  const addAvailability = (tutorId, date, slot) => {
    setAvailability((current) => {
      const existing = current[tutorId]?.[date] || [];
      if (existing.some((item) => slotKey(item) === slotKey(slot))) return current;
      return {
        ...current,
        [tutorId]: {
          ...(current[tutorId] || {}),
          [date]: [...existing, slot].sort((a, b) => a.time.localeCompare(b.time)),
        },
      };
    });
  };

  const removeAvailability = (tutorId, date, key) => {
    setAvailability((current) => ({
      ...current,
      [tutorId]: {
        ...(current[tutorId] || {}),
        [date]: (current[tutorId]?.[date] || []).filter((item) => slotKey(item) !== key),
      },
    }));
  };

  // Only the requests this person is actually involved in. Students match on
  // their own name, tutors on the tutor they signed in as.
  const visibleRequests = useMemo(() => {
    if (!user) return [];
    return user.role === 'student'
      ? requests.filter((item) => item.studentName === user.name)
      : requests.filter((item) => item.tutorId === user.tutorId);
  }, [user, requests]);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />} />
      <Route
        path="*"
        element={(
          <ProtectedRoutes user={user}>
            <AppShell
              user={user}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onOpenSettings={() => setSettingsOpen(true)}
              onLogout={logout}
            >
              <Routes>
                <Route path="/" element={<DashboardPage user={user} sessions={sessions} requests={visibleRequests} />} />
                <Route path="/find" element={<FindTutorPage />} />
                <Route path="/sessions" element={<SessionsPage user={user} sessions={sessions} requests={visibleRequests} availability={availability} />} />
                <Route path="/activity" element={<ActivityPage user={user} />} />
                <Route path="/notifications" element={<ActivityPage user={user} notificationsOnly />} />
                <Route path="/requests" element={<RequestsPage user={user} requests={visibleRequests} onRequestAction={requestAction} />} />
                <Route path="/availability" element={<AvailabilityPage user={user} availability={availability} onAddAvailability={addAvailability} onRemoveAvailability={removeAvailability} />} />
                <Route path="/subjects" element={<SubjectsPage user={user} />} />
                <Route path="/profile" element={<ProfilePage user={user} onSave={updateUser} />} />
                <Route path="/tutor/:id" element={<TutorDetailPage user={user} availability={availability} />} />
                <Route path="/booking" element={<FormPage user={user} requests={visibleRequests} availability={availability} onCreateSession={createSession} onAddAvailability={addAvailability} onRequestAction={requestAction} />} />
                <Route path="/form" element={<Navigate to="/booking" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} />
            </AppShell>
          </ProtectedRoutes>
        )}
      />
    </Routes>
  );
}
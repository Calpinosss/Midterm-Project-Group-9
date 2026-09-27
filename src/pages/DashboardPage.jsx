import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { Icon } from '../components/icons';
import { CALENDAR_EVENTS, TUTORS } from '../data/mockData';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`));
}

function QuickCalendar({ sessions, requests, role }) {
  const navigate = useNavigate();
  const nextDays = Array.from({ length: 5 }, (_, index) => {
    const date = new Date('2026-09-28T12:00:00');
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const items = [
    ...CALENDAR_EVENTS,
    ...sessions.map((session) => ({ id: session.id, date: session.date, time: session.time, label: session.subject, type: 'session' })),
    ...requests.map((request) => ({ id: request.id, date: request.date, time: request.time, label: `${request.subject} · ${role === 'tutor' ? request.studentName : request.tutorName}`, type: 'request' })),
  ];

  return (
    <section className="home-card home-calendar-card">
      <div className="home-card-head"><div><span className="eyebrow">This week</span><h2>Calendar snapshot</h2><p>Only your next commitments stay visible here.</p></div><Link className="text-link" to="/sessions">Open calendar <Icon name="arrowRight" size={14} /></Link></div>
      <div className="mini-week">
        {nextDays.map((date) => {
          const day = new Date(`${date}T12:00:00`);
          const dayItems = items.filter((item) => item.date === date).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <button type="button" className={`mini-day ${dayItems.length ? 'has-item' : ''}`} key={date} onClick={() => navigate(`/sessions?date=${date}`)}>
              <span>{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(day)}</span>
              <strong>{day.getDate()}</strong>
              <small>{dayItems[0] ? dayItems[0].time : 'Open'}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PendingSummary({ requests, role }) {
  const navigate = useNavigate();
  const pending = requests.filter((item) => item.status === 'Pending' || (role === 'student' && item.status === 'Suggested'));
  const featured = pending.slice(0, 2);
  return (
    <section className="home-card pending-summary">
      <div className="home-card-head"><div><span className="eyebrow">Needs attention</span><h2>Pending requests</h2><p>{pending.length ? `${pending.length} request${pending.length > 1 ? 's' : ''} need your attention.` : 'Nothing is waiting right now.'}</p></div><span className="count-badge">{pending.length}</span></div>
      {featured.length ? <div className="pending-preview-list">{featured.map((item) => (
        <button type="button" key={item.id} className="pending-preview" onClick={() => navigate('/requests')}>
          <Avatar initials={role === 'tutor' ? item.studentInitials : item.subject.slice(0, 2).toUpperCase()} accent={role === 'tutor' ? '#3568C8' : '#0B8F68'} />
          <span className="pending-preview-copy"><strong>{role === 'tutor' ? item.studentName : item.subject}</strong><small>{item.topic}</small><em>{formatDate(item.date)} · {item.time}</em></span>
          <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
        </button>
      ))}</div> : <div className="home-empty"><Icon name="check" size={18} /><span>You're all caught up.</span></div>}
      <button type="button" className="secondary-button full-inline" onClick={() => navigate('/requests')}>Open requests <Icon name="arrowRight" size={14} /></button>
    </section>
  );
}

function SearchHero({ onSearch }) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const subjects = ['Linear Algebra', 'Deep Learning', 'Calculus', 'Human Computer Interaction', 'Web Development'];
  const submit = (event) => {
    event.preventDefault();
    onSearch(query || subject ? { q: query, subject } : {});
  };
  return (
    <section className="search-hero home-search-hero">
      <div className="search-hero-copy"><span className="eyebrow">Start here</span><h2>What do you need help with?</h2><p>Search the subject first. Then compare tutors on one calm, focused page.</p></div>
      <form className="search-box-wrap" onSubmit={submit}>
        <Icon name="search" size={19} />
        <input aria-label="Search tutor or subject" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a subject or tutor…" />
        <button type="submit" className="primary-button small search-submit">Search</button>
      </form>
      <div className="subject-filter-row">{subjects.map((item) => <button type="button" className={`filter-chip ${subject === item ? 'selected' : ''}`} key={item} onClick={() => { setSubject(item); setQuery(''); onSearch({ subject: item }); }}>{item}</button>)}<button type="button" className="filter-chip more" onClick={() => onSearch({})}>Browse all subjects</button></div>
    </section>
  );
}

export default function DashboardPage({ user, sessions = [], requests = [] }) {
  const navigate = useNavigate();
  const isStudent = user.role === 'student';
  const visibleSessions = sessions.filter((session) => isStudent ? session.studentName === user.name : session.tutorId === user.tutorId);
  const nextSession = visibleSessions.find((session) => session.status === 'Confirmed') || visibleSessions[0];
  const currentTutor = TUTORS.find((item) => item.id === nextSession?.tutorId) || TUTORS[0];

  const goSearch = (params) => {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.subject) search.set('subject', params.subject);
    navigate(`/find${search.toString() ? `?${search}` : ''}`);
  };

  return (
    <div className="dashboard-page clean-dashboard">
      <section className="page-intro home-intro">
        <div><span className="eyebrow">{isStudent ? 'Student workspace' : 'Tutor workspace'}</span><h1>{isStudent ? 'Find help that fits your schedule.' : 'Make every tutoring hour count.'}</h1><p>{isStudent ? 'PCL Tutor keeps the discovery, request, and calendar flow simple so you can get to the right study session quickly.' : 'Handle the requests that matter, keep your schedule visible, and publish availability without digging through unrelated pages.'}</p></div>
        <div className="page-intro-actions"><button className="primary-button" onClick={() => navigate(isStudent ? '/find' : '/availability')}><Icon name="plus" size={16} /> {isStudent ? 'Quick book' : 'Add availability'}</button></div>
      </section>

      {isStudent ? (
        <>
          <SearchHero onSearch={goSearch} />
          <section className="home-primary-grid">
            <PendingSummary requests={requests} role="student" />
            <section className="home-card next-session-compact">
              <div className="home-card-head"><div><span className="eyebrow">Next session</span><h2>{nextSession ? nextSession.subject : 'No session yet'}</h2><p>{nextSession ? nextSession.topic : 'Your confirmed study sessions will appear here.'}</p></div><span className={`status-pill ${nextSession?.status?.toLowerCase() || 'pending'}`}>{nextSession?.status || 'Open'}</span></div>
              {nextSession ? <><div className="next-session-line"><strong>{formatDate(nextSession.date)}</strong><span>{nextSession.time} · {nextSession.mode}{nextSession.location ? ` · ${nextSession.location}` : ''}</span></div><div className="next-session-person"><Avatar initials={currentTutor.initials} accent={currentTutor.accent} /><div><strong>{nextSession.tutorName}</strong><span>{currentTutor.major}</span></div></div><Link className="secondary-button" to="/sessions">See all sessions <Icon name="arrowRight" size={14} /></Link></> : <Link className="primary-button" to="/find">Find a tutor</Link>}
            </section>
          </section>
          <QuickCalendar sessions={visibleSessions} requests={requests} role="student" />
        </>
      ) : (
        <>
          <section className="tutor-home-grid">
            <section className="home-card tutor-next-card">
              <div className="home-card-head"><div><span className="eyebrow">Upcoming session</span><h2>{nextSession ? nextSession.subject : 'You are all clear.'}</h2><p>{nextSession ? nextSession.topic : 'No confirmed sessions are on your schedule yet.'}</p></div><span className={`status-pill ${nextSession?.status?.toLowerCase() || 'confirmed'}`}>{nextSession?.status || 'Open'}</span></div>
              {nextSession && <div className="tutor-next-detail"><div><span className="muted-label">When</span><strong>{formatDate(nextSession.date)}</strong><span>{nextSession.time} · {nextSession.mode}</span></div><div><span className="muted-label">Student</span><strong>{nextSession.studentName}</strong><span>Student / Mentee</span></div></div>}
              <div className="home-card-actions"><Link className="secondary-button" to="/sessions">Open calendar</Link><Link className="primary-button" to="/requests">Review requests</Link></div>
            </section>
            <section className="home-card availability-snapshot"><div className="home-card-head"><div><span className="eyebrow">Your week</span><h2>Availability</h2><p>Keep your open hours easy to discover.</p></div><Link className="text-link" to="/availability">Manage <Icon name="arrowRight" size={14} /></Link></div><div className="availability-snapshot-grid">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => <button type="button" key={day} onClick={() => navigate('/availability')}><span>{day}</span><strong>{[2, 2, 1, 2, 1][index]}</strong><small>open slots</small></button>)}</div></section>
          </section>
          <PendingSummary requests={requests} role="tutor" />
          <QuickCalendar sessions={visibleSessions} requests={requests} role="tutor" />
        </>
      )}
    </div>
  );
}

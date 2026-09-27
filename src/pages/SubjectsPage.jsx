import React, { useState } from 'react';
import { SUBJECTS } from '../data/mockData';
import { Icon } from '../components/icons';

const initial = ['Programming Fundamentals', 'C', 'Advanced C++'];

export default function SubjectsPage({ user }) {
  const [subjects, setSubjects] = useState(initial);
  const [saved, setSaved] = useState(false);
  if (user.role !== 'tutor') return <div className="empty-state large"><strong>Subject management is tutor-only.</strong><span>Students discover subjects through the Find a Tutor page.</span></div>;
  const toggle = (subject) => { setSaved(false); setSubjects((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]); };
  return (
    <div className="workspace-page">
      <header className="workspace-header"><div><span className="eyebrow">Tutor profile</span><h1>Subjects you teach.</h1><p>Keep this list short and accurate so students can find you for the right course.</p></div><button className="primary-button" onClick={() => setSaved(true)}><Icon name="check" size={16} /> Save subjects</button></header>
      <section className="subjects-manager-card"><div className="section-head-inline"><div><span className="eyebrow">Current teaching list</span><h2>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</h2><p>Tap a subject to include or remove it from your tutor profile.</p></div>{saved && <span className="save-confirm"><Icon name="check" size={14} /> Saved in this demo</span>}</div><div className="subjects-manager-grid">{SUBJECTS.map((subject) => <button type="button" key={subject} className={`subject-manager-item ${subjects.includes(subject) ? 'selected' : ''}`} onClick={() => toggle(subject)}><span>{subjects.includes(subject) ? <Icon name="check" size={15} /> : <span className="subject-empty-mark" />}</span><strong>{subject}</strong></button>)}</div></section>
    </div>
  );
}

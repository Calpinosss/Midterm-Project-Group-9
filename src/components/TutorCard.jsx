import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { Icon } from './icons';

export default function TutorCard({ tutor }) {
  return (
    <article className="tutor-card">
      <div className="tutor-card-accent" style={{ background: tutor.accent }} />
      <div className="tutor-card-head">
        <Avatar initials={tutor.initials} accent={tutor.accent} />
        <div className="tutor-main-copy">
          <div className="name-line"><h3>{tutor.name}</h3><span className="online-pill">Available</span></div>
          <p>{tutor.major} · Sem {tutor.semester}</p>
        </div>
      </div>
      <div className="subject-row">{tutor.subjects.slice(0, 2).map((subject) => <span className="subject-chip" key={subject}>{subject}</span>)}{tutor.subjects.length > 2 && <span className="subject-chip subtle">+{tutor.subjects.length - 2}</span>}</div>
      <div className="tutor-stats">
        <span><Icon name="star" size={14} /> {tutor.rating}</span>
        <span>{tutor.sessions} sessions</span>
        <span>{tutor.participantsToday} today</span>
      </div>
      <div className="tutor-card-actions">
        <Link className="primary-button small" to={`/tutor/${tutor.id}`}>View tutor profile <Icon name="arrowRight" size={14} /></Link>
      </div>
    </article>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './icons';

const targets = {
  session: '/sessions',
  reminder: '/sessions',
  tutor: '/find',
  request: '/requests',
  schedule: '/availability',
};

export default function NotificationPopover({ items, onClose }) {
  return (
    <div className="notification-popover" role="dialog" aria-label="Notifications">
      <div className="notification-head">
        <div>
          <span className="eyebrow">Updates</span>
          <strong>Notifications</strong>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close notifications"><Icon name="close" size={17} /></button>
      </div>
      <div className="notification-list">
        {items.length === 0 ? (
          <div className="empty-state compact"><Icon name="bell" size={20} /><strong>No updates yet</strong><span>You'll see booking and session updates here.</span></div>
        ) : items.map((item) => (
          <Link className="notification-item" to={targets[item.type] || '/activity'} key={item.id} onClick={onClose}>
            <span className="notification-dot" />
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <span>{item.time}</span>
            </div>
            <Icon name="arrowRight" size={14} />
          </Link>
        ))}
      </div>
      <Link className="notification-footer" to="/activity" onClick={onClose}>Go to activity <Icon name="arrowRight" size={14} /></Link>
    </div>
  );
}

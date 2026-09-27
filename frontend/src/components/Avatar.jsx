import React from 'react';

export default function Avatar({ initials, accent = '#0B8F68', size = 'md' }) {
  return <span className={`avatar avatar-${size}`} style={{ '--avatar-accent': accent }}>{initials}</span>;
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/icons';

export default function NotFoundPage() {
  return (
    <div className="empty-state large not-found">
      <span className="eyebrow">404</span>
      <strong>That page is not part of PCL Tutor.</strong>
      <span>Use the menu to return to the workspace.</span>
      <Link className="primary-button" to="/">Back to home <Icon name="arrowRight" size={15} /></Link>
    </div>
  );
}

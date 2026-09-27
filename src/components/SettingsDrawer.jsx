import React from 'react';
import { Icon } from './icons';

export default function SettingsDrawer({ open, onClose, theme, setTheme, accent, setAccent }) {
  if (!open) return null;
  return (
    <>
      <button className="drawer-scrim" onClick={onClose} aria-label="Close settings" />
      <aside className="settings-drawer" aria-label="Settings">
        <div className="drawer-head">
          <div><span className="eyebrow">Preferences</span><h2>Settings</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings"><Icon name="close" size={18} /></button>
        </div>

        <section className="settings-section">
          <span className="settings-label">Appearance</span>
          <div className="segmented">
            {['light', 'dark'].map((item) => <button key={item} className={theme === item ? 'selected' : ''} onClick={() => setTheme(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
          </div>
        </section>

        <section className="settings-section">
          <span className="settings-label">Accent color</span>
          <div className="accent-grid">
            {['#0B8F68', '#3568C8', '#7A5AF8', '#D97706', '#B83B5E'].map((color) => <button key={color} className={`accent-swatch ${accent === color ? 'selected' : ''}`} style={{ background: color }} onClick={() => setAccent(color)} aria-label={`Use ${color}`} />)}
          </div>
        </section>

        <section className="settings-note">
          <strong>Design rule</strong>
          <p>PCL Tutor keeps the primary action visually dominant and uses the same spacing, button, card, and type patterns across all pages.</p>
        </section>
      </aside>
    </>
  );
}

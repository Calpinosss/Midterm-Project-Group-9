import React, { useEffect, useId, useRef } from 'react';
import { Icon } from './icons';

const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// One accessible confirm/cancel step in front of an action that should not happen by
// reflex: Cancel is focused on open so a reflexive Enter cancels instead of sending, Tab
// is trapped inside the dialog, Escape and a click on the backdrop cancel, and focus
// returns to whatever opened it.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const cancelButtonRef = useRef(null);
  // The handler is held in a ref so the effect only reacts to `open`. Depending on an
  // inline arrow from the parent would tear down and rebuild the listeners on every
  // render, which would yank focus back mid-interaction.
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return undefined;

    const opener = document.activeElement;
    // Cancel is focused, not the action. These dialogs are the fix for "Enter sends it
    // before I have finished", so the first Enter must not be able to send anything.
    cancelButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...(panelRef.current?.querySelectorAll(FOCUSABLE) || [])];
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Send focus back to the control that opened the dialog, unless that control has
      // already been removed (which is the normal case after deleting something).
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="confirm-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}
    >
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={panelRef}
      >
        <span className={`confirm-mark ${tone}`}><Icon name={tone === 'danger' ? 'x' : 'check'} size={18} /></span>
        <h2 id={titleId}>{title}</h2>
        {/* A div rather than a p, because the sending flows pass a review summary here
            and a block-level table is not valid inside a paragraph. */}
        <div className="confirm-description" id={descriptionId}>{description}</div>
        <div className="confirm-actions">
          <button type="button" className="ghost-button" onClick={onCancel} ref={cancelButtonRef}>{cancelLabel}</button>
          <button
            type="button"
            className={tone === 'danger' ? 'danger-button' : 'primary-button'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

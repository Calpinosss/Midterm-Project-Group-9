import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { STUDENT, TUTOR, renderApp, signInAs } from './helpers';

// Nothing in the app used to ask before an irreversible action, so a single misclick on
// Decline, Remove slot, or Log out took effect immediately.
describe('confirmation dialog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const Harness = ({ onConfirm, onCancel, confirmLabel = 'Remove slot' }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Open</button>
        <ConfirmDialog
          open={open}
          title="Remove this open slot?"
          description="The 09:00 online slot will stop being offered."
          confirmLabel={confirmLabel}
          onConfirm={() => { onConfirm(); setOpen(false); }}
          onCancel={() => { onCancel(); setOpen(false); }}
        />
      </>
    );
  };

  const setup = (props) => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<Harness onConfirm={onConfirm} onCancel={onCancel} {...props} />);
    return { onConfirm, onCancel, opener: screen.getByRole('button', { name: 'Open' }) };
  };

  it('renders nothing while closed', () => {
    setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a labelled modal once opened', async () => {
    const user = userEvent.setup();
    const { opener } = setup();

    await user.click(opener);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // The title and description are wired to the dialog so a screen reader announces them.
    expect(dialog).toHaveAccessibleName('Remove this open slot?');
    expect(dialog).toHaveAccessibleDescription('The 09:00 online slot will stop being offered.');
  });

  it('runs the action only on the confirm button', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel, opener } = setup();

    await user.click(opener);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove slot' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancels on the cancel button without running the action', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel, opener } = setup();

    await user.click(opener);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancels on Escape', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel, opener } = setup();

    await user.click(opener);
    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancels when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel, opener } = setup();

    await user.click(opener);
    // The dialog is the backdrop's only child, so a click on the backdrop itself is a
    // click outside the panel.
    await user.click(screen.getByRole('dialog').parentElement);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('focuses cancel by default so a reflexive Enter cancels, and keeps Tab inside', async () => {
    const user = userEvent.setup();
    const { onConfirm, opener } = setup();

    await user.click(opener);
    const dialog = screen.getByRole('dialog');
    // The safe choice is focused first, so Enter does not run the action.
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    // The keypress that originally caused the bug now dismisses the dialog instead.
    await user.keyboard('{Enter}');
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps Tab inside the dialog and returns focus to the opener', async () => {
    const user = userEvent.setup();
    const { opener } = setup();

    await user.click(opener);
    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Remove slot' });
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });

    // Two buttons, so Tab from the last wraps to the first and never leaves the dialog.
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(opener).toHaveFocus();
  });

  it('returns focus to the control that opened it', async () => {
    const user = userEvent.setup();
    const { opener } = setup();

    await user.click(opener);
    await user.keyboard('{Escape}');

    expect(opener).toHaveFocus();
  });

  it('does not lock a user out of a cancelled log out', async () => {
    signInAs(TUTOR);
    const user = userEvent.setup();
    renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Log out' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    // Cancelling keeps the session, so the protected shell is still mounted.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('Tutor / Mentor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('names the signed-in person in the log out prompt', async () => {
    signInAs(STUDENT);
    const user = userEvent.setup();
    renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent(STUDENT.name);
  });
});
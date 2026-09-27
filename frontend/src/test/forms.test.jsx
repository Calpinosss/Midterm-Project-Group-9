import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { blockImplicitSubmit } from '../lib/forms';
import { STUDENT, TUTOR, cancelDialog, renderApp, signInAs } from './helpers';

// Browsers submit a form when Enter lands in a text field. That is right for a search
// box or a sign-in form, and wrong for the forms that publish, send, or save.
describe('blockImplicitSubmit', () => {
  const makeEvent = (key, { tagName = 'INPUT', shiftKey = false, ctrlKey = false, isContentEditable = false } = {}) => ({
    key,
    shiftKey,
    ctrlKey,
    metaKey: false,
    altKey: false,
    preventDefault: vi.fn(),
    target: { tagName, isContentEditable },
  });

  it('blocks a plain Enter in a text-like field', () => {
    ['INPUT', 'SELECT'].forEach((tagName) => {
      const event = makeEvent('Enter', { tagName });
      blockImplicitSubmit(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  it('leaves the newline alone inside a textarea', () => {
    const event = makeEvent('Enter', { tagName: 'TEXTAREA' });
    blockImplicitSubmit(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  // A focused button already activates on Enter, so blocking it would break keyboard use.
  it('leaves Enter alone on a button, a link, and editable text', () => {
    ['BUTTON', 'A'].forEach((tagName) => {
      const event = makeEvent('Enter', { tagName });
      blockImplicitSubmit(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
    const editable = makeEvent('Enter', { isContentEditable: true });
    blockImplicitSubmit(editable);
    expect(editable.preventDefault).not.toHaveBeenCalled();
  });

  it('leaves explicit shortcuts such as Ctrl+Enter alone', () => {
    const event = makeEvent('Enter', { ctrlKey: true });
    blockImplicitSubmit(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('ignores every other key', () => {
    ['a', 'Tab', 'Escape'].forEach((key) => {
      const event = makeEvent(key);
      blockImplicitSubmit(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});

describe('suggest another time form', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(TUTOR);
  });

  // Suggesting a time is a send, so it gets the same Enter treatment as booking. The
  // tutor can still be mid-thought in the message box when they press Enter.
  it('does not send the suggestion when Enter is pressed in the message box', async () => {
    const user = userEvent.setup();
    renderApp('/booking?mode=suggest&request=sr1');

    const message = await screen.findByLabelText(/^message$/i);
    await user.type(message, 'This slot suits me better{Enter}');

    expect(screen.queryByText(/Suggestion sent/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /send suggestion/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/Suggestion sent/i)).not.toBeInTheDocument();
  });

  // A textarea is where a tutor writes a real explanation, so the newline has to work.
  it('still lets the tutor press Enter inside the message box', async () => {
    const user = userEvent.setup();
    renderApp('/booking?mode=suggest&request=sr1');

    const message = await screen.findByLabelText(/^message$/i);
    await user.type(message, 'first line{Enter}second line');

    expect(message).toHaveValue('first line\nsecond line');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the typed message after cancelling the review', async () => {
    const user = userEvent.setup();
    renderApp('/booking?mode=suggest&request=sr1');

    await user.type(await screen.findByLabelText(/^message$/i), 'Evening works better');
    await user.click(screen.getByRole('button', { name: /send suggestion/i }));
    await cancelDialog(user);

    // Cancelling returns to the form, and the draft is still there to edit.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^message$/i)).toHaveValue('Evening works better');
    expect(screen.queryByText(/Suggestion sent/i)).not.toBeInTheDocument();
  });
});

describe('profile form', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(STUDENT);
  });

  it('does not save when Enter is pressed in a field', async () => {
    const user = userEvent.setup();
    renderApp('/profile');

    const name = await screen.findByLabelText(/full name/i);
    await user.clear(name);
    await user.type(name, 'Nathan Andrew-Saved{Enter}');

    // The saved marker is the visible proof that the form submitted, so it must not
    // appear from a stray keypress.
    expect(screen.queryByText(/saved locally for this demo/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/saved locally for this demo/i)).toBeInTheDocument();
  });

  it('persists the saved name to the signed-in account', async () => {
    const user = userEvent.setup();
    renderApp('/profile');

    const name = await screen.findByLabelText(/full name/i);
    await user.clear(name);
    await user.type(name, 'Nathan Brooks{Enter}');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('pcl-user-v7'));
      expect(stored.name).toBe('Nathan Brooks');
      // Initials are derived, so they follow the new name rather than going stale.
      expect(stored.initials).toBe('NB');
    });
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TUTORS } from '../data/mockData';
import { datesForWeek } from '../components/CalendarWorkspace';
import { TUTOR, renderApp, signInAs } from './helpers';

const tutor = TUTORS.find((item) => item.id === 't1');
// The publishing form and the calendar panel both default to the first day of week 0.
const day = datesForWeek(0)[0];
const freeTime = ['08:30', '12:00', '18:00'].find((time) => !tutor.availability[day].some((slot) => slot.time === time));

const formPanel = () => document.querySelector('.availability-create-card');
const slotPanel = () => within(document.querySelector('.open-slots-panel'));
const removeName = new RegExp(`Remove ${freeTime} Online slot`, 'i');

// Every control on the Availability page has to report what it did. A button that
// silently does nothing is indistinguishable from a broken one.
describe('tutor availability feedback', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(TUTOR);
  });

  const publishOnline = async (user) => {
    renderApp('/availability');
    fireEvent.change(await screen.findByLabelText(/^date$/i), { target: { value: day } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: freeTime } });
    await user.click(screen.getByRole('button', { name: /publish availability/i }));
  };

  // The panel used to read only the slots added in this session, so a fresh load said
  // "No open slots" on days that the agenda beside it listed hours for.
  it('lists the published slots on a fresh load, matching the agenda', async () => {
    renderApp('/availability');

    const published = tutor.availability[day];
    expect(published.length).toBeGreaterThan(0);
    published.forEach((slot) => {
      const row = slotPanel().getByText(slot.time).closest('.open-slot');
      expect(within(row).getByText(slot.mode)).toBeInTheDocument();
      if (slot.mode === 'Offline') expect(within(row).getByText(slot.location)).toBeInTheDocument();
    });

    expect(slotPanel().getByText(`${published.length} slots`)).toBeInTheDocument();
    expect(slotPanel().queryByText(/no open slot on this day yet/i)).not.toBeInTheDocument();
    // The week strip counts the same slots rather than reporting zero all week.
    expect(document.querySelector('.week-day')).toHaveTextContent(`${published.length} open`);
  });

  it('confirms a published slot instead of changing nothing', async () => {
    const user = userEvent.setup();
    await publishOnline(user);

    await waitFor(() => expect(within(formPanel()).getByRole('status')).toHaveTextContent(new RegExp(`Published ${freeTime} · Online`)));
  });

  it('names the room in the confirmation for an in-person slot', async () => {
    const user = userEvent.setup();
    renderApp('/availability');

    fireEvent.change(await screen.findByLabelText(/^date$/i), { target: { value: day } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: freeTime } });
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await user.type(screen.getByLabelText(/meeting room/i), 'Innovation lab, Engineering 3');
    await user.click(screen.getByRole('button', { name: /publish availability/i }));

    await waitFor(() => expect(within(formPanel()).getByRole('status')).toHaveTextContent(/Innovation lab, Engineering 3/));
  });

  // App de-duplicates silently, so the page has to detect it and explain it.
  it('rejects publishing the same slot twice', async () => {
    const user = userEvent.setup();
    await publishOnline(user);
    await waitFor(() => expect(within(formPanel()).getByRole('status')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /publish availability/i }));
    await waitFor(() => expect(within(formPanel()).getByRole('alert')).toHaveTextContent(/already have an online slot/i));
  });

  // Publishing a time the tutor already offers must be refused, not silently doubled.
  it('refuses to publish a time that is already on offer', async () => {
    const user = userEvent.setup();
    renderApp('/availability');

    // A slot is identified by time *and* format, so the format has to match the one
    // already published to make this a genuine duplicate.
    const taken = tutor.availability[day][0];
    fireEvent.change(await screen.findByLabelText(/^date$/i), { target: { value: day } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: taken.time } });
    if (taken.mode === 'Offline') {
      await user.click(screen.getByRole('button', { name: 'Offline' }));
      await user.type(screen.getByLabelText(/meeting room/i), taken.location);
    }
    await user.click(screen.getByRole('button', { name: /publish availability/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already have/i);
  });

  it('still refuses an in-person slot with no room', async () => {
    const user = userEvent.setup();
    renderApp('/availability');

    await user.click(await screen.findByRole('button', { name: 'Offline' }));
    await user.click(screen.getByRole('button', { name: /publish availability/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/add a meeting room/i);
  });

  // Pressing Enter in a field used to submit the form, which published a slot by accident.
  it('does not publish when Enter is pressed in a field', async () => {
    const user = userEvent.setup();
    renderApp('/availability');

    const timeField = await screen.findByLabelText(/start time/i);
    fireEvent.change(screen.getByLabelText(/^date$/i), { target: { value: day } });
    fireEvent.change(timeField, { target: { value: freeTime } });
    await user.type(timeField, '{Enter}');

    expect(within(formPanel()).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(formPanel()).queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: removeName })).not.toBeInTheDocument();

    // The button still publishes, so nobody is locked out of the form.
    await user.click(screen.getByRole('button', { name: /publish availability/i }));
    expect(await screen.findByRole('button', { name: removeName })).toBeInTheDocument();
  });

  // Removing a slot cannot be undone from the agenda, so it waits for a confirmation.
  it('asks before removing a slot and keeps it when cancelled', async () => {
    const user = userEvent.setup();
    await publishOnline(user);

    await user.click(await screen.findByRole('button', { name: removeName }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/remove this open slot/i);
    expect(dialog).toHaveTextContent(new RegExp(freeTime));

    // Nothing is removed while the dialog is open.
    expect(screen.getByRole('button', { name: removeName })).toBeInTheDocument();
    expect(slotPanel().queryByRole('status')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: removeName })).toBeInTheDocument();
    expect(slotPanel().queryByRole('status')).not.toBeInTheDocument();
  });

  it('removes the slot and reports it in the calendar panel', async () => {
    const user = userEvent.setup();
    await publishOnline(user);

    await user.click(await screen.findByRole('button', { name: removeName }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove slot' }));

    await waitFor(() => expect(slotPanel().getByRole('status')).toHaveTextContent(`Removed the ${freeTime} online slot`));
    expect(screen.queryByRole('button', { name: removeName })).not.toBeInTheDocument();
  });

  it('puts a removed slot back when Undo is pressed', async () => {
    const user = userEvent.setup();
    await publishOnline(user);

    await user.click(await screen.findByRole('button', { name: removeName }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove slot' }));
    await waitFor(() => expect(slotPanel().getByRole('status')).toHaveTextContent('Removed'));

    await user.click(slotPanel().getByRole('button', { name: 'Undo' }));

    expect(screen.getByRole('button', { name: removeName })).toBeInTheDocument();
    expect(slotPanel().getByRole('status')).toHaveTextContent(`Restored the ${freeTime} online slot`);
  });

  // A published slot is a real commitment, so it is removable too, not just the extras.
  it('lets a published slot be removed once confirmed', async () => {
    const user = userEvent.setup();
    renderApp('/availability');

    const first = tutor.availability[day][0];
    await user.click(await screen.findByRole('button', { name: new RegExp(`Remove ${first.time} ${first.mode} slot`, 'i') }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove slot' }));

    await waitFor(() => expect(slotPanel().getByRole('status')).toHaveTextContent(`Removed the ${first.time} ${first.mode.toLowerCase()} slot`));
    expect(screen.queryByRole('button', { name: new RegExp(`Remove ${first.time} ${first.mode} slot`, 'i') })).not.toBeInTheDocument();
  });

  // This button used to navigate to /availability while already being on /availability,
  // so pressing it did nothing at all. It now jumps to the publishing form instead.
  it('focuses the publishing form when Add another slot is pressed', async () => {
    const user = userEvent.setup();
    renderApp('/availability');

    const button = await screen.findByRole('button', { name: /add another slot/i });
    expect(button).toBeInTheDocument();
    // The label no longer claims to go somewhere, because it no longer navigates.
    expect(screen.queryByRole('button', { name: /manage availability/i })).not.toBeInTheDocument();

    await user.click(button);
    expect(screen.getByLabelText(/^date$/i)).toHaveFocus();
  });

  it('claims nothing was removed before anything is removed', async () => {
    renderApp('/availability');

    expect(slotPanel().queryByRole('status')).not.toBeInTheDocument();
  });
});

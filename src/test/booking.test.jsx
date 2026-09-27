import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TUTORS } from '../data/mockData';
import { STUDENT, TUTOR, cancelDialog, confirmDialog, renderApp, signInAs } from './helpers';

// The generated data is deliberately varied, so these tests read the real slots
// rather than hardcoding a time that a reshuffle would invalidate.
const tutor = TUTORS.find((item) => item.id === 't1');

function firstSlot(mode) {
  for (const [date, slots] of Object.entries(tutor.availability)) {
    const slot = slots.find((item) => item.mode === mode);
    if (slot) return { date, slot };
  }
  throw new Error(`fixture expected a ${mode} slot for t1`);
}

const online = firstSlot('Online');
const offline = firstSlot('Offline');

const lockedNote = () => document.querySelector('.locked-schedule-note');
const liveSummary = () => document.querySelector('.form-summary');

// A published slot is a fixed commitment the tutor already made, so the student must
// not be able to change its mode or replace its meeting place. The slot's own mode and
// room are what get booked, whether that is Online or in person.
describe('booking a published slot', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(STUDENT);
  });

  it('locks an in-person slot to the room the tutor published', async () => {
    renderApp(`/booking?tutor=t1&date=${offline.date}&time=${offline.slot.time}`);

    // No mode toggle and no location field at all on a fixed schedule.
    expect(await screen.findByLabelText(/available time/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Offline' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument();

    expect(lockedNote().textContent).toContain('Offline');
    expect(lockedNote().textContent).toContain(offline.slot.location);
    expect(within(liveSummary()).getByText(offline.slot.location)).toBeInTheDocument();
  });

  it('locks an online slot and names no meeting place', async () => {
    renderApp(`/booking?tutor=t1&date=${online.date}&time=${online.slot.time}`);

    expect(await screen.findByLabelText(/available time/i)).toBeInTheDocument();
    expect(lockedNote().textContent).toContain('Online');
    expect(lockedNote().textContent).not.toContain(online.date);
  });

  // Pressing Enter used to submit the booking form straight from any field, which sent
  // the request without the student ever touching the button. Now Enter does nothing
  // at all, and the button leads to a review step rather than straight to the tutor.
  it('does not send the request when Enter is pressed in the topic field', async () => {
    const user = userEvent.setup();
    renderApp(`/booking?tutor=t1&date=${online.date}&time=${online.slot.time}`);

    const topic = await screen.findByLabelText(/^topic$/i);
    await user.type(topic, 'Sorting complexity{Enter}');

    // No request and not even a prompt: the keypress is inert.
    expect(screen.queryByText(/You're on the tutor's radar/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // The button still works, so the form is not locked to keyboard-only refusal.
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/You're on the tutor's radar/i)).not.toBeInTheDocument();

    await confirmDialog(user, /send request/i);
    expect(await screen.findByText(/You're on the tutor's radar/i)).toBeInTheDocument();
  });

  // The whole point of the review step: the student can still change something.
  it('shows the exact payload for review and sends nothing until confirmed', async () => {
    const user = userEvent.setup();
    renderApp(`/booking?tutor=t1&date=${offline.date}&time=${offline.slot.time}`);

    await user.type(await screen.findByLabelText(/^topic$/i), 'RAII and smart pointers');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    const review = await screen.findByRole('dialog');
    expect(review).toHaveTextContent(/send this request/i);
    // Every field that is about to be sent is readable before it is sent.
    expect(review).toHaveTextContent('RAII and smart pointers');
    expect(review).toHaveTextContent(`${offline.date} · ${offline.slot.time}`);
    expect(review).toHaveTextContent('Offline');
    expect(review).toHaveTextContent(offline.slot.location);
    expect(screen.queryByText(/You're on the tutor's radar/i)).not.toBeInTheDocument();

    await cancelDialog(user);

    // Cancelling returns to the form with the typed topic still there, so nothing is lost.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^topic$/i)).toHaveValue('RAII and smart pointers');
    expect(screen.queryByText(/You're on the tutor's radar/i)).not.toBeInTheDocument();
  });

  it('lets the student edit the topic after cancelling the review', async () => {
    const user = userEvent.setup();
    renderApp(`/booking?tutor=t1&date=${online.date}&time=${online.slot.time}`);

    await user.type(await screen.findByLabelText(/^topic$/i), 'Wrong topic');
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    await cancelDialog(user);

    const topic = screen.getByLabelText(/^topic$/i);
    await user.clear(topic);
    await user.type(topic, 'Corrected topic');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Corrected topic');
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Wrong topic');
  });

  it('keeps the validation on the form rather than the review step', async () => {
    const user = userEvent.setup();
    renderApp(`/booking?tutor=t1&date=${online.date}&time=${online.slot.time}`);

    // An empty topic is refused before any review step is offered.
    await user.click(await screen.findByRole('button', { name: /submit request/i }));

    expect(await screen.findByText(/tell the tutor what you want help with/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // A textarea needs the newline, so the guard must not swallow Enter there.
  it('still lets the student press Enter inside a textarea', async () => {
    const user = userEvent.setup();
    renderApp(`/booking?tutor=t1&date=${online.date}&time=${online.slot.time}`);

    const notes = await screen.findByLabelText(/additional notes/i);
    await user.type(notes, 'first line{Enter}second line');

    expect(notes).toHaveValue('first line\nsecond line');
    expect(screen.queryByText(/You're on the tutor's radar/i)).not.toBeInTheDocument();
  });

  it('books an in-person published slot as Offline at the tutor room', async () => {
    const user = userEvent.setup();
    renderApp(`/booking?tutor=t1&date=${offline.date}&time=${offline.slot.time}`);

    await user.type(await screen.findByLabelText(/^topic$/i), 'RAII and smart pointers');
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    await confirmDialog(user, /send request/i);

    expect(await screen.findByText(/You're on the tutor's radar/i)).toBeInTheDocument();
    const summary = document.querySelector('.success-summary');
    expect(within(summary).getByText('Offline')).toBeInTheDocument();
    expect(within(summary).getByText(offline.slot.location)).toBeInTheDocument();
  });

  it('books an online published slot as Online with no room', async () => {
    const user = userEvent.setup();
    renderApp(`/booking?tutor=t1&date=${online.date}&time=${online.slot.time}`);

    await user.type(await screen.findByLabelText(/^topic$/i), 'Recursion base cases');
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    await confirmDialog(user, /send request/i);

    expect(await screen.findByText(/You're on the tutor's radar/i)).toBeInTheDocument();
    const summary = document.querySelector('.success-summary');
    expect(within(summary).getByText('Online')).toBeInTheDocument();
    expect(within(summary).queryByText(/Library|Commons|Lab|Discussion|Quiet|Tutorial|Group|Computer/)).not.toBeInTheDocument();
  });

  it('labels every published slot with its own mode and room', async () => {
    const user = userEvent.setup();
    renderApp('/booking?tutor=t1');

    const dateSelect = await screen.findByLabelText(/^date$/i);
    const timeSelect = screen.getByLabelText(/available time/i);

    for (const [date, slots] of Object.entries(tutor.availability)) {
      await user.selectOptions(dateSelect, date);
      const labels = within(timeSelect).getAllByRole('option').map((option) => option.textContent);
      slots.forEach((slot) => {
        const expected = `${slot.time} · ${slot.mode}${slot.mode === 'Offline' ? ` · ${slot.location}` : ''}`;
        expect(labels, `${date} ${slot.time}`).toContain(expected);
      });
    }
  });

  // A stale bookmark can name a slot the tutor has since withdrawn, and there is no
  // mode or room to fall back on, so it has to be refused.
  it('refuses a slot time the tutor does not publish', async () => {
    const user = userEvent.setup();
    renderApp(`/booking?tutor=t1&date=${online.date}&time=03:17`);

    await user.type(await screen.findByLabelText(/^topic$/i), 'Recursion base cases');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(await screen.findByText(/choose one of the available slots/i)).toBeInTheDocument();
  });
});

describe('booking a custom time', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(STUDENT);
  });

  it('lets the student propose Offline and a place on a custom-time request', async () => {
    const user = userEvent.setup();
    renderApp('/booking?tutor=t1');

    await user.click(await screen.findByRole('button', { name: /custom time/i }));
    expect(document.querySelector('.locked-schedule-note')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await user.type(await screen.findByLabelText(/location/i), 'Library study zone');
    await user.type(screen.getByLabelText(/^topic$/i), 'Pointers and ownership');
    await user.type(screen.getByLabelText(/preferred time/i), '15:00');

    // The live summary must show the proposed place, not just the mode.
    expect(within(liveSummary()).getByText('Library study zone')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /submit request/i }));
    // The student's own proposed place is part of the review, not just the mode.
    expect(await screen.findByRole('dialog')).toHaveTextContent('Library study zone');
    await confirmDialog(user, /send request/i);
    expect(await screen.findByText(/You're on the tutor's radar/i)).toBeInTheDocument();
    const summary = document.querySelector('.success-summary');
    expect(within(summary).getByText('Offline')).toBeInTheDocument();
    expect(within(summary).getByText('Library study zone')).toBeInTheDocument();
  });

  it('refuses an in-person custom request with no place given', async () => {
    const user = userEvent.setup();
    renderApp('/booking?tutor=t1');

    await user.click(await screen.findByRole('button', { name: /custom time/i }));
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await user.type(screen.getByLabelText(/^topic$/i), 'Pointers and ownership');
    await user.type(screen.getByLabelText(/preferred time/i), '15:00');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(await screen.findByText(/add a meeting location/i)).toBeInTheDocument();
  });

  // This is the reported bug: a place typed for a custom request used to survive
  // the switch and follow the student back onto a published slot.
  it('clears a typed place when switching from custom time back to a published slot', async () => {
    const user = userEvent.setup();
    renderApp('/booking?tutor=t1');

    await user.click(await screen.findByRole('button', { name: /custom time/i }));
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await user.type(await screen.findByLabelText(/location/i), 'Library study zone');
    expect(screen.getByLabelText(/location/i)).toHaveValue('Library study zone');

    await user.click(screen.getByRole('button', { name: /available slot/i }));
    expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument();

    // Switching back must not resurrect the place from the previous tab.
    await user.click(screen.getByRole('button', { name: /custom time/i }));
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    expect(screen.getByLabelText(/location/i)).toHaveValue('');
  });

  it('resets the place when the tutor is changed', async () => {
    const user = userEvent.setup();
    renderApp('/booking?tutor=t1');

    await user.click(await screen.findByRole('button', { name: /custom time/i }));
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await user.type(await screen.findByLabelText(/location/i), 'Library study zone');

    await user.selectOptions(screen.getByLabelText(/^tutor$/i), 't2');
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    expect(screen.getByLabelText(/location/i)).toHaveValue('');
  });
});

// A room a tutor publishes has to reach the student unchanged, which means the
// mode and place must survive App-level state and not just the seeded data.
// Availability lives in App state, so this has to be one mount navigated by link.
describe('publishing a new in-person slot', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(TUTOR);
  });

  it('requires a room before an in-person slot can be published', async () => {
    const user = userEvent.setup();
    renderApp('/booking');

    await user.click(await screen.findByRole('button', { name: 'Offline' }));
    await user.click(screen.getByRole('button', { name: /publish slot/i }));
    expect(await screen.findByText(/add a meeting room/i)).toBeInTheDocument();
  });

  it('lists a newly published in-person slot with its room on the availability calendar', async () => {
    const user = userEvent.setup();
    renderApp('/booking');

    // The first day the calendar workspace shows, with a time the tutor is free at.
    const day = Object.keys(tutor.availability).sort()[0];
    const taken = new Set(tutor.availability[day].map((slot) => slot.time));
    const freeTime = ['08:30', '12:00', '18:00'].find((time) => !taken.has(time));

    fireEvent.change(await screen.findByLabelText(/^date$/i), { target: { value: day } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: freeTime } });
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await user.type(await screen.findByLabelText(/meeting room/i), 'Computer lab 4, Engineering 1');
    await user.click(screen.getByRole('button', { name: /publish slot/i }));

    expect(await screen.findByText(/your new slot is ready/i)).toBeInTheDocument();
    expect(screen.getByText('Computer lab 4, Engineering 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back to tutor dashboard/i }));
    await user.click(await screen.findByRole('link', { name: /availability/i }));

    // The published time appears in the open-slots panel, which is also where the
    // seeded slots now live, so the query is scoped to a single row rather than the
    // whole panel (the agenda on the left shows the same time too).
    const openSlot = (await within(document.querySelector('.open-slots-panel')).findByText(freeTime)).closest('.open-slot');
    expect(within(openSlot).getByText('Offline')).toBeInTheDocument();
    expect(within(openSlot).getByText('Computer lab 4, Engineering 1')).toBeInTheDocument();
  });
});

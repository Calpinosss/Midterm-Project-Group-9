import { describe, expect, it } from 'vitest';
import { INITIAL_REQUESTS, INITIAL_SESSIONS, TUTORS } from '../data/mockData';
import { ensureBothModes, indefiniteArticle, makeSlot, modesFor, seedAvailability } from '../lib/slots';

const allSlots = (tutor) => Object.values(tutor.availability).flat();

describe('generated tutor availability', () => {
  it('gives at least one tutor an offline slot', () => {
    const withOffline = TUTORS.filter((tutor) => allSlots(tutor).some((slot) => slot.mode === 'Offline'));
    expect(withOffline.length).toBeGreaterThan(0);
  });

  it('does not give every tutor the same schedule', () => {
    const signatures = new Set(TUTORS.map((tutor) => JSON.stringify(tutor.availability)));
    expect(signatures.size).toBeGreaterThan(1);
  });

  it('never leaves an in-person slot without a meeting place', () => {
    TUTORS.forEach((tutor) => {
      allSlots(tutor).forEach((slot) => {
        if (slot.mode === 'Offline') expect(slot.location, `${tutor.id} ${slot.time}`).toBeTruthy();
        else expect(slot.location, `${tutor.id} ${slot.time}`).toBe('');
      });
    });
  });

  it('keeps an online-only tutor genuinely online only', () => {
    TUTORS.filter((tutor) => tutor.modes.length === 1).forEach((tutor) => {
      expect(tutor.modes).toEqual(['Online']);
      allSlots(tutor).forEach((slot) => expect(slot.mode).toBe('Online'));
    });
  });

  it('advertises only the formats a tutor actually has slots for', () => {
    TUTORS.forEach((tutor) => expect(tutor.modes).toEqual(modesFor(tutor.availability)));
  });

  it('has no duplicate time within a day', () => {
    TUTORS.forEach((tutor) => {
      Object.entries(tutor.availability).forEach(([date, slots]) => {
        expect(new Set(slots.map((slot) => slot.time)).size, `${tutor.id} ${date}`).toBe(slots.length);
      });
    });
  });

  it('reproduces identically, so the demo and the tests are stable', async () => {
    const first = JSON.stringify(TUTORS.map((tutor) => tutor.availability));
    const reimported = await import('../data/mockData');
    expect(JSON.stringify(reimported.TUTORS.map((tutor) => tutor.availability))).toBe(first);
  });

  it('does not put every in-person slot of a tutor in the same room', () => {
    TUTORS.forEach((tutor) => {
      const rooms = new Set(allSlots(tutor).filter((slot) => slot.mode === 'Offline').map((slot) => slot.location));
      if (rooms.size > 1) expect(rooms.size, tutor.id).toBeGreaterThan(1);
    });
  });
});

describe('ensureBothModes', () => {
  it('adds an offline slot when the draw happened to produce none', () => {
    const availability = { '2026-09-28': [makeSlot({ time: '09:00' })] };
    ensureBothModes(availability, ['Online', 'Offline']);
    const slots = availability['2026-09-28'];
    expect(slots.some((slot) => slot.mode === 'Offline' && slot.location)).toBe(true);
    expect(slots.some((slot) => slot.mode === 'Online')).toBe(true);
  });

  it('leaves an online-only tutor alone', () => {
    const availability = { '2026-09-28': [makeSlot({ time: '09:00' })] };
    ensureBothModes(availability, ['Online']);
    expect(availability['2026-09-28'].every((slot) => slot.mode === 'Online')).toBe(true);
  });
});

describe('seeded requests and sessions', () => {
  it('keeps every request attached to an existing session', () => {
    INITIAL_REQUESTS.forEach((request) => {
      expect(INITIAL_SESSIONS.some((session) => session.id === request.sessionId), request.id).toBe(true);
    });
  });

  it('keeps each request and its session describing the same schedule', () => {
    INITIAL_REQUESTS.forEach((request) => {
      const session = INITIAL_SESSIONS.find((item) => item.id === request.sessionId);
      expect(session.date).toBe(request.date);
      expect(session.time).toBe(request.time);
      expect(session.mode).toBe(request.mode);
      expect(session.location).toBe(request.location);
    });
  });

  it('books published-slot requests against a slot the tutor really published', () => {
    INITIAL_REQUESTS.filter((request) => !request.custom).forEach((request) => {
      const tutor = TUTORS.find((item) => item.id === request.tutorId);
      const slot = (tutor.availability[request.date] || []).find((item) => item.time === request.time);
      expect(slot, `${request.id} ${request.date} ${request.time}`).toBeTruthy();
      expect(slot.mode).toBe(request.mode);
      expect(slot.location).toBe(request.location);
    });
  });

  it('always carries a location for offline and never for online', () => {
    [...INITIAL_REQUESTS, ...INITIAL_SESSIONS].forEach((item) => {
      if (item.mode === 'Offline') expect(item.location, item.id).toBeTruthy();
      else expect(item.location, item.id).toBe('');
    });
  });

  it('has no two pending requests on the same tutor, date and time', () => {
    const seen = new Map();
    INITIAL_REQUESTS.forEach((request) => {
      const key = `${request.tutorId}|${request.date}|${request.time}`;
      expect(seen.has(key), `${key} used by both ${seen.get(key)} and ${request.id}`).toBe(false);
      seen.set(key, request.id);
    });
  });

  // A custom request proposes a time the tutor never published, so the student is
  // not shown as holding two bookings in the same hour.
  it('keeps a custom-time request off a published slot', () => {
    INITIAL_REQUESTS.filter((request) => request.custom).forEach((request) => {
      const tutor = TUTORS.find((item) => item.id === request.tutorId);
      const published = (tutor.availability[request.date] || []).some((slot) => slot.time === request.time);
      expect(published, `${request.id} reuses published ${request.date} ${request.time}`).toBe(false);
    });
  });
});

// The app used to read the static seed for the agenda and the live session for the
// panel, so the two halves of one screen disagreed about the same day.
describe('seedAvailability', () => {
  it('copies every tutor and every slot into the same keyed shape', () => {
    const seeded = seedAvailability(TUTORS);

    TUTORS.forEach((tutor) => {
      expect(seeded[tutor.id]).toBeDefined();
      Object.entries(tutor.availability).forEach(([date, slots]) => {
        expect(seeded[tutor.id][date].map((slot) => slot.time)).toEqual(slots.map((slot) => slot.time));
      });
    });
  });

  // The seed is copied, not shared, so editing the live copy must not rewrite the
  // fixture the rest of the tests read from.
  it('deep copies slots so the source data cannot be mutated', () => {
    const seeded = seedAvailability(TUTORS);
    const date = Object.keys(seeded.t1)[0];

    seeded.t1[date][0].time = '03:33';

    expect(TUTORS.find((tutor) => tutor.id === 't1').availability[date][0].time).not.toBe('03:33');
    expect(seedAvailability(TUTORS).t1[date][0].time).not.toBe('03:33');
  });
});

describe('indefiniteArticle', () => {
  // Both formats start with a vowel, so the old hardcoded "a" read as "a online slot".
  it('picks the article that matches the word', () => {
    expect(indefiniteArticle('Online')).toBe('an');
    expect(indefiniteArticle('offline')).toBe('an');
    expect(indefiniteArticle('session')).toBe('a');
  });
});

// Availability used to be a plain list of time strings ("09:00"), so a published
// slot could not say whether it was online or offline, or where to meet. Every
// slot is now an object, which lets the mode and the meeting place travel from the
// tutor's profile all the way into the request and the session.

export const CAMPUS_SPOTS = [
  'Library study zone, 2nd floor',
  'Learning commons, room B-104',
  'Innovation lab, Engineering 3',
  'Discussion room, Building A',
  'Quiet corner, Central Library 1F',
  'Tutorial room, Building C 201',
  'Group study booth, Student Centre',
  'Computer lab 4, Engineering 1',
];

export const MODES = ['Online', 'Offline'];

// A seeded PRNG (mulberry32). Using Math.random() here would reshuffle every
// tutor's schedule on each page load, which makes the demo unreproducible and the
// automated tests impossible. Change SEED to reshuffle the whole dataset.
function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSlot({ time, mode = 'Online', location = '', duration = 60 }) {
  return {
    time,
    mode,
    // An online session has no meeting place, so the field is always empty for it.
    location: mode === 'Offline' ? location : '',
    duration,
  };
}

// Identity of a slot, used for de-duplicating and for removing one by reference.
export function slotKey(slot) {
  return `${slot.time}|${slot.mode}`;
}

export function findSlot(slots, time) {
  return (slots || []).find((slot) => slot.time === time) || null;
}

// Builds a tutor's whole schedule. `offlineRatio` is the chance that any given slot
// is an in-person one, so different tutors end up with genuinely different mixes.
export function buildAvailability({ rng, dates, offlineRatio, slotsPerDay, spots }) {
  const result = {};
  // A tutor does not normally hold every in-person hour in the same room, so rooms are
  // drawn without replacement for this tutor and only reused once the pool runs out.
  const usedSpots = new Set();

  dates.forEach((date, dayIndex) => {
    const count = typeof slotsPerDay === 'number' ? slotsPerDay : slotsPerDay[dayIndex % slotsPerDay.length];
    const picked = new Set();
    const daySlots = [];

    for (let i = 0; i < count; i += 1) {
      let time = TIME_POOL[Math.floor(rng() * TIME_POOL.length)];
      let guard = 0;
      while (picked.has(time) && guard < 20) {
        time = TIME_POOL[Math.floor(rng() * TIME_POOL.length)];
        guard += 1;
      }
      if (picked.has(time)) continue;
      picked.add(time);

      const offline = rng() < offlineRatio;
      let location = '';
      if (offline) {
        const free = spots.filter((spot) => !usedSpots.has(spot));
        const pool = free.length ? free : spots;
        location = pool[Math.floor(rng() * pool.length)];
        usedSpots.add(location);
      }
      daySlots.push(makeSlot({ time, mode: offline ? 'Offline' : 'Online', location, duration: rng() < 0.5 ? 60 : 90 }));
    }

    daySlots.sort((a, b) => a.time.localeCompare(b.time));
    result[date] = daySlots;
  });

  return result;
}

const TIME_POOL = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function freeTime(slots) {
  const used = new Set(slots.map((slot) => slot.time));
  return TIME_POOL.find((time) => !used.has(time)) || '18:00';
}

// Guarantees a tutor who is allowed to teach offline actually has an offline slot,
// and likewise for online, so a rare unlucky draw cannot produce an empty mix.
// Offline is handled first and online second, so neither pass can delete the other:
// a day holding a single slot gains a new one instead of being converted in place.
export function ensureBothModes(availability, allowedModes) {
  const dates = Object.keys(availability);
  if (!dates.length) return availability;

  const has = (mode) => dates.some((date) => availability[date].some((slot) => slot.mode === mode));
  const fullestDay = () => dates
    .map((date) => [date, availability[date]])
    .sort((a, b) => b[1].length - a[1].length)[0];

  if (allowedModes.includes('Offline') && !has('Offline')) {
    const [date, slots] = fullestDay();
    const spot = CAMPUS_SPOTS[dates.indexOf(date) % CAMPUS_SPOTS.length];
    if (slots.length > 1) {
      slots[slots.length - 1] = makeSlot({ ...slots[slots.length - 1], mode: 'Offline', location: spot });
    } else {
      slots.push(makeSlot({ time: freeTime(slots), mode: 'Offline', location: spot }));
    }
  }

  if (allowedModes.includes('Online') && !has('Online')) {
    const [, slots] = fullestDay();
    if (slots.length > 1) {
      slots[slots.length - 1] = makeSlot({ time: freeTime(slots), mode: 'Online' });
    } else {
      slots.push(makeSlot({ time: freeTime(slots), mode: 'Online' }));
    }
  }

  return availability;
}

// "Online" and "Offline" both start with a vowel, so they need "an" before them.
// Hardcoding the word would break the moment a mode is renamed.
export function indefiniteArticle(word) {
  return /^[aeiou]/i.test(String(word)) ? 'an' : 'a';
}

// The generated tutor schedules are only a seed. App copies them into its own state
// so that publishing and removing a slot edit the same data the calendar reads.
// Previously the calendar mixed static tutor data with the live session and lost
// track of the published slots, which is why the panel could claim a day was empty
// while the agenda beside it listed that day's hours.
export function seedAvailability(tutors) {
  return Object.fromEntries(tutors.map((tutor) => [
    tutor.id,
    Object.fromEntries(
      Object.entries(tutor.availability).map(([date, slots]) => [date, slots.map((slot) => ({ ...slot }))]),
    ),
  ]));
}

// A tutor only advertises the formats they actually have slots for.
export function modesFor(availability) {
  const modes = new Set();
  Object.values(availability).forEach((slots) => slots.forEach((slot) => modes.add(slot.mode)));
  return MODES.filter((mode) => modes.has(mode));
}

export { makeRng };

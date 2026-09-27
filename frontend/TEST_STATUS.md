# Test Status — PCL Tutor polished build

## Automated checks — passing

Run from the project root (`PCL-Tutor-Midterm-Final-Polished`):

```bash
npm run lint   # eslint . -> clean
npm test       # vitest run -> 7 files, 86 tests passed
npm run build  # vite build -> success
```

| Suite | File | Covers |
| --- | --- | --- |
| Seeded data | `src/test/data.test.js` | Schedules differ per tutor, offline slots always carry a room and online slots never do, an online-only tutor stays online-only, no duplicate times or double bookings, every request resolves to a real session, the generator is reproducible, and the availability seed is a deep copy that cannot mutate the fixture |
| Availability UX | `src/test/availability.test.jsx` | The open-slots panel lists the *published* slots on a fresh load and agrees with the agenda and the week strip, publishing/removing report what happened, removal asks first and is undoable, a duplicate publish is explained instead of silently ignored, Enter does not publish, and "Add another slot" focuses the form rather than doing nothing |
| Confirmation | `src/test/confirm.test.jsx` | The dialog is a labelled modal, runs the action only on confirm, cancels on the button, Escape, the backdrop, and Tab wrapping, returns focus to the control that opened it, focuses **Cancel** so a reflexive Enter dismisses instead of acting, and a cancelled log out leaves the session intact |
| Form guard | `src/test/forms.test.jsx` | `blockImplicitSubmit` blocks a plain Enter in a field but leaves textareas, buttons, links, editable text, and Ctrl+Enter alone; the profile form does not save on Enter and the Save button still works; the tutor "Suggest another time" form does not send on Enter, still accepts a newline in its message box, and keeps the draft after the review is cancelled |
| Booking lock | `src/test/booking.test.jsx` | An in-person published slot is locked to the tutor's room, an online one names no room, both submit the slot's own format, Enter does not send the request, a stale `?time=` is refused, a custom request can propose Offline with its own place, the request is reviewed before it is sent, cancelling the review keeps the typed topic, and validation still runs on the form rather than the review step |
| Publishing | `src/test/booking.test.jsx` | A tutor cannot publish an in-person slot without a room, and a published room reaches the availability calendar intact |
| Request flow | `src/test/requests.test.jsx` | Tutor sees all seeded requests, student sees only their own, Accept updates the matching session without a prompt, Decline asks first and can be cancelled, the full Suggest -> logout -> Review -> Accept round trip works with a review step on both the suggestion and the acceptance, the student's original message survives a suggestion, and unknown/foreign request ids are refused instead of falling back to the first request |
| Login | `src/test/login.test.jsx` | Stored-session redirect, role prefill, wrong-password rejection, and distinct student vs tutor dashboards |

Notes on the suites:

- The suites read the generated slots from `mockData` instead of hardcoding a time, so changing `SCHEDULE_SEED` does not break them.
- Time inputs (`<input type="time">`) are driven with `fireEvent.change`; character typing is not reliable for that control in jsdom.
- The Suggest -> Review round trip runs inside a single mounted `App`, because `requests` is React state and is intentionally not persisted to `localStorage`. Reloading the page resets requests, sessions, and availability to the seed data (only the user, theme, accent, and sidebar state persist).
- `src/test/helpers.jsx` provides the two demo accounts (`student` and `tutor`), a `renderApp(route)` helper that seeds the hash route and a signed-in user, and `confirmDialog` / `cancelDialog` so a sending test cannot pass if the review step is ever removed.
- Availability is now seeded into `App` state by `seedAvailability(TUTORS)`, so a published slot is editable and removable in exactly the same way as one added during the session. That is still React state, so a reload still returns to the seed.
- `blockImplicitSubmit` blocks Enter in the publish, booking, suggest-another-time, and profile forms. Search and sign-in keep it, because there Enter is what the user wants.
- Booking, sending a suggestion, and accepting a suggested time all open a review dialog that shows the exact payload. Cancelling returns to the form with every field intact, so a student or tutor can still change something instead of having sent it.

## Bugs covered by the suites

1. Every tutor was online-only, so in-person tutoring could never be booked.
2. A published slot could not carry a room, so a student booking one had no place to go.
3. Duplicate request stores — the student own request was invisible to the tutor.
4. Accept wrote a `sessionId` that did not exist.
5. A stale/unknown `?request=` id silently fell back to the first request in the list.
6. A stale `?time=` URL booked a slot the tutor no longer published.
7. Switching from a custom time back to an available slot left a stale location and mode behind.
8. Two seeded requests landed on the same tutor, date and time.
9. A tutor could publish an in-person slot with no room attached.
10. "Manage availability" navigated to `/availability` from `/availability`, so it did nothing.
11. Publishing a slot gave no confirmation, and publishing a duplicate was silently ignored.
12. Removing a slot gave no confirmation, so it looked like the button was broken.
13. The open-slots panel and the week strip counted only slots added in the current session, so a fresh load claimed a day was empty while the agenda beside it listed that day's published hours.
14. Pressing Enter in a field submitted the publish, booking, and profile forms, so a slot, a request, or a profile save could be sent without touching the button.
15. Declining a request, cancelling a request, and logging out all took effect on the first click with no way back.
16. A tutor's suggested new time overwrote the student's original request message, and a stray `message` key was added to the session while its notes went stale.
17. The tutor availability form was hardcoded to `t1` instead of the signed-in tutor's id.
18. Booking, sending a suggestion, and accepting a suggested time all sent on the first click, so a student who was still editing a topic or a tutor who had not finished a message had no chance to notice.
19. Pressing Enter in the tutor "Suggest another time" message box sent the suggestion mid-sentence, because that form had no Enter guard.
20. The confirmation dialog focused its confirm button, so the Enter keypress that used to send things straight away would have pressed the button for the user.

## Manual verification checklist

```bash
npm install
npm run dev
```

Then check these exact demo paths:

1. Login as `student` / `student123`.
2. Home -> type a search -> submit -> results appear at the top of `/find`.
3. Open a tutor -> pick an in-person published slot -> its room is shown and cannot be changed.
4. Switch to Custom time -> choose Offline -> a room is required -> submit -> a review appears with the exact topic, date, time, mode and room -> Cancel returns to the form with everything still typed; Confirm sends it and the success panel shows both.
5. Press Enter in the booking topic field -> no review and no request. Click "Submit request" -> the review opens.
6. Logout -> login as `tutor` / `tutor123`.
7. Requests -> all three seeded requests are listed, including Nathan's, each with its format and room.
8. Accept a request -> it moves to Past decisions as Confirmed (no prompt; accepting is reversible).
8b. Decline a request -> a confirmation appears -> Cancel keeps the request, Confirm moves it to Rejected.
9. Suggest time -> press Enter in the message box -> nothing is sent and the newline is typed; the box keeps the draft. Click "Send suggestion" -> a review shows the old time, the new time, the backup and the message -> Cancel keeps the draft; Confirm sends it.
10. Log out (confirm the log out prompt) -> login as the student -> Requests -> Review suggestion -> your original message is still shown -> "Accept new time" opens a review naming the time being agreed to; Cancel leaves the request Suggested; Confirm moves it to Confirmed.
11. Availability -> the open-slots panel already lists the published slots for the selected day and the week strip agrees.
12. Availability -> publish an in-person slot with a room -> it appears in the open-slots panel.
13. Availability -> press Enter in the time field -> nothing is published; click "Publish availability" -> it works.
14. Availability -> remove a slot -> a confirmation appears -> Cancel keeps it; Confirm removes it and offers Undo, which puts the slot back with its room.
15. Any confirmation dialog -> Cancel is already focused, so pressing Enter straight away dismisses it instead of running the action.
16. Profile -> press Enter in the name field -> nothing saves; click Save changes -> the header reflects it.
17. Collapse sidebar -> icons-only desktop mode; resize to mobile -> drawer behavior.

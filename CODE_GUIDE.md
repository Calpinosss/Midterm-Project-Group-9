# PCL Tutor — Code Guide

## 1. Purpose of this document

This document is the developer/lecturer guide for the **PCL Tutor** frontend in this repository.

Its purpose is to answer four practical questions when reading the project:

1. **Where is a feature implemented?**
2. **What does that file/function do?**
3. **How does data move through the application?**
4. **Which React / JavaScript / HTML concepts are being demonstrated?**

The guide describes the code that is actually submitted in the repository. It does not replace the source code.

---

## 2. Project at a glance

**PCL** stands for **Practice Centered Learning**.

**PCL Tutor** is the web prototype for a peer-tutoring booking system. A Student can discover peer tutors by subject, inspect tutor availability, and request a tutoring session. A Tutor can review requests, manage availability, and manage taught subjects.

The Midterm version intentionally uses **hardcoded frontend data** and **simulated login**. The official Midterm brief says the current stage is a Web application using hardcoded/fake data, with no backend, database, or real authentication required yet. The later Final stage adds the real backend/database and a Client-only mobile application. fileciteturn2file0L17-L22 fileciteturn2file0L69-L75

### Two application roles

| Application role | Rubric role | Main purpose |
|---|---|---|
| Student / Mentee | Client | Find a tutor and request a study session |
| Tutor / Mentor | Administrator | Manage tutoring requests, availability, and subjects |

The proposal defines the same two roles and their main permissions. fileciteturn3file0L13-L31

---

# 3. 30-second file map

Use this table first when somebody asks, **“Where is that implemented?”**

| What you want to inspect | File | What to look for |
|---|---|---|
| App entry point | `frontend/src/main.jsx` | React root + `HashRouter` |
| Main application logic | `frontend/src/App.jsx` | state, login, booking, request transitions, routes |
| Login UI | `frontend/src/pages/LoginPage.jsx` | form, `useState`, `useEffect`, validation |
| Student/Tutor dashboard | `frontend/src/pages/DashboardPage.jsx` | role-based rendering |
| Tutor discovery | `frontend/src/pages/FindTutorPage.jsx` | search, filters, sorting, URL search params |
| Tutor profile | `frontend/src/pages/TutorDetailPage.jsx` | tutor details + availability |
| Booking form | `frontend/src/pages/FormPage.jsx` | booking, custom time, validation, submit/review |
| Request management | `frontend/src/pages/RequestsPage.jsx` | Accept, Suggest, Decline, history |
| Tutor availability | `frontend/src/pages/AvailabilityPage.jsx` | controlled availability form |
| Sessions + calendar page | `frontend/src/pages/SessionsPage.jsx` + `CalendarWorkspace.jsx` | schedule/calendar display |
| Profile editing | `frontend/src/pages/ProfilePage.jsx` | controlled profile form + save |
| Tutor subject management | `frontend/src/pages/SubjectsPage.jsx` | teaching-subject selection |
| Activity / notifications | `frontend/src/pages/ActivityPage.jsx` | notifications/activity list |
| Navigation shell | `frontend/src/components/AppShell.jsx` | sidebar, topbar, role-aware navigation |
| Tutor card | `frontend/src/components/TutorCard.jsx` | reusable tutor result card |
| Calendar component | `frontend/src/components/CalendarWorkspace.jsx` | week selection + agenda + slots |
| Confirmation dialog | `frontend/src/components/ConfirmDialog.jsx` | modal confirmation + keyboard handling |
| Notification dropdown | `frontend/src/components/NotificationPopover.jsx` | notification preview/navigation |
| Theme/settings | `frontend/src/components/SettingsDrawer.jsx` | theme + accent preferences |
| PCL logo | `frontend/src/components/Brand.jsx` | reusable brand mark |
| Icons | `frontend/src/components/icons.jsx` | shared SVG icon component |
| Demo users and tutors | `frontend/src/data/mockData.js` | hardcoded data |
| Slot generation | `frontend/src/lib/slots.js` | tutor availability generation/helpers |
| Form keyboard behavior | `frontend/src/lib/forms.js` | preventing unintended form submit |
| Global styling | `frontend/src/styles.css` | layout, components, responsive design |
| Frontend tests | `frontend/src/test/` | login, booking, availability, requests, etc. |

---

# 4. Application startup

## `frontend/src/main.jsx`

### Lines 1–5 — imports

This file imports React, ReactDOM, `HashRouter`, the root `App`, and the stylesheet.

### Lines 7–13 — render the application

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
```

### What it means

- `createRoot(...)` creates the React rendering root.
- `StrictMode` enables extra development checks.
- `HashRouter` enables client-side routes such as `#/find` and works well with static hosting such as GitHub Pages.
- `App` is the main application component.

### Basic question

**“Why do you use `HashRouter`?”**

> We use `HashRouter` because this prototype is intended to be deployed as a static site, including GitHub Pages. The route is stored after the `#`, so refreshing a page does not require the server to know how to serve every React route.

---

# 5. The central file: `frontend/src/App.jsx`

`App.jsx` is the main place where the application state and important state-changing handlers live.

## Imports — lines 1–18

The file imports:

- React hooks: `useEffect`, `useMemo`, `useState`
- Router components: `Navigate`, `Route`, `Routes`
- all major pages
- shared shell/settings components
- hardcoded demo data
- availability helper functions

## `read()` — lines 20–27

```js
function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
```

### What it does

Reads a value from `localStorage` and converts JSON text back into a JavaScript value. If storage is missing or invalid, it returns the fallback value.

### Basic question

**“Why is this wrapped in `try/catch`?”**

> Because reading or parsing stored data can fail. The fallback keeps the application usable instead of crashing when stored data is invalid.

---

## `ProtectedRoutes()` — lines 29–32

```jsx
function ProtectedRoutes({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

### What it does

Checks whether a user exists. If not, it redirects to `/login`. Otherwise, it renders the protected content.

### Concept

This is **conditional rendering** combined with React Router navigation.

---

# 6. Main application state — `App.jsx` lines 34–46

The main state variables are:

```js
const [user, setUser] = useState(...);
const [theme, setTheme] = useState(...);
const [accent, setAccent] = useState(...);
const [collapsed, setCollapsed] = useState(...);
const [settingsOpen, setSettingsOpen] = useState(false);
const [sessions, setSessions] = useState(INITIAL_SESSIONS);
const [requests, setRequests] = useState(INITIAL_REQUESTS);
const [availability, setAvailability] = useState(...);
```

### What each state represents

| State | Purpose |
|---|---|
| `user` | currently logged-in demo account |
| `theme` | light/dark preference |
| `accent` | selected accent colour |
| `collapsed` | desktop sidebar state |
| `settingsOpen` | whether settings is open |
| `sessions` | session objects currently in application state |
| `requests` | booking/request objects currently in application state |
| `availability` | tutor time slots currently available |

### Important mental model

```text
State in App.jsx
      ↓
props passed to pages/components
      ↓
user interaction
      ↓
handler updates state
      ↓
React re-renders affected UI
```

This is the most important architecture to understand when explaining the project.

---

# 7. `useEffect` in `App.jsx` — lines 48–65

There are four effects:

1. Persist theme — lines 48–51
2. Persist accent — lines 53–56
3. Persist sidebar state — lines 58–60
4. Persist current demo user — lines 62–65

Example:

```js
useEffect(() => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('pcl-theme-v7', JSON.stringify(theme));
}, [theme]);
```

### Why `[theme]`?

> The effect should run when `theme` changes. The dependency array tells React which values the effect depends on.

### Important distinction

`useEffect` here is **not** used to calculate ordinary UI values. It is used for side effects such as modifying `document` and writing to browser storage.

---

# 8. Simulated login — `App.jsx` lines 67–75

```js
const login = (credentials) => {
  const account = DEMO_ACCOUNTS.find(
    (item) => item.username === credentials.username &&
      item.password === credentials.password &&
      item.role === credentials.role,
  );
  if (!account) return false;
  setUser(account);
  return true;
};
```

### Flow

```text
LoginPage
   ↓ credentials
App.login()
   ↓
DEMO_ACCOUNTS.find(...)
   ↓
match?
 ├─ no  → false → error shown
 └─ yes → setUser(account)
              ↓
           dashboard
```

The Midterm brief explicitly requires simulated login using a hardcoded username/password/role list, and explicitly says not to implement JWT, Firebase, Auth0, or other real authentication at this stage. fileciteturn2file0L58-L68

---

# 9. Logout and profile update — `App.jsx` lines 77–81

```js
const logout = () => setUser(null);

const updateUser = (patch) => {
  setUser((current) => current ? { ...current, ...patch } : current);
};
```

### `...patch`

The spread operator copies the existing user properties, then the supplied fields overwrite the ones being edited.

Example:

```text
current user
     ↓
copy existing properties
     ↓
replace name / major / semester / bio
     ↓
new user object
```

---

# 10. Booking creation — `App.jsx` lines 83–111

This is the key state transition for the main use case.

```js
const createSession = (payload) => {
  ...
  setSessions((items) => [session, ...items]);
  setRequests((items) => [request, ...items]);
  return request;
};
```

### Important idea

One student booking produces both:

- a `session` object
- a `request` object

Both are stored in the shared application state so the Student and Tutor sides can see the same interaction.

### Why `[newItem, ...items]`?

> It creates a new array instead of mutating the existing state array. The new item is placed first so it appears immediately in the UI.

---

# 11. Tutor request decisions — `App.jsx` lines 113–133

The function is:

```js
requestAction(id, action, details)
```

Supported actions include:

- `confirmed`
- `rejected`
- suggestion-related updates

### Important part — lines 131–132

```js
setRequests((items) => items.map(...));
setSessions((items) => items.map(...));
```

### Why `map()`?

The code creates a new array while changing only the matching request/session.

Conceptually:

```text
requests
 ├─ request A → unchanged
 ├─ request B → UPDATED
 └─ request C → unchanged
```

The same idea is used for the matching session.

---

# 12. Role-specific visible requests — `App.jsx` lines 161–168

```js
const visibleRequests = useMemo(() => {
  if (!user) return [];
  return user.role === 'student'
    ? requests.filter((item) => item.studentName === user.name)
    : requests.filter((item) => item.tutorId === user.tutorId);
}, [user, requests]);
```

### What happens

- Student sees requests belonging to that student.
- Tutor sees requests assigned to that tutor.

### Why `useMemo()`?

> `useMemo()` caches the derived result until `user` or `requests` changes. The important part here is that `visibleRequests` is derived from existing state rather than stored as another independent copy.

---

# 13. Route table — `App.jsx` lines 170–205

The outer route protects the application. The inner routes represent the actual workspaces.

### Main routes

```text
/login
/
/find
/sessions
/activity
/notifications
/requests
/availability
/subjects
/profile
/tutor/:id
/booking
/form → redirects to /booking
* → NotFoundPage
```

### Where each route is configured

`App.jsx` lines 172–198.

### Basic question

**“Where is the Dashboard route?”**

> It is in `App.jsx` around line 185: `/` renders `DashboardPage`.

### Basic question

**“Where is the tutor ID in the URL handled?”**

> The route is declared as `/tutor/:id` in `App.jsx`, and `TutorDetailPage` reads the route parameter using React Router.

---

# 14. `LoginPage.jsx` — the login interface

File: `frontend/src/pages/LoginPage.jsx`

## State — lines 7–11

```js
const [username, setUsername] = useState('student');
const [password, setPassword] = useState('student123');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const [rolePreview, setRolePreview] = useState('student');
```

### Why `useState`?

Each value can change because of user interaction or login state.

---

## `useEffect` — lines 13–20

When the selected role preview changes, the corresponding demo account is loaded into the form.

```js
const account = DEMO_ACCOUNTS.find((item) => item.role === rolePreview);
```

This demonstrates `useEffect`, `find()`, and state updates.

---

## Form submission — lines 22–35

```js
const submit = (event) => {
  event.preventDefault();
  ...
  const matched = DEMO_ACCOUNTS.find(...);
  ...
  onLogin(matched);
};
```

### `preventDefault()`

> It stops the browser's normal form submission behavior, which would otherwise navigate/reload the page. React can then perform validation and update application state itself.

### `find()`

The code searches the hardcoded account array and returns the first matching account.

---

# 15. `DashboardPage.jsx`

File: `frontend/src/pages/DashboardPage.jsx`

The main component starts around **line 84**.

```js
const isStudent = user.role === 'student';
```

The dashboard then conditionally renders Student and Tutor content.

## Student dashboard

Lines 105–116 show:

- `SearchHero`
- pending request summary
- next session
- calendar snapshot

## Tutor dashboard

Lines 117–129 show:

- upcoming session
- availability snapshot
- pending requests
- calendar snapshot

### Why this matters for the rubric

The official Midterm brief specifically asks for the same web application to represent both roles with role-dependent menu/dashboard content rather than creating separate applications. fileciteturn2file0L53-L57

---

# 16. `FindTutorPage.jsx`

File: `frontend/src/pages/FindTutorPage.jsx`

## Search/filter state — lines 8–13

```js
const [search, setSearch] = useState(...);
const [subject, setSubject] = useState(...);
const [filtersOpen, setFiltersOpen] = useState(false);
const [mode, setMode] = useState('All formats');
const [sort, setSort] = useState('Recommended');
```

## Derived tutor list — lines 15–28

```js
const filteredTutors = useMemo(() => {
  const results = TUTORS.filter(...);
  return [...results].sort(...);
}, [search, subject, mode, sort]);
```

### Concepts demonstrated

- `filter()` selects matching tutors.
- `sort()` changes the display order.
- `useMemo()` derives the current result list from the current filters.
- `map()` later renders the matching `TutorCard` components.

## URL state — lines 32–45

`useSearchParams()` keeps search/filter choices represented in the URL.

Example concept:

```text
/find?subject=Calculus
```

This makes navigation/bookmarking easier and keeps discovery state connected to the route.

---

# 17. `TutorCard.jsx`

File: `frontend/src/components/TutorCard.jsx`

This is a reusable component.

## Props

```jsx
<TutorCard tutor={tutor} />
```

Inside the component, the `tutor` prop is used to display the tutor's name, subjects, stats, and link to the profile.

## `map()` + `key`

The component renders multiple subjects with:

```jsx
tutor.subjects.slice(0, 2).map((subject) => ...)
```

Each generated item receives a key:

```jsx
key={subject}
```

### Good explanation

> `map()` converts the subject array into React elements. `key` gives each list item a stable identity so React can track the list correctly.

---

# 18. `TutorDetailPage.jsx`

File: `frontend/src/pages/TutorDetailPage.jsx`

This page represents the **selected tutor**.

The route is:

```text
/tutor/:id
```

The page uses the tutor ID to identify the tutor and displays the relevant tutor information and available slots.

### Main UX flow

```text
Find Tutor
   ↓
TutorCard
   ↓
View tutor profile
   ↓
TutorDetailPage
   ↓
choose date / slot
   ↓
Booking page
```

---

# 19. `FormPage.jsx` — the main use-case page

File: `frontend/src/pages/FormPage.jsx`

This file is a dispatcher for multiple form modes.

## Dispatcher — lines 18–27

Depending on the logged-in role and URL mode:

- Tutor + `mode=suggest` → `SuggestTimeForm`
- Student + `mode=review` → `ReviewSuggestionForm`
- Tutor → `AvailabilityForm`
- Student → `BookingForm`

This allows related flows to share one route while keeping each form's logic separate.

---

# 20. Booking form — `FormPage.jsx` lines 29 onward

## State — lines 35–48

The booking form keeps state for:

- tutor
- subject
- topic
- date
- time
- online/offline mode
- notes
- custom scheduling
- location
- errors
- submitted state
- review state

These are classic controlled-form state variables.

---

## Derived availability — lines 50–62

The form derives:

- dates that the selected tutor advertises
- time slots for the selected date
- the selected published slot
- effective mode
- effective location

### Why derive instead of duplicating?

The form should use the published availability as the source of truth. That prevents the form from displaying a slot or mode that no longer exists in application state.

---

## Submit/validation — lines 88–111

The main validation flow is:

```text
Submit
  ↓
preventDefault()
  ↓
validate topic
  ↓
validate date
  ↓
validate time
  ↓
validate selected slot/custom location
  ↓
build review object
```

### Why show a review first?

The form prepares a review summary before the final request is created. This separates **checking the form** from **actually creating the booking object**.

---

## Final creation — lines 113–129

`sendRequest()` calls the parent's `onCreateSession()` callback.

This is the key example of **lifting state up**:

```text
BookingForm
   ↓ callback prop
App.jsx createSession()
   ↓
setSessions()
setRequests()
   ↓
Dashboard / Requests update
```

---

# 21. Why `preventDefault()` also appears in forms elsewhere

## `src/lib/forms.js`

The helper `blockImplicitSubmit()` uses `event.preventDefault()` for keyboard behavior in forms.

The important principle is always the same:

> The browser has a default form behavior. We stop that behavior so the React application can control what happens next.

This should not be confused with `stopPropagation()`. `preventDefault()` does **not** stop event bubbling; it stops the default action.

---

# 22. `RequestsPage.jsx`

File: `frontend/src/pages/RequestsPage.jsx`

This page displays different request actions depending on role.

## Tutor

Tutor can:

- Accept
- Suggest time
- Decline

## Student

Student can:

- Review tutor suggestion
- Cancel request
- wait for tutor decision

## Why use confirmation dialog?

Destructive actions such as decline/cancel use `ConfirmDialog` so the user gets a final confirmation before the state changes.

---

# 23. Request state flow

The main state machine is:

```text
                    ┌───────────────┐
                    │    Pending    │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
          Confirmed      Suggested      Rejected
              │             │
              │             ↓
              │      Student reviews
              │             │
              │        accepts / etc.
              ↓             ↓
           Session       Session
          continues     gets updated
```

The actual status updates are centralized in `App.jsx` `requestAction()` rather than being duplicated across pages.

---

# 24. `AvailabilityPage.jsx`

File: `frontend/src/pages/AvailabilityPage.jsx`

This is a Tutor-only controlled form.

## State — lines 25–30

```js
const [date, setDate] = useState(...);
const [time, setTime] = useState(...);
const [mode, setMode] = useState('Online');
const [location, setLocation] = useState('');
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
```

## Submit — lines 39–58

It:

1. prevents default submission
2. validates offline location
3. creates a slot object
4. checks for duplicates
5. calls `onAddAvailability()`
6. displays a success message

This is another strong example of a controlled React form.

---

# 25. `CalendarWorkspace.jsx`

File: `frontend/src/components/CalendarWorkspace.jsx`

## Main state — lines 23–33

```js
const [weekOffset, setWeekOffset] = useState(0);
const [selectedDate, setSelectedDate] = useState(dates[0]);
const [selectedMode, setSelectedMode] = useState('All');
const [notice, setNotice] = useState('');
const [pendingRemoval, setPendingRemoval] = useState(null);
const [lastRemoved, setLastRemoved] = useState(null);
```

## `useMemo()` — line 26

The week dates are derived from `weekOffset`.

## `map()`

The seven/day-like date choices are generated from an array rather than manually duplicated.

## `filter()`

`dayItems` selects only events for the currently selected date and mode.

## `sort()`

Agenda items are ordered chronologically.

### Good explanation

> The calendar is data-driven. The selected date and selected filters are state, while the visible agenda is derived from that state.

---

# 26. Profile page — `ProfilePage.jsx`

File: `frontend/src/pages/ProfilePage.jsx`

## Form state — lines 9–13

The page keeps local state for:

- name
- major
- semester
- bio
- save confirmation

## `useEffect()` — lines 15–20

When the `user` prop changes, the local form state is synchronized with the user.

## Submit — lines 22–26

```js
onSave({ ...updatedProfile });
```

The parent (`App.jsx`) owns the actual application-level user state. The profile page only edits the local form and sends the update upward.

This is another example of **one-way data flow** and **lifting state up**.

---

# 27. `AppShell.jsx` — navigation and layout

File: `frontend/src/components/AppShell.jsx`

## Role-specific navigation — lines 10–24

There are two arrays:

```js
studentNav
```

and

```js
tutorNav
```

Then line 33 selects the correct one:

```js
const nav = user.role === 'tutor' ? tutorNav : studentNav;
```

### This is an excellent example of data-driven UI

Instead of writing two separate navigation components, the same component uses an array appropriate to the current role.

## `map()` — lines 55–67

Each navigation object becomes a `NavLink`.

## `NavLink`

`NavLink` automatically provides an active state based on the current route.

---

# 28. Mobile navigation and `useEffect()` — `AppShell.jsx`

Line 35:

```js
useEffect(() => setMobileOpen(false), [location.pathname, location.search]);
```

This closes the mobile navigation whenever the location changes.

The user does not have to manually close the drawer after every navigation.

---

# 29. Notifications — `NotificationPopover.jsx` and `ActivityPage.jsx`

`NotificationPopover.jsx` displays a short preview and links to a relevant workspace.

`ActivityPage.jsx` provides the full Activity/Notification view.

### `map()` example

`items.map(...)` creates one notification item for every object in the notification array.

### `key`

Each notification uses `item.id` as its React key.

### Role-specific notification data

`ActivityPage.jsx` reads:

```js
NOTIFICATIONS[user.role]
```

so the visible updates depend on the current role.

---

# 30. Settings and theme — `SettingsDrawer.jsx`

The settings drawer changes:

- Light/Dark theme
- accent colour

The actual application state lives in `App.jsx` and is passed to the drawer through props:

```text
App.jsx state
   ↓ props
SettingsDrawer
   ↓ user changes a control
setter callback
   ↓
App.jsx updates state
```

This is another example of parent → child props and child → parent callback usage.

---

# 31. `Brand.jsx`, `Avatar.jsx`, `icons.jsx`

These files contain small reusable presentation components.

### Why components?

Instead of rewriting the same logo/avatar/icon markup throughout the application, the project centralizes them into reusable components.

Example:

```jsx
<Avatar initials={user.initials} />
```

The parent provides data through props; the component decides how to render it.

---

# 32. Mock data — `frontend/src/data/mockData.js`

This file is the central source for the frontend's hardcoded demonstration data.

Important exports include:

```text
DEMO_ACCOUNTS
SUBJECTS
TUTORS
INITIAL_SESSIONS
INITIAL_REQUESTS
NOTIFICATIONS
CALENDAR_EVENTS
```

The official Midterm brief explicitly says the data source at this stage should be a JavaScript array/object in the frontend, with no database/API calls. fileciteturn2file0L44-L57

## Demo accounts — lines 3–25

There are two main demo accounts:

```text
Student
username: student
password: student123

Tutor
username: tutor
password: tutor123
```

## Subjects — lines 27–42

The subject list contains the AI-related course set used in the prototype.

## Tutor profiles — lines 52–150

Each tutor object contains fields such as:

- `id`
- `name`
- `semester`
- `rating`
- `sessions`
- `participantsToday`
- `modes`
- `subjects`
- `about`
- `availability`

---

# 33. Slot helpers — `frontend/src/lib/slots.js`

This file keeps availability-related helper logic out of page components.

Important functions:

| Function | Purpose |
|---|---|
| `makeSlot()` | creates a slot object |
| `slotKey()` | creates a stable slot identifier |
| `findSlot()` | finds a slot by time |
| `buildAvailability()` | generates seeded sample availability |
| `ensureBothModes()` | makes demo availability reflect allowed formats |
| `seedAvailability()` | clones tutor availability into app state |
| `modesFor()` | determines which formats a tutor actually advertises |

### Why keep helpers outside the page?

> The component should focus on UI and interaction. Reusable data-processing logic is easier to test and reuse when placed in a helper module.

---

# 34. JavaScript collection methods you should understand

These are the most important ones in the PCL code.

## `map()`

Transforms every item into another value/UI element.

```js
items.map((item) => ...)
```

Use in PCL:

- tutor cards
- subjects
- navigation items
- calendar days
- notifications
- requests

## `filter()`

Keeps only items that match a condition.

```js
items.filter((item) => condition)
```

Use in PCL:

- tutor search
- requests by role
- sessions by user
- calendar items by date

## `find()`

Returns the first matching item.

```js
items.find((item) => condition)
```

Use in PCL:

- find a demo account
- find a tutor by ID
- find a matching session/request/slot

## `sort()`

Reorders an array based on a comparison.

Used for:

- tutor rankings
- calendar agenda order
- availability slots

---

# 35. Core React concepts in this project

## `useState`

Stores changing component state.

Examples:

- login inputs
- selected tutor
- selected calendar date
- search text
- booking form values
- modal open/closed state

## `useEffect`

Runs side-effect logic when dependencies change.

Examples:

- save preferences to localStorage
- synchronize profile form state
- close mobile menu after navigation

## Props

Data passed from a parent component to a child component.

Example:

```jsx
<TutorCard tutor={tutor} />
```

## Conditional rendering

Shows different UI according to state.

Example concept:

```jsx
isStudent ? <StudentView /> : <TutorView />
```

## Controlled input

The input's displayed value comes from React state and `onChange` updates that state.

```jsx
<input
  value={name}
  onChange={(event) => setName(event.target.value)}
/>
```

## `preventDefault()`

Stops the browser's default form action so React can handle submission itself.

## `useNavigate()`

Programmatically navigates to another route.

## `Link` / `NavLink`

Create client-side route navigation without manually reloading the document.

## `useSearchParams()`

Reads/writes search parameters in the URL.

## `useMemo()`

Caches a derived calculation until its dependencies change.

---

# 36. HTML basics visible in the project

## `<form>`

Groups controls that belong to one submission.

## `<label>`

Associates descriptive text with an input/control.

## `<input>`

Collects a value such as text, date, time, or password.

## `<select>`

Provides a dropdown choice.

## `<button>`

Triggers actions or submits a form depending on its `type`.

## `<section>`

Represents a meaningful section of page content.

## `<article>`

Represents self-contained content such as a tutor card, request, notification, or agenda item.

## `<div>`

A generic container used mainly for grouping/layout when a more specific semantic element is not appropriate.

### Note about `<table>`

The current PCL Tutor frontend is primarily composed of cards, sections, forms, lists, and flex/grid layouts. There is no need to describe the project as table-based unless a specific `<table>` exists in the file being discussed.

If asked generally:

> A `<table>` represents data arranged in rows and columns. `<tr>` is a row, `<th>` is a header cell, and `<td>` is a data cell.

---

# 37. CSS and layout concepts used in the project

Main stylesheet:

`frontend/src/styles.css`

The Week 3 material emphasizes four practical visual rules: hierarchy, spacing/proximity, consistency, and contrast. It also emphasizes Flexbox, responsive behavior, and design-system thinking. fileciteturn1file1L64-L113 fileciteturn1file1L219-L248 fileciteturn1file1L354-L372

## Flexbox

Look for rules such as:

```css
display: flex;
justify-content: ...;
align-items: ...;
gap: ...;
```

Basic explanation:

- `display: flex` makes the element a flex container.
- `justify-content` controls the main-axis arrangement.
- `align-items` controls the cross-axis alignment.
- `gap` puts consistent space between flex items.

The course explicitly teaches that Flexbox properties are applied to the **container**, not individual children. fileciteturn1file0L271-L290

## Responsive design

The project uses media queries so the layout can adapt to narrower screens.

The Week 3 material emphasizes that the same HTML/CSS should survive multiple viewport widths without sideways scrolling, and recommends mobile-first/responsive thinking. fileciteturn1file0L82-L84

## Hierarchy

In PCL Tutor, hierarchy is created using differences in:

- heading size
- font weight
- spacing
- colour
- button prominence
- section position

The goal is that the user can identify the main task quickly instead of every element competing equally for attention. fileciteturn1file1L88-L113

## Spacing / grouping

Related content is grouped tightly while separate groups have more space between them. This follows the proximity/grouping principle in the Week 3 material. fileciteturn1file1L170-L176

## Consistency

Reusable classes and components are used so similar controls share a visual language instead of each page inventing its own button/card style. The course material specifically recommends consistent headings, buttons, spacing, and repeated component patterns. fileciteturn1file1L228-L236

---

# 38. Main end-to-end data flow

## Student booking

```text
LoginPage
   │
   │ onLogin(credentials)
   ↓
App.jsx
   │ setUser()
   ↓
DashboardPage
   │
   │ navigate('/find')
   ↓
FindTutorPage
   │
   │ open /tutor/:id
   ↓
TutorDetailPage
   │
   │ choose slot
   ↓
FormPage / BookingForm
   │
   │ controlled inputs
   │ validation
   │ preventDefault()
   ↓
review summary
   ↓
onCreateSession(payload)
   ↓
App.jsx createSession()
   ├── setSessions(...)
   └── setRequests(...)
          ↓
      Dashboard / Requests update
```

The proposal describes the same core use case: Student selects a tutor, fills the booking form, validation occurs, the booking is saved to state, and the Student is shown the resulting booking. fileciteturn3file0L33-L41 fileciteturn3file0L43-L57

---

# 39. Main Tutor decision flow

```text
Tutor Dashboard
      ↓
RequestsPage
      ↓
Open request
      ↓
 ┌──────────────┬──────────────┬──────────────┐
 ↓              ↓              ↓
Accept       Suggest time    Decline
 ↓              ↓              ↓
Confirmed    Suggested      Rejected
              ↓
      Student reviews
```

The code that performs the actual request/session state transition is in `App.jsx` `requestAction()`.

---

# 40. How the main React data flow works

The application follows a simple **one-way data flow** pattern:

```text
App state
   ↓
Parent page/component
   ↓
Props
   ↓
Child component
   ↓
User event
   ↓
Callback function
   ↓
State setter in owner
   ↓
React re-render
```

### Example

```jsx
<TutorCard tutor={tutor} />
```

The parent owns the tutor data. `TutorCard` receives it as a prop.

For forms:

```jsx
<BookingForm onCreateSession={createSession} />
```

The child collects form information and calls the parent callback. The parent owns the application-level booking state.

---

# 41. Where the project uses `key`

Search for `key={` or `key=`.

Important examples:

- `LoginPage.jsx` role buttons
- `DashboardPage.jsx` calendar days and request previews
- `FindTutorPage.jsx` / `TutorCard.jsx` subject/tutor lists
- `CalendarWorkspace.jsx` dates, events and slots
- `ActivityPage.jsx` notification items
- `AppShell.jsx` navigation items

### Explanation

> React uses keys to distinguish elements in lists. A stable key helps React understand which list item corresponds to which piece of data.

---

# 42. Where to find common lecturer questions

## “Where is the login page?”

`frontend/src/pages/LoginPage.jsx`

Important areas:

- state: lines 7–11
- role preview effect: lines 13–20
- submit function: lines 22–35
- form JSX: lines 58–63

The account matching itself happens in `frontend/src/App.jsx`, lines 67–75.

---

## “Where is the login validation?”

`LoginPage.jsx` lines 22–35.

The account lookup is performed by `DEMO_ACCOUNTS.find(...)`.

---

## “Where is `preventDefault()`?”

- `LoginPage.jsx` line 23
- `FormPage.jsx` line 89
- `AvailabilityPage.jsx` line 40
- `ProfilePage.jsx` line 23
- helper logic in `lib/forms.js`

---

## “Where is the Student/Tutor difference?”

- `App.jsx` lines 163–168 for visible request data
- `DashboardPage.jsx` lines 84–130 for role-specific dashboard rendering
- `AppShell.jsx` lines 10–24 and 31–33 for role-specific navigation

---

## “Where is `useState` used?”

Common places:

- `App.jsx`
- `LoginPage.jsx`
- `DashboardPage.jsx`
- `FindTutorPage.jsx`
- `FormPage.jsx`
- `RequestsPage.jsx`
- `AvailabilityPage.jsx`
- `CalendarWorkspace.jsx`
- `ProfilePage.jsx`
- `SettingsDrawer.jsx`

---

## “Where is `useEffect` used?”

Main examples:

- `App.jsx` lines 48–65 — persistence side effects
- `LoginPage.jsx` lines 13–20 — update demo credentials from role preview
- `AppShell.jsx` line 35 — close mobile menu after route changes
- `ProfilePage.jsx` lines 15–20 — synchronize form state with user prop
- `ConfirmDialog.jsx` — focus/keyboard handling

---

## “Where is `map()` used?”

Search for `.map(`.

Important examples:

- navigation items
- tutor cards
- subjects
- requests
- notifications
- calendar dates
- profile initials

---

## “Where is the booking state saved?”

`frontend/src/App.jsx`, `createSession()`, lines 83–111.

The actual state setters are lines 108–109.

---

## “Where is the booking form?”

`frontend/src/pages/FormPage.jsx`, `BookingForm()`, beginning at line 29.

---

## “Where is validation?”

`FormPage.jsx` lines 88–111 for booking validation.

`LoginPage.jsx` lines 22–35 for login validation.

`AvailabilityPage.jsx` lines 39–58 for availability validation.

`ProfilePage.jsx` lines 22–26 for profile submission.

---

## “Where is the calendar?”

- `frontend/src/components/CalendarWorkspace.jsx`
- `frontend/src/pages/SessionsPage.jsx`
- compact dashboard calendar: `DashboardPage.jsx` `QuickCalendar()`

---

## “Where is tutor availability generated?”

`frontend/src/lib/slots.js`, especially `buildAvailability()` and the seeded availability helpers.

The hardcoded tutor profile definitions are in `frontend/src/data/mockData.js`.

---

## “Where is navigation handled?”

- route definitions: `App.jsx` lines 170–205
- main menu: `AppShell.jsx` lines 55–67
- programmatic navigation: search for `navigate(`
- declarative navigation: search for `<Link` and `<NavLink`

---

## “Where is the PCL logo?”

`frontend/src/components/Brand.jsx`.

---

## “Where is the CSS?”

`frontend/src/styles.css`.

The React components assign class names; the stylesheet controls the visual appearance.

---

# 43. Questions about the project architecture

## “Why is the state in `App.jsx`?”

> `App.jsx` is the common owner of application-level data that must be shared by multiple pages, such as the current user, requests, sessions, availability, and theme. Keeping those values in one owner prevents different pages from having separate conflicting copies.

## “Why are the components separate?”

> Components such as `TutorCard`, `Avatar`, `Brand`, and `CalendarWorkspace` represent reusable UI pieces. Separating them keeps page components focused and avoids repeating the same markup.

## “Why is mock data in a separate file?”

> The Midterm is hardcoded by design. Keeping the arrays in `mockData.js` gives the application one clear data source and prevents the same tutor/session data from being duplicated throughout the JSX.

## “Why no backend?”

> The current Midterm specification explicitly says the Midterm is a hardcoded frontend stage. Backend/API, database, real authentication, and mobile are part of later stages. fileciteturn2file0L17-L22 fileciteturn2file0L69-L75

---

# 44. Important distinction: state vs derived data

A useful pattern in the project is:

### Stored state

Things that can change through user interaction are stored with `useState`, for example:

- `search`
- `selectedDate`
- `requests`
- `sessions`
- `availability`

### Derived values

Things that can be calculated from current state are often derived instead of duplicated:

```text
requests → visibleRequests
sessions → visibleSessions
search + filters → filteredTutors
selectedDate + items → dayItems
```

This keeps the application from storing multiple copies of the same information.

---

# 45. If the lecturer points at a random line

Use this three-step method:

### 1. Identify the category

Ask yourself:

```text
Is this...
state?
function?
array operation?
event handler?
JSX?
CSS class?
route?
prop?
```

### 2. Identify its input and output

For example:

```js
items.filter((item) => item.status === 'Pending')
```

Input → `items` array

Condition → status is Pending

Output → new filtered array

### 3. Connect it to the UI

> “This result is then used by the component to render the pending request list.”

That is much better than only defining the JavaScript syntax.

---

# 46. Basic JavaScript/React answers worth memorizing

### What is `useState`?

> A React Hook used to store changing data and trigger a re-render when the state changes.

### What is `useEffect`?

> A React Hook used for side effects such as storage, DOM changes, synchronization, or subscriptions.

### What is a prop?

> A value passed from a parent component to a child component.

### What is `map()`?

> It transforms each array item into another value, which in React is commonly another JSX element.

### What is `filter()`?

> It creates a new array containing only items that satisfy a condition.

### What is `find()`?

> It returns the first item that satisfies a condition.

### What is `key`?

> A stable identifier React uses to track elements in a rendered list.

### What is `onChange`?

> A React event handler that runs when an input's value changes.

### What is `onSubmit`?

> A React event handler that runs when a form is submitted.

### What is `preventDefault()`?

> It stops the browser's default action, allowing the React code to control the form behavior.

### What is `useNavigate()`?

> A React Router Hook used to navigate to another route programmatically.

### What is conditional rendering?

> Rendering different JSX depending on a condition, such as the current user's role.

### What is a controlled input?

> An input whose displayed value is controlled by React state through `value` and `onChange`.

---

# 47. Midterm scope reminder

The project should be explained honestly as a **frontend prototype**.

The official brief says the Midterm deliverable uses:

- a Login page
- Menu/navigation
- Dashboard
- one form page/use case
- hardcoded data
- simulated role-based login

It also says the same application can conditionally render different content for the two roles. fileciteturn2file0L44-L57

The current repository contains additional supporting workspace routes because they make the prototype coherent and interactive. They should still be presented as part of the same frontend prototype rather than as evidence that the Midterm already contains the Final backend/mobile architecture.

---

# 48. Quick “where is where?” index

```text
LOGIN UI
→ frontend/src/pages/LoginPage.jsx

LOGIN CHECK
→ frontend/src/App.jsx
→ login() around lines 67–75

DEMO USERS
→ frontend/src/data/mockData.js
→ DEMO_ACCOUNTS around lines 3–25

STUDENT/TUTOR DASHBOARD
→ frontend/src/pages/DashboardPage.jsx
→ main component around lines 84–130

ROLE-SPECIFIC NAVIGATION
→ frontend/src/components/AppShell.jsx
→ studentNav / tutorNav lines 10–24

TUTOR SEARCH
→ frontend/src/pages/FindTutorPage.jsx

TUTOR CARDS
→ frontend/src/components/TutorCard.jsx

TUTOR PROFILE
→ frontend/src/pages/TutorDetailPage.jsx

BOOKING FORM
→ frontend/src/pages/FormPage.jsx
→ BookingForm() around line 29

BOOKING VALIDATION
→ frontend/src/pages/FormPage.jsx
→ submit() around lines 88–111

BOOKING SAVING
→ frontend/src/App.jsx
→ createSession() around lines 83–111

REQUEST ACCEPT/DECLINE/SUGGEST
→ frontend/src/App.jsx
→ requestAction() around lines 113–133

REQUEST PAGE
→ frontend/src/pages/RequestsPage.jsx

TUTOR AVAILABILITY FORM
→ frontend/src/pages/AvailabilityPage.jsx

AVAILABILITY HELPERS
→ frontend/src/lib/slots.js

CALENDAR
→ frontend/src/components/CalendarWorkspace.jsx

PROFILE
→ frontend/src/pages/ProfilePage.jsx

NOTIFICATIONS / ACTIVITY
→ frontend/src/pages/ActivityPage.jsx
→ frontend/src/components/NotificationPopover.jsx

SETTINGS
→ frontend/src/components/SettingsDrawer.jsx

NAVIGATION / ROUTES
→ frontend/src/App.jsx
→ frontend/src/components/AppShell.jsx

LOGO
→ frontend/src/components/Brand.jsx

ICONS
→ frontend/src/components/icons.jsx

GLOBAL CSS
→ frontend/src/styles.css

TESTS
→ frontend/src/test/
```

---

# 49. Final reading strategy for the team

A practical order for learning the submitted code is:

```text
1. main.jsx
2. App.jsx
3. LoginPage.jsx
4. DashboardPage.jsx
5. FindTutorPage.jsx
6. TutorCard.jsx
7. TutorDetailPage.jsx
8. FormPage.jsx
9. RequestsPage.jsx
10. CalendarWorkspace.jsx
11. mockData.js
12. styles.css
```

The most important relationship to understand is:

```text
Login
  ↓
user state
  ↓
role-based dashboard/menu
  ↓
Tutor discovery
  ↓
Booking form
  ↓
parent callback
  ↓
App state
  ↓
Requests/Sessions/Calendar update
```

That is the application's main story from both a user and code perspective.

---

# 50. Submission note

This file is intended to be **project documentation**. It explains the repository's structure and implementation without replacing the lecturer's ability to inspect the source code itself.

For private preparation, a separate personal study sheet can be used for rehearsing spoken answers. This document itself should remain factual and consistent with the submitted implementation.

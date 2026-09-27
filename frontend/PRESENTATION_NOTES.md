# PCL Tutor — 15-minute presentation + code spot-check guide

## Suggested 15-minute order
1. Problem + two actors (1.5 min)
2. Permission matrix + use case (2 min)
3. Activity flow (1.5 min)
4. UI walkthrough: Login → Student Dashboard → Find a Tutor → Tutor Detail → Booking Form → output (4 min)
5. Tutor login → Tutor Dashboard → Requests → Suggest another time → Sessions/Availability output (3 min)
6. Code explanation / spot check (2.5 min)
7. Close with midterm-to-final direction (30 sec)

## Explain-your-code essentials
### `useState`
Use `useState` for values that change from interaction and should trigger a re-render. Example in the form:
```js
const [topic, setTopic] = useState('');
```
When the user types, `setTopic` updates state and React renders the new value.

### Controlled inputs
Each input gets its value from state and updates through `onChange`.
```jsx
<input value={topic} onChange={(event) => setTopic(event.target.value)} />
```
This makes the form data available to validation and submit logic.

### `useEffect`
The app uses `useEffect` for side effects such as updating the document theme and saving UI preferences to localStorage. It is not used as a general data-fetching mechanism because the midterm has no backend/API.

### `map()` and `key`
Tutor cards, navigation items, subject chips, requests, notifications, and calendar cells are rendered from arrays with `map()`.
Each repeated item gets a stable `key={item.id}` or a similarly unique key.

### Props
The App component owns the main changing demo state (`user`, `sessions`, `requests`, `availability`) and passes values/callbacks down as props. This keeps one-way data flow easy to explain; route pages stay focused on presentation and interaction.

### `preventDefault`
The form submit handler calls `event.preventDefault()` so the browser does not reload the page. React then validates the controlled inputs and updates state.

### React Router
`HashRouter` is used because the final hosting target is GitHub Pages. `<Link>` changes the URL without a full page reload. Route guards redirect unauthenticated users to `/login`.

### Conditional rendering
The same Dashboard route renders different content based on `user.role`, matching the assignment requirement. Contextual routes reuse the same shell and shared hardcoded state instead of duplicating whole role-specific apps.

### Why no backend/auth?
The supplied midterm requirements explicitly say the UTS web app must use hardcoded frontend data with no database, backend API, or real authentication. The final project later connects this same web app to a real backend and then adds a client-only mobile app.

## Likely spot-check questions
- Where is the current role stored?
- Which component owns the booking state?
- How does the tutor response reach the matching session?
- Why is the input controlled?
- What happens if the login credentials are wrong?
- Where is the hardcoded data stored?
- Why do we use `HashRouter`?
- Why does the dashboard change for the second role without making a second dashboard page?
- What does `map()` do on the tutor array?
- Why do repeated cards need keys?

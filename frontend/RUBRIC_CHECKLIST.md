# PCL Tutor — Excellent-target rubric checklist

This checklist is written against the supplied UTS rubric and requirements. It is an implementation checklist, not a guarantee of a lecturer's grade.

## A — Proposal & modeling
- [x] A1: Two actors with different goals and access.
- [x] A1: Permission matrix includes relevant pages/actions.
- [x] A2: Use case diagram uses actors, a PCL Tutor system boundary, and action/task use cases rather than page names.
- [x] A2: One written use case includes preconditions, basic flow, and alternative flows.
- [x] A3: Activity diagrams include start/end, actions, decisions, failed login, failed validation, and output.
- [x] A4: Four page wireframes included under `docs/wireframes/` and matched to implemented pages.

## B — Page functionality
- [x] B1: Two hardcoded roles/accounts, credential check, role state, role-driven menu/dashboard, logout.
- [x] B2: React Router navigation with `<Link>`, protected inner routes, back buttons, and a 404 page.
- [x] B3: Dashboard content is role-specific and data-driven from arrays/objects with `map()` and keys; empty states included.
- [x] B4: Forms are controlled, use `preventDefault()`, validate, and show clear inline errors.
- [x] B5: Submitted booking/availability data updates React state and appears in dashboard output.

## C — Code quality & layout
- [x] C1: UI is broken into components and pages; App owns shared changing state; props carry data/callbacks.
- [x] C2: Semantic HTML (`header`, `nav`, `main`, `section`, `article`, `aside`, `form`, `label`) and separate CSS.
- [x] C2: Responsive layout for phone and desktop; navigation changes to a mobile drawer.
- [x] C3: Hardcoded data lives in `src/data/mockData.js` and repeated UI reads from the data source.

## D — Git & deployment
- [x] D1: README contains app description, accounts, run instructions, structure, GitHub workflow, and incremental commit guide.
- [x] D2: GitHub Pages workflow included; Vite uses relative base and the app uses HashRouter so page refreshes do not depend on server-side route rewrites.
- [ ] D1/D2: Team members must create the real repository and genuine incremental commits themselves.
- [ ] D2: Team must actually run the GitHub Pages deployment and verify the deployed URL before presentation.

## E — Presentation & code explanation
- [x] E1: `PRESENTATION_NOTES.md` has a 15-minute order matching login → dashboard → form → output for both roles.
- [x] E2: Notes explain `useState`, `useEffect`, props, `map`, keys, `onChange`, `preventDefault`, routing, controlled forms, conditional rendering, and one-way data flow.
- [ ] E1/E2: Every team member must personally rehearse and make one small code change they can explain.

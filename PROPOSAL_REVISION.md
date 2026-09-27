# Proposal revision — PCL Tutor

The supplied Campus Peer Tutor proposal remains the source baseline for the project. This revision records the decisions made after reviewing the rubric, original PCL references, and the team's UX feedback.

## Product direction
PCL means **Practice Centered Learning**. The project is intentionally student-oriented and focuses on the tutoring-booking workflow rather than reproducing a full LMS.

## Refined actor goals
- **Student / Mentee (Client):** find the right tutor for a specific AI subject and request a session that fits the student's needs and schedule.
- **Tutor / Mentor (Administrator/service provider):** publish availability and resolve incoming session requests.

## Refined request states
`Pending` → `Confirmed` / `Cancelled` / `Suggested`

A Suggested request stays visible to the Student until the student reviews the proposed time.

## UX decisions
- Discovery begins with subject/tutor search.
- Tutor cards use one main action: **View tutor profile**.
- Booking is a three-part controlled form: tutor/subject, schedule, and learning difficulty/details.
- Calendar is a dedicated interactive week/agenda workspace. The dashboard intentionally shows only a compact calendar snapshot so search, requests, and next-session information do not become cramped.
- Notifications use a compact header popover plus a dedicated `/notifications` workspace; each update links to a meaningful destination.
- Every primary visible button has a concrete destination or state change.
- Desktop navigation collapses to a symbol rail; mobile uses a separate drawer behavior.
- The visual system uses clear hierarchy, a consistent spacing scale, restrained radius, limited accent color, and high-contrast text.

## Scope discipline
The Midterm remains frontend-only, hardcoded, and role-based. The four assessed page families are still Login, Dashboard, Discovery/Detail, and Form; supporting contextual routes are used only to keep the prototype's navigation and visible actions functional.

# PCL Tutor — Project Description

## Project name
**PCL Tutor (Practice Centered Learning)**

## Description
PCL Tutor is a student-oriented peer tutoring web application. A Student/Mentee can search for help by course, compare peer tutors, review tutor profiles and availability, and request a focused study session either online or offline. A Tutor/Mentor can manage incoming booking requests, suggest an alternative time, publish availability, and maintain the courses they teach. The Midterm prototype uses hardcoded frontend data and simulated role-based login.

## Roles

### Student / Mentee — Client
- Search and filter tutors by course.
- View tutor details, rating, subjects, and availability.
- Request a tutoring session.
- Request a custom schedule.
- Review pending/suggested requests.
- View sessions and calendar.
- View activity and notifications.
- Edit their local demo profile.

### Tutor / Mentor — Administrator
- View incoming requests.
- Accept, decline, or suggest another time.
- Manage availability.
- Manage taught subjects.
- View sessions and calendar.
- View activity and notifications.
- Edit their local demo profile.

## Midterm pages

The four assessed page families remain:

1. Login
2. Dashboard
3. Discovery/detail
4. Booking form

Supporting workspace routes (sessions, requests, availability, subjects, activity, notifications, and profile) are included to make the prototype feel coherent and ensure visible controls have meaningful behavior.

## Main record sketch: StudySession

```text
id
studentId
studentName
tutorId
tutorName
subject
topic
date
time
mode
location
custom
status
notes
```

## Main record sketch: TutorAvailability

```text
tutorId
date
time
mode
status
```

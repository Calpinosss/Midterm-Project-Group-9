import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

export const STUDENT = {
  username: 'student',
  role: 'student',
  name: 'Nathan Andrew',
  initials: 'NA',
  major: 'Artificial Intelligence',
  semester: 3,
};

export const TUTOR = {
  username: 'tutor',
  role: 'tutor',
  name: 'Daniel Hartono',
  initials: 'DH',
  major: 'Artificial Intelligence',
  semester: 7,
  tutorId: 't1',
};

export function signInAs(user) {
  localStorage.setItem('pcl-user-v7', JSON.stringify(user));
}

export function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

// The review step that now stands in front of anything the app sends. Tests assert on
// the dialog contents and then press the labelled button, so a test cannot pass by
// accident if the confirmation is ever removed.
export const dialog = () => screen.getByRole('dialog');

export function confirmDialog(user, name) {
  return user.click(within(dialog()).getByRole('button', { name }));
}

export function cancelDialog(user) {
  return user.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
}

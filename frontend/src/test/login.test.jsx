import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STUDENT, TUTOR, renderApp, signInAs } from './helpers';

describe('simulated login', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to the dashboard when a session is already stored', async () => {
    signInAs(STUDENT);
    renderApp('/login');
    expect(await screen.findByText(/Find help that fits your schedule/i)).toBeInTheDocument();
  });

  it('prefills credentials when the preview role is switched to tutor', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.click(await screen.findByRole('button', { name: /tutor \/ mentor/i }));
    expect(screen.getByLabelText(/username/i)).toHaveValue('tutor');
    expect(screen.getByLabelText(/password/i)).toHaveValue('tutor123');
  });

  it('rejects a wrong password and stays on the login screen', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    const password = await screen.findByLabelText(/password/i);
    await user.clear(password);
    await user.type(password, 'wrong-password');
    await user.click(screen.getByRole('button', { name: /enter pcl tutor/i }));

    expect(await screen.findByText(/demo username or password is not correct/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it('signs a student in and lands on the student dashboard', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.click(await screen.findByRole('button', { name: /enter pcl tutor/i }));
    await waitFor(() => expect(localStorage.getItem('pcl-user-v7')).toContain('Nathan Andrew'));
    expect(await screen.findByText(/Find help that fits your schedule/i)).toBeInTheDocument();
  });

  it('signs a tutor in and lands on the tutor dashboard', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.click(await screen.findByRole('button', { name: /tutor \/ mentor/i }));
    await user.click(screen.getByRole('button', { name: /enter pcl tutor/i }));
    await waitFor(() => expect(localStorage.getItem('pcl-user-v7')).toContain('Daniel Hartono'));
    expect(await screen.findByText(/Make every tutoring hour count/i)).toBeInTheDocument();
  });

  it('keeps the tutor and student dashboards distinct', async () => {
    signInAs(TUTOR);
    const { unmount } = renderApp('/');
    expect(await screen.findByText(/Make every tutoring hour count/i)).toBeInTheDocument();
    unmount();

    signInAs(STUDENT);
    renderApp('/');
    expect(await screen.findByText(/Find help that fits your schedule/i)).toBeInTheDocument();
  });
});

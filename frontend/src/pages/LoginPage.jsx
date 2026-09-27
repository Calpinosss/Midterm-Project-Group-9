import React, { useEffect, useState } from 'react';
import { DEMO_ACCOUNTS } from '../data/mockData';
import Brand from '../components/Brand';
import { Icon } from '../components/icons';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rolePreview, setRolePreview] = useState('student');

  useEffect(() => {
    const account = DEMO_ACCOUNTS.find((item) => item.role === rolePreview);
    if (account) {
      setUsername(account.username);
      setPassword(account.password);
      setError('');
    }
  }, [rolePreview]);

  const submit = (event) => {
    event.preventDefault();
    setError('');
    const matched = DEMO_ACCOUNTS.find((item) => item.username === username.trim() && item.password === password);
    if (!matched) {
      setError('That demo username or password is not correct.');
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      onLogin(matched);
      setLoading(false);
    }, 350);
  };

  return (
    <div className="login-screen">
      <div className="login-grid">
        <section className="login-visual">
          <Brand />
          <div className="login-visual-copy">
            <span className="eyebrow">Campus peer tutoring</span>
            <h1>Find the person who can make the hard part click.</h1>
            <p>PCL Tutor helps students discover peer tutors, compare availability, and request a focused study session without digging through a crowded course platform.</p>
          </div>
          
        </section>

        <section className="login-panel">
          <div className="login-card">
            <div className="login-head"><span className="eyebrow">Sign In</span><h2>Choose your workspace</h2><p>The midterm uses two simulated roles from one web app: Student as Client, Tutor as Administrator.</p></div>

            <div className="role-switch" aria-label="Choose demo role">
              {['student', 'tutor'].map((role) => <button key={role} className={rolePreview === role ? 'selected' : ''} onClick={() => setRolePreview(role)}><span className="role-switch-title">{role === 'student' ? 'Student / Mentee' : 'Tutor / Mentor'}</span><span className="role-switch-caption">{role === 'student' ? 'Find and book a tutor' : 'Manage requests and availability'}</span></button>)}
            </div>

            <form className="login-form" onSubmit={submit}>
              <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
              <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
              {error && <div className="form-error"><Icon name="x" size={16} /><span>{error}</span></div>}
              <button className="primary-button full" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Enter PCL Tutor'}<Icon name="arrowRight" size={17} /></button>
            </form>

            <div className="demo-note"><strong>Demo accounts</strong><span>Student: student / student123</span><span>Tutor: tutor / tutor123</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}

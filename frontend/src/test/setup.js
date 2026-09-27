import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom does not implement scrollIntoView, and calling it throws, which would abort
// any handler that uses it before the rest of that handler runs.
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
});

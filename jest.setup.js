// In src/jest.setup.js or a similar file
import '@testing-library/jest-dom';

// Mock the global fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  })
);
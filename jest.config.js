/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // if you need to handle file imports in your components
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
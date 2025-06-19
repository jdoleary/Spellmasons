module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  modulePathIgnorePatterns: ['headless-server-build']
};

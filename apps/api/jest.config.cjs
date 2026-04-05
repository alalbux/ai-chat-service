/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: ['[\\\\/]main\\.ts$', '\\.module\\.ts$'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/../test/jest-dd-env.ts'],
  moduleNameMapper: {
    '^@ai-chat/contracts$': '<rootDir>/../../../packages/contracts/src/index.ts',
  },
};

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.(t|j)sx?$': 'ts-jest' },
  roots: ['<rootDir>/src'],
};

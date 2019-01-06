module.exports = {
  ...require('./jest.config'),
  globals: {
    'ts-jest': {
      diagnostics: false,
      tsConfig: 'tsconfig.coverage.json',
    },
  },
}

/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en', 'vi'],
  catalogs: [
    {
      path: '<rootDir>/apps/mobile/locales/{locale}/messages',
      include: ['apps/mobile'],
    },
  ],
  format: 'po',
  compileNamespace: 'ts',
}

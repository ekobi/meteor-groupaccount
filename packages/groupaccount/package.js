Package.describe({
  name: 'verody:groupaccount',
  version: '0.4.0',
  summary: 'Provides qualified access to a single Meteor user account from one or more sets of credentials.',
  git: 'https://github.com/ekobi/meteor-groupaccount.git',
  documentation: 'README.md',
});

Package.onUse(function(api) {
  api.use('npm-bcrypt', 'server');
  api.use([
    'accounts-base',
    'accounts-password',
    'ecmascript',
    'sha',
    'ejson',
    'ddp',
    'check',
    'underscore',
    'ddp-rate-limiter',
    'templating',
  ], ['client', 'server']);

  api.versionsFrom('1.5');
  api.imply(['accounts-base', 'accounts-password'], ['client', 'server']);
  api.mainModule('groupaccount-client.js', 'client');
  api.mainModule('groupaccount-server.js', 'server');
});

Package.onTest(function(api) {
  Npm.depends({
    chai: "4.0.2",
  });
  api.use(['practicalmeteor:mocha', 'random', 'ecmascript']);
  api.use(['accounts-base', 'verody:groupaccount', 'sha']);
  api.addFiles('groupaccount-client-tests.js','client');
});

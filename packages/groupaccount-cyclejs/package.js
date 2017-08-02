Package.describe({
  name: 'verody:groupaccount-cyclejs',
  version: '0.0.1',
  summary: 'Cycle.js component implementing groupaccount signin and management widget.',
  git: 'https://github.com/ekobi/meteor-groupaccount.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.5.1');
  api.use([
    'ecmascript',
    'es5-shim',
    'tracker',
    'verody:groupaccount',
  ], 'client');
  api.add_files([
    'adminStatus.js',
    'driver.js',
    'formInputVals.js',
    'intent.js',
    'main.js',
    'memberInfo.js',
    'model.js',
    'phase.js',
    'submitStatus.js',
    'userInfo.js',
    'view-bootstrap.js',
    'view.js',
  ].map((f) => `client/${f}`), 'client');
  api.export('GSI', 'client');
  api.imply(['reactive-var', 'verody:groupaccount']);
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('groupaccount-cyclejs');
  api.mainModule('groupaccount-cyclejs-tests.js');
});

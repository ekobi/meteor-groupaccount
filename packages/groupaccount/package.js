Package.describe({
    name: 'verody:groupaccount',
    version: '0.3.1',
    summary: 'Provides qualified access to a single Meteor user account from one or more sets of credentials.',
    git: 'https://github.com/ekobi/meteor-groupaccount.git',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.use('npm-bcrypt@0.8.5');
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

    api.versionsFrom('1.2.1');
    api.imply (['accounts-base','accounts-password'], ['client', 'server']);
    api.addFiles(['groupaccount-both.js']);
    api.addFiles(['groupaccount-client.js'], 'client');
    api.addFiles(['groupaccount-server.js'], 'server');
    api.export('GroupAccounts');
});

Package.onTest(function(api) {
    api.use(['tinytest', 'random']);
    api.use(['accounts-base', 'verody:groupaccount', 'sha']);
    api.addFiles('groupaccount-tests.js');
});

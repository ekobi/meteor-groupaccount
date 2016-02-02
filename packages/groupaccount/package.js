Package.describe({
    name: 'verody:groupaccount',
    version: '0.2.4'
    summary: 'Provides qualified access to a single Meteor user account from one or more sets of credentials.',
    git: 'https://github.com/ekobi/meteor-groupaccount.git',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.use('npm-bcrypt@=0.7.8_2');
    api.use([
        'accounts-base',
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
    api.imply ('accounts-base');
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

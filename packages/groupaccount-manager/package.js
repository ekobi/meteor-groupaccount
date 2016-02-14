Package.describe({
    name: 'verody:groupaccount-manager',
    version: '0.1.5',
    summary: 'Unstyled account management template for groupaccount.',
    git: 'https://github.com/ekobi/meteor-groupaccount.git',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.2.1');
    api.use([
        'ecmascript',
        'meteor',
        'mongo',
        'reactive-var',
        'verody:groupaccount@0.2.0'
    ],  [ 'server', 'client'] );
    api.use ([ 'templating', ], 'client');
    api.add_files([ 'groupaccount-manager.html', 'groupaccount-manager.js' ], 'client' );
    api.imply ( ['reactive-var', 'verody:groupaccount']);
});

Package.onTest(function(api) {
    api.use('ecmascript');
    api.use('tinytest');
    api.addFiles('');
});

Package.describe({
    name: 'verody:groupaccount-signin',
    version: '0.0.1',
    summary: 'Unstyled signin template for groupaccount.',
    git: 'https://github.com/ekobi/meteor-groupaccount.git',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.2.1');
    api.use([
        'ecmascript',
        'meteor',
        'verody:groupaccount'
    ]);
    api.use ([ 'templating', ], 'client');
    api.add_files([ 'groupaccount-signin.html', 'groupaccount-signin.js', ], ['client']);
    api.imply ('verody:groupaccount');
});

Package.onTest(function(api) {
    api.use('ecmascript');
    api.use('tinytest');
    api.addFiles('');
});

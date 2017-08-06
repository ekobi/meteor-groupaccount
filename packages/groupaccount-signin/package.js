Package.describe({
    name: 'verody:groupaccount-signin',
    version: '0.4.0',
    summary: 'Unstyled signin template for groupaccount.',
    git: 'https://github.com/ekobi/meteor-groupaccount.git',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.2.1');
    api.use([
        'ecmascript',
        'meteor',
        'reactive-var',
        'verody:groupaccount@0.4.0'
    ]);
    api.use ([ 'templating@1.3.2', ], 'client');
    api.add_files([ 'groupaccount-signin.html', 'groupaccount-signin.js', ], ['client']);
    api.imply ( ['reactive-var', 'verody:groupaccount']);
});

Package.onTest(function(api) {
    api.use('ecmascript');
    api.use('tinytest');
    api.addFiles('');
});

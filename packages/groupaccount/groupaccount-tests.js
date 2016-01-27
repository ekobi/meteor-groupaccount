if (Meteor.isClient) {

    GroupAccounts.Tester = (function (){
        var unique = Random.id();

        return {
            uniqueAccount : function () {
                return 'testAccount-'+unique;
            },

            uniqueUser : function (suffix) {
                suffix = suffix || '';
                return 'testUser-'+suffix+unique;
            },

            uniqueEmail: function () {
                console.log ('[uniqueEmail]',unique);
                return 'groupaccount-test-'+unique+'@example.com';
            },

            init: function (replacement) {
                var before = unique;
                unique = replacement || Random.id();
            }
        }
    })();

    Tinytest.addAsync ('groupaccount - test init', function (test, onComplete) {
        GroupAccounts.Tester.init();
        Meteor.logout ( function (err) {
            test.isFalse(err,err);
            onComplete();
        });
    });
    Tinytest.addAsync ('groupaccount - test createAccount', function (test, onComplete) {
        var params = {
            accountAdminPassword: 'thisIsASeriousPassword',
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            accountAdminEmail: GroupAccounts.Tester.uniqueEmail(),
        };
        GroupAccounts.createAccount (params, function (err,res) {
            //console.log ('[groupaccount test createAccount CB]', res, err);
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test createAccount duplicate', function (test, onComplete) {
        var params = {
            accountAdminPassword: 'thisIsASeriousPassword',
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            accountAdminEmail: GroupAccounts.Tester.uniqueEmail(),
        };
        GroupAccounts.createAccount (params, function (err,res) {
            //console.log ('[groupaccount test duplicate createAccount CB]', res, err);
            test.isTrue(err,'Help -- should not be able to create duplicate account!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test joinGroup', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: GroupAccounts.Tester.uniqueUser('1'),
            memberPassword: 'anotherCrazyPassword'
        };
        GroupAccounts.joinGroup( params, function (err,res) {
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test duplicate joinGroup ', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: GroupAccounts.Tester.uniqueUser('1'),
            memberPassword: 'anotherCrazyPassword'
        };
        GroupAccounts.joinGroup( params, function (err,res) {
            test.isTrue(err,'Help -- should not be able to add duplicate member!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test passwordLogin bad member', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: 'badMember',
            memberPassword: 'thisIsASeriousPassword'
        };

        Meteor.loginWithGroupAccount (params, function (err) {
            test.isTrue(err,'Help -- should not be able to login bad member!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test passwordLogin before approval', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: GroupAccounts.Tester.uniqueUser('1'),
            memberPassword: 'anotherCrazyPassword'
        };

        Meteor.loginWithGroupAccount (params, function (err) {
            test.isTrue(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test bad password login attempt', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: 'admin',
            memberPassword: 'thisIsASeriousPassword,right?'
        };

        Meteor.loginWithGroupAccount (params, function (err) {
            test.isTrue(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test passwordLogin admin', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: 'admin',
            memberPassword: 'thisIsASeriousPassword'
        };

        Meteor.loginWithGroupAccount (params, function (err) {
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test remove non-existent Member ', function (test, onComplete) {
        var params = {
            memberSelector: 'badMember'
        };
        GroupAccounts.removeMember( params, function (err,res) {
            test.isTrue(err,'Help -- should not be able to remove non-existent member!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test non-existent member approval', function (test, onComplete) {
        var params = {
            memberSelector: 'badMember',
        };

        GroupAccounts.activateMember (params, function (err,res){
            test.isTrue(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test member approval', function (test, onComplete) {
        var params = {
            memberSelector: GroupAccounts.Tester.uniqueUser('1'),
        };

        GroupAccounts.activateMember (params, function (err,res){
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test additional joinGroup ', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: GroupAccounts.Tester.uniqueUser('2'),
            memberPassword: 'anotherCrazyPassword'
        };
        GroupAccounts.joinGroup( params, function (err,res) {
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test excess joinGroup ', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: GroupAccounts.Tester.uniqueUser('2'),
            memberPassword: 'anotherCrazyPassword'
        };
        GroupAccounts.joinGroup( params, function (err,res) {
            test.isTrue(err,'Help -- should have tripped quota limit!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test bad config attempt ', function (test, onComplete) {
        var params = {
            pendingLimit : 3, badConfig: false
        };
        GroupAccounts.configure( params, function (err,res) {
            test.isTrue(err, 'Help -- should barf on invalid configuration parameter');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test increase quota ', function (test, onComplete) {
        var params = {
            pendingLimit : 2
        };
        GroupAccounts.configure( params, function (err,res) {
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test logout', function (test, onComplete) {
        Meteor.logout ( function (err) {
            test.isFalse(err,err);
            onComplete();
        });
    });


    Tinytest.addAsync ('groupaccount - test passwordLogin good member', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: GroupAccounts.Tester.uniqueUser('1'),
            memberPassword: 'anotherCrazyPassword'
        };

        Meteor.loginWithGroupAccount (params, function (err) {
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test removeMember', function (test, onComplete) {
        var params = {
            memberSelector: GroupAccounts.Tester.uniqueUser('2')
        };
        GroupAccounts.removeMember( params, function (err,res) {
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test remove bad Account', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount()+'badNews'
        };
        Meteor.call ('groupaccount/removeGroup', params, function (err,res) {
            test.isTrue(err,'Help -- should not be able to remove non-existent group!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test removeAccount', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount()
        };
        test.expect_fail();
        Meteor.call ('groupaccount/removeAccount', params, function (err,res) {
            test.isFalse(err,err);
            onComplete();
        });
    });
}

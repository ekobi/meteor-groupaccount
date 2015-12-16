if (Meteor.isClient) {

    GroupAccounts.Tester = (function (){
        var unique = Random.id();

        return {
            uniqueAccount : function () {
                console.log ('[uniqueAccount]',unique);
                return 'testAccount-'+unique;
            },

            uniqueEmail: function () {
                console.log ('[uniqueEmail]',unique);
                return 'groupaccount-test-'+unique+'@e-kobi.com';
            },

            updateUnique: function (replacement) {
                var before = unique;
                unique = replacement || Random.id();
                console.log ('[updateUnique] '+ before +' --> '+ unique);
            }
        }
    })();


    Tinytest.addAsync ('groupaccount - test init', function (test, onComplete) {
        GroupAccounts.Tester.updateUnique();
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

    //
    // test login with named account, member present/not present; correct/incorrect password
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

    Tinytest.addAsync ('groupaccount - test remove non-existent Member ', function (test, onComplete) {
        var params = {
            memberSelector: 'testMember1'
        };
        GroupAccounts.removeMember( params, function (err,res) {
            test.isTrue(err,'Help -- should not be able to remove non-existent member!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test addMember', function (test, onComplete) {
        var params = {
            memberSelector: 'testMember1',
            memberPassword: 'anotherCrazyPassword'
        };
        GroupAccounts.addMember( params, function (err,res) {
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test add duplicate member', function (test, onComplete) {
        var params = {
            memberSelector: 'testMember1',
            memberPassword: 'anotherCrazyPassword'
        };
        GroupAccounts.addMember( params, function (err,res) {
            test.isTrue(err,'Help -- should not be able to add duplicate member!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test logout', function (test, onComplete) {
        Meteor.logout ( function (err) {
            test.isFalse(err,err);
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

    Tinytest.addAsync ('groupaccount - test addMember while logged out', function (test, onComplete) {
        var params = {
            memberSelector: 'testMember2',
            memberPassword: 'anotherCrazyPassword'
        };
        GroupAccounts.addMember( params, function (err,res) {
            test.isTrue(err,'Help -- should not be able to add member while logged out!');
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test passwordLogin good member', function (test, onComplete) {
        var params = {
            accountSelector: GroupAccounts.Tester.uniqueAccount(),
            memberSelector: 'testMember1',
            memberPassword: 'anotherCrazyPassword'
        };

        Meteor.loginWithGroupAccount (params, function (err) {
            test.isFalse(err,err);
            onComplete();
        });
    });

    Tinytest.addAsync ('groupaccount - test removeMember', function (test, onComplete) {
            //
            // test named member present; named member not present; named account not present.
        var params = {
            memberSelector: 'testMember1'
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

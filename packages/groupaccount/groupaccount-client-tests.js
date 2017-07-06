import { Meteor } from 'meteor/meteor';
import { GroupAccountErrors, GroupAccounts } from 'meteor/verody:groupaccount';
import { Random } from 'meteor/random';
import { assert } from 'meteor/practicalmeteor:chai';
import mocha from 'meteor/practicalmeteor:mocha';

const tryWrap = (done, f) => {
  try {
    f();
    done();
  } catch (e) {
    done(e);
  }
};

GroupAccounts.Tester = (function() {
  let unique = Random.id();

  return {
    uniqueAccount: (suffix = '') => (`testAccount-${suffix}${unique}`),

    uniqueUser: (suffix = '') => (`testUser-${suffix}${unique}`),

    uniqueEmail: () => (`groupaccount-test-${unique}@example.com`),

    init: (replacement) => {
      unique = replacement || Random.id();
      return unique;
    },
  };
}());


mocha.before('Initializing ...', function(done) {
  GroupAccounts.Tester.init();
  Meteor.logout(() => done());
});

mocha.describe('groupaccount end-to-end tests via client API', function() {
  console.log('[client-tests] describe/this', this);
  mocha.it('should create a new group account.', function(done) {
    const params = {
      accountAdminPassword: 'thisIsASeriousPassword',
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      accountAdminEmail: GroupAccounts.Tester.uniqueEmail(),
    };
    GroupAccounts.createAccount(params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'account creation should succeed.'));
    });
  });

  mocha.it('should fail to create a duplicate account with same credentials.', function(done) {
    const params = {
      accountAdminPassword: 'thisIsASeriousPassword',
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      accountAdminEmail: GroupAccounts.Tester.uniqueEmail(),
    };
    GroupAccounts.createAccount(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'message':'Username already exists. [403]'));
    });
  });

  mocha.it('should permit a new member to join the group.', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: GroupAccounts.Tester.uniqueUser('1'),
      memberPassword: 'anotherCrazyPassword',
    };
    GroupAccounts.joinGroup(params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'adding group member should succeed.'));
    });
  });

  mocha.it('should deny access to non-member', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: 'badMember',
      memberPassword: 'thisIsASeriousPassword',
    };
    Meteor.loginWithGroupAccount(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.InvalidMember));
    });
  });

  mocha.it('should deny access to group members with pending approval', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: GroupAccounts.Tester.uniqueUser('1'),
      memberPassword: 'anotherCrazyPassword',
    };
    Meteor.loginWithGroupAccount(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.PendingAuthorization));
    });
  });

  mocha.it('should deny access as admin with bad password', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: '',
      memberPassword: 'thisIsABadPassword',
    };
    Meteor.loginWithGroupAccount(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.InvalidPassword));
    });
  });

  mocha.it('should permit admin login', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: '',
      memberPassword: 'thisIsASeriousPassword',
    };
    Meteor.loginWithGroupAccount(params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'admin login should succeed.'));
    });
  });

  mocha.it('should complain about removing non-existent member.', function(done) {
    const params = {
      memberSelector: 'badMember',
    };
    GroupAccounts.removeMember(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.InvalidMember));
    });
  });

  mocha.it('should complaing about approving non-existent member.', function(done) {
    const params = {
      memberSelector: 'badMember',
    };
    GroupAccounts.activateMember(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.InvalidMember));
    });
  });


  mocha.it('should approve real member activation', function(done) {
    const params = {
      memberSelector: GroupAccounts.Tester.uniqueUser('1'),
    };
    GroupAccounts.activateMember(params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'member activation should succeed.'));
    });
  });

  mocha.it('should refuse to permit new member to join with existing member name.', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: GroupAccounts.Tester.uniqueUser('1'),
      memberPassword: 'anotherCrazyPassword',
    };
    GroupAccounts.joinGroup(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.DuplicateMember));
    });
  });

  mocha.it('should permit adding additional group member', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: GroupAccounts.Tester.uniqueUser('2'),
      memberPassword: 'anotherCrazyPassword',
    };
    GroupAccounts.joinGroup(params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'additional members should be approved.'));
    });
  });

  mocha.it('should trip quota limit for pending new members', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: GroupAccounts.Tester.uniqueUser('2'),
      memberPassword: 'anotherCrazyPassword',
    };
    GroupAccounts.joinGroup(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.GroupClosed));
    });
  });

  mocha.it('should reject invalid configuration object', function(done) {
    const params = {
      pendingLimit: 3, badConfig: false,
    };
    GroupAccounts.configure(params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.InvalidConfigurationParameter));
    });
  });

  mocha.it('should permit quota increase for pending new members', function(done) {
    const params = {
      pendingLimit: 2,
    };
    GroupAccounts.configure(params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'should permit quota increase'));
    });
  });

  mocha.it('should permit admin logout', function(done) {
    Meteor.logout(function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'should permit admin logout'));
    });
  });

  mocha.it('should permit approved member login', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
      memberSelector: GroupAccounts.Tester.uniqueUser('1'),
      memberPassword: 'anotherCrazyPassword',
    };
    Meteor.loginWithGroupAccount(params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'should permit approved member login'));
    });
  });

  mocha.it('should permit removing member', function(done) {
    const params = {
      memberSelector: GroupAccounts.Tester.uniqueUser('2'),
    };
    GroupAccounts.removeMember(params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'should permit removing member'));
    });
  });

  mocha.it('should not be able to remove non-existent group', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount('badNews'),
    };
    Meteor.call('groupaccount/removeAccount', params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.InvalidGroupAccount));
    });
  });

  mocha.it('should not be able remove a valid account', function(done) {
    const params = {
      accountSelector: GroupAccounts.Tester.uniqueAccount(),
    };
    Meteor.call('groupaccount/removeAccount', params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', GroupAccountErrors.NotAllowed));
    });
  });
});

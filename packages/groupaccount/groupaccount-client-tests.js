import { Meteor } from 'meteor/meteor';
import GroupAccounts from 'meteor/verody:groupaccount';
import { Random } from 'meteor/random';
import { assert, expect, should as shouldFactory } from  'meteor/practicalmeteor:chai';
import mocha from 'meteor/practicalmeteor:mocha';

const should = shouldFactory();
const tryWrap = (done, f) => {
  try {
    f();
    done();
  } catch (e) {
    done(e);
  }
}

GroupAccounts.Tester = (function(){
  var unique = Random.id();

  return {
    uniqueAccount : function() {
      return 'testAccount-'+unique;
    },

    uniqueUser : function(suffix) {
      suffix = suffix || '';
      return 'testUser-'+suffix+unique;
    },

    uniqueEmail: function() {
      return 'groupaccount-test-'+unique+'@example.com';
    },

    init: function(replacement) {
      var before = unique;
      unique = replacement || Random.id();
    }
  }
})();

mocha.before('Initializing ...', function(done){
  GroupAccounts.Tester.init();
  Meteor.logout (() => done());
});

mocha.describe('groupaccount - test account creation', function() {
  const params = {
    accountAdminPassword: 'thisIsASeriousPassword',
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    accountAdminEmail: GroupAccounts.Tester.uniqueEmail(),
  };
  it('should create a new group account.', function(done){
    GroupAccounts.createAccount(params, function(err = {}, res){
      const { error = '' } = err;
      tryWrap(done, () => assert.equal (error, '', 'test account creation should suceed.'));
    });
  });
  it('should fail to create a duplicate account with same credentials.', function(done) {
    GroupAccounts.createAccount(params, function(err = {}, res){
      tryWrap(done, () => assert.propertyVal(err, 'message':'Username already exists. [403]'));
    });
  });
});

mocha.describe('groupaccount - test adding group member', function() {
  const params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: GroupAccounts.Tester.uniqueUser('1'),
    memberPassword: 'anotherCrazyPassword'
  };
  it('should permit a new member to join the group.', function(done) {
    GroupAccounts.joinGroup(params, function(err = {}, res) {
      const { error = '' } = err;
      tryWrap(done,() => assert.equal(error, '', 'adding group member should suceed.'));
    });
  });
});

mocha.describe('groupaccount - test adding duplicate group member', function(done) {
  const params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: GroupAccounts.Tester.uniqueUser('1'),
    memberPassword: 'anotherCrazyPassword'
  };
  it('should refuse to permit new member to join with existing member name.', function(done) {
    GroupAccounts.joinGroup(params, function(err = {}, res) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-duplicate-member'));
    });
  });
});

mocha.describe('groupaccount - test passwordLogin bad member', function() {

  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: 'badMember',
    memberPassword: 'thisIsASeriousPassword'
  };

  it('should deny access to non-member', function(done) {
    Meteor.loginWithGroupAccount (params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-invalid-member'));
    });
  });
});

mocha.describe('groupaccount - test passwordLogin before approval', function() {
  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: GroupAccounts.Tester.uniqueUser('1'),
    memberPassword: 'anotherCrazyPassword'
  };

  it('should deny access to group members with pending approval', function(done) {
    Meteor.loginWithGroupAccount (params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-pending-authorization'));
    });
  });
});

mocha.describe ('groupaccount - test bad password login attempt as admin', function() {
  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: '',
    memberPassword: 'thisIsASeriousPassword,right?'
  };
  it('should deny access as admin with bad password', function(done) {
    Meteor.loginWithGroupAccount (params, function(err = {}) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-invalid-password'));
    });
  });
});

mocha.describe('groupaccount - test passwordLogin admin', function() {
  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: '',
    memberPassword: 'thisIsASeriousPassword'
  };

  it('should permit admin login', function(done) {
    Meteor.loginWithGroupAccount (params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'admin login should suceed.'));
    });
  });
});

mocha.describe('groupaccount - test remove non-existent Member ', function() {
  var params = {
    memberSelector: 'badMember'
  };
  it('should complain about removing non-existent member.', function(done) {
    GroupAccounts.removeMember( params, function(err = {}, res) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-invalid-member'));
    });
  });
});

mocha.describe('groupaccount - test non-existent member approval', function() {
  var params = {
    memberSelector: 'badMember',
  };

  it('should complaing about approving non-existent member.', function(done) {
    GroupAccounts.activateMember (params, function(err = {}, res){
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-invalid-member'));
    });
  });
});

mocha.describe('groupaccount - test member approval', function() {
  var params = {
    memberSelector: GroupAccounts.Tester.uniqueUser('1'),
  };

  it('should approve member activation', function(done) {
    GroupAccounts.activateMember (params, function(err = {}, res){
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'member activation should suceed.'));
    });
  });
});

mocha.describe('groupaccount - test additional joinGroup ', function() {
  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: GroupAccounts.Tester.uniqueUser('2'),
    memberPassword: 'anotherCrazyPassword'
  };
  it('should permit additionnal group members', function(done) {
    GroupAccounts.joinGroup( params, function(err = {}, res) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'additional members should be approved.'));
    });
  });
});

mocha.describe('groupaccount - test excess joinGroup ', function() {
  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: GroupAccounts.Tester.uniqueUser('2'),
    memberPassword: 'anotherCrazyPassword'
  };
  it('should trip quota limit', function(done) {
    GroupAccounts.joinGroup( params, function(err = {}, res) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-group-closed'));
    });
  });
});

mocha.describe('groupaccount - test bad config attempt ', function() {
  var params = {
    pendingLimit : 3, badConfig: false
  };
  it('should permit admin login', function(done) {
    GroupAccounts.configure( params, function(err = {}, res) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-invalid-configuration-parameter'));
    });
  });
});

mocha.describe('groupaccount - test increase quota ', function() {
  var params = {
    pendingLimit : 2
  };
  it('should permit quota increase', function(done) {
    GroupAccounts.configure( params, function(err = {}, res) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'should permit quota increase'));
    });
  });
});

mocha.describe('groupaccount - test logout', function() {
  it('should permit admin logout', function(done) {
    Meteor.logout ( function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'should permit logout'));
    });
  });
});

mocha.describe('groupaccount - test passwordLogin good member', function() {
  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount(),
    memberSelector: GroupAccounts.Tester.uniqueUser('1'),
    memberPassword: 'anotherCrazyPassword'
  };

  it('should permit member login', function(done) {
    Meteor.loginWithGroupAccount (params, function(err = {}) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'should permit member login'));
    });
  });
});

mocha.describe('groupaccount - test removeMember', function() {
  var params = {
    memberSelector: GroupAccounts.Tester.uniqueUser('2')
  };
  it('should permit removing member', function(done) {
    GroupAccounts.removeMember( params, function(err = {}, res) {
      const { error = '' } = err;
      tryWrap(done, () => assert.equal(error, '', 'should permit removing member'));
    });
  });
});

mocha.describe('groupaccount - test remove bad Account', function() {
  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount()+'badNews'
  };
  it('should not be able to remove non-existent group', function(done) {
    Meteor.call ('groupaccount/removeAccount', params, function(err = {}, res) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-invalid-group-account'));
    });
  });
});

mocha.describe('groupaccount - test removeAccount', function() {
  var params = {
    accountSelector: GroupAccounts.Tester.uniqueAccount()
  };
  it('should not be able remove a valid account', function(done) {
    Meteor.call ('groupaccount/removeAccount', params, function(err = {}, res) {
      tryWrap(done, () => assert.propertyVal(err, 'error', 'groupaccount-not-allowed'));
    });
  });
});

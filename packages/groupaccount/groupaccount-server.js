import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { NpmModuleBcrypt } from 'meteor/npm-bcrypt';
import { _ } from 'meteor/underscore';
import { GroupAccountUtils, GroupAccountErrors } from './groupaccount-utils.js';

const bcrypt = NpmModuleBcrypt;
const bcryptHash = Meteor.wrapAsync(bcrypt.hash);
const bcryptCompare = Meteor.wrapAsync(bcrypt.compare);

Accounts.registerLoginHandler('groupaccount', function(arg) {
  if (!arg.groupaccount) {
    return undefined;
  }

  const params = arg.groupaccount;
  check(params, Match.ObjectIncluding({
    accountSelector: String,
    memberSelector: String,
    memberPassword: GroupAccountUtils.validDigestPassword,
  }));

  // console.log('[GroupAccounts.loginHandler] params:', params);
  const group = Meteor.users.findOne({ username: params.accountSelector });
  if (!group) {
    throw new Meteor.Error(
      GroupAccountErrors.InvalidGroupAccount,
      `Group Account not found for '${params.accountSelector}'`);
  }

  const result = { userId: group._id };
  if (!params.memberSelector) {
    //
    // base account login.
    if (!bcryptCompare(params.memberPassword.digest, group.services.password.bcrypt)) {
      result.error = new Meteor.Error(
        GroupAccountErrors.InvalidPassword, 'Invalid Password');
      // console.log('[GroupAccounts.loginHandler] base login Invalid Password. Params:', params);
      return result;
    }
    // console.log('[GroupAccounts.loginHandler] base login SUCCESS. Params/result:',
    //  params, result);
    return result;
  }

  if (!group.services.groupaccount.config.enabled) {
    throw new Meteor.Error(
      GroupAccountErrors.GroupClosed,
      'Group account logins disabled');
  }

  const groupMember = group.services.groupaccount.members[params.memberSelector];
  if (!groupMember) {
    throw new Meteor.Error(
      GroupAccountErrors.InvalidMember,
      `No member '${params.memberSelector}' in group '${params.accountSelector}'`);
  }

  if (groupMember.pendingActivation) {
    result.error = new Meteor.Error(
      GroupAccountErrors.PendingAuthorization,
      'Group membership pending authorization.');
    // console.log('[GroupAccounts.loginHandler] Pending Activation. Params/Result:', params);
    return result;
  }

  if (!bcryptCompare(params.memberPassword.digest, groupMember.bcrypt)) {
    result.error = new Meteor.Error(
      GroupAccountErrors.InvalidPassword, 'Invalid GroupMember Password');
    // console.log('[GroupAccounts.loginHandler] Invalid GroupMember Password. Params, result:',
    //  params, result);
    return result;
  }
  // console.log('[GroupAccounts.loginHandler] SUCCESS. Params, result:', params, result);
  return result;
});

Meteor.publish('groupaccount/memberInfo', function () {
  // console.log(`[GroupAccounts Meteor.publish] this.userId: ${this.UserId}`)
  if (!this.userId) {
    return [];
  }
  const group = Meteor.users.findOne(this.userId);
  if (!group || !group.services || !group.services.groupaccount) {
    return [];
  }
  const infoRecord = (services) => {
    if (!services) {
      return {};
    }
    const ret = { pendingLimit: services.groupaccount.config.pendingLimit };
    ret.members = _.object(
      _.map(services.groupaccount.members,
            (val, key) => [key, _.omit(val, ['bcrypt'])]),
    );
    return ret;
  };
  const handle = Meteor.users.find(this.userId).observeChanges({
    added: (id, fields) => {
      if (fields.services) {
        this.added('groupaccount/memberInfo', this.userId, infoRecord(fields.services));
      }
    },
    changed: (id, fields) => {
      if (fields.services) {
        this.changed('groupaccount/memberInfo', this.userId, infoRecord(fields.services));
      }
    },
  });

  this.added('groupaccount/memberInfo', this.userId, infoRecord(group.services));

  this.ready();
  this.onStop(() => {
    handle.stop();
  });

  return [];
});

Accounts.onCreateUser(function(options, user) {
  const ret = user;
  ret.services = ret.services || {};
  ret.services.groupaccount = {
    config: { pendingLimit: 1, enabled: true },
    members: {},
  };
  // console.log('[groupAccount/onCreateUser CB]', options, ret);
  return ret;
});

Meteor.methods({
  'groupaccount/configure': function(params) {
    try {
      check(params, {
        pendingLimit: Match.Optional(Number),
        enabled: Match.Optional(Boolean),
      });
    } catch (e) {
      // console.log('[groupaccount/configure]', e);
      throw new Meteor.Error(
        GroupAccountErrors.InvalidConfigurationParameter,
        `Invalid configuration parameter: '${e.path}'.`);
    }

    if (!this.userId) {
      throw new Meteor.Error(
        GroupAccountErrors.NotLoggedIn,
        'Must be logged in to configure group.');
    }

    const group = Meteor.users.findOne(this.userId);
    if (!group || !group.services || !group.services.groupaccount) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidGroupAccount, 'Not logged into a group account.');
    }

    const ret = _.extend(group.services.groupaccount.config, params);
    const query = {};
    query['services.groupaccount.config'] = ret;
    // console.log('[groupaccount/configure] query:', query);
    const status = Meteor.users.update(group._id, { $set: query });
    if (status < 1) {
      throw new Meteor.Error(
        GroupAccountErrors.UpdateFailed, 'Unable to configure',
      );
    }
    return ret;
  },

  'groupaccount/removeAccount': function(params) {
    // console.log('[groupaccount/removeAccount]', params);
    check(params, Match.ObjectIncluding({
      accountSelector: String,
    }));

    const group = Meteor.users.findOne({ username: params.accountSelector });
    if (!group || !group.services || !group.services.groupaccount) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidGroupAccount, `No group account '${params.accountSelector}.'`);
    }

    throw new Meteor.Error(
      GroupAccountErrors.NotAllowed, 'Removing groups not allowed.');
  },

  'groupaccount/joinGroup': function(params) {
    // console.log('[groupaccount/joinGroup]', params);
    check(params, Match.ObjectIncluding({
      accountSelector: String,
      memberSelector: String,
      memberPassword: GroupAccountUtils.validDigestPassword,
    }));

    const group = Meteor.users.findOne({ username: params.accountSelector });
    if (!group || !group.services || !group.services.groupaccount) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidGroupAccount,
        `Group Account not found for '${params.accountSelector}'.`);
    }

    if (!group.services.groupaccount.config.enabled) {
      throw new Meteor.Error(
        GroupAccountErrors.GroupClosed,
        'Group not considering new members.',
      );
    }

    const pendingCount =
      _.reduce(group.services.groupaccount.members,
               (memo, member) => memo + (member.pendingActivation ? 1 : 0), 0);

    if (pendingCount >= group.services.groupaccount.config.pendingLimit) {
      throw new Meteor.Error(
        GroupAccountErrors.GroupClosed,
        'Group not considering new members.',
      );
    }

    if (group.services.groupaccount.members[params.memberSelector]) {
      throw new Meteor.Error(
        GroupAccountErrors.DuplicateMember,
        `Duplicate member:'${params.memberSelector}.`,
      );
    }

    const query = {};
    query[`services.groupaccount.members.${params.memberSelector}`] = {
      bcrypt: bcryptHash(params.memberPassword.digest, 10),
      pendingActivation: true,
    };
    const status = Meteor.users.update(group._id, { $set: query });
    if (status < 1) {
      throw new Meteor.Error(
        GroupAccountErrors.UpdateFailed,
        `Unable to add member '${params.memberSelector}.`,
      );
    }
    return group._id;
  },

  'groupaccount/activateMember': function(params) {
    // console.log('[groupaccount/activateMember] params', params);
    check(params, Match.ObjectIncluding({
      memberSelector: String,
    }));

    if (!this.userId) {
      // console.log(`[groupaccount/activateMember] '${params.memberSelector}' not logged in`);
      throw new Meteor.Error(
        GroupACcountErrors.NotLoggedIn, 'Must be logged in to activate group members.');
    }

    const group = Meteor.users.findOne(this.userId);
    if (!group || !group.services || !group.services.groupaccount) {
      // console.log(
      // `[groupaccount/activateMember] '${params.memberSelector}' not a group account`);
      throw new Meteor.Error(
        GroupAccountErrors.InvalidGroupAccount, 'Not logged into a group account.');
    }

    if (!group.services.groupaccount.members[params.memberSelector]) {
      // console.log(`[groupaccount/activateMember] '${params.memberSelector}' invalid member`);
      throw new Meteor.Error(
        GroupAccountErrors.InvalidMember, `Member '${params.memberSelector}' does not exist in this group.`);
    }

    const query = {};
    query[`services.groupaccount.members.${params.memberSelector}.pendingActivation`] = false;
    // console.log('[groupaccount/activateMember] query:', query);
    const status = Meteor.users.update(group._id, { $set: query });
    if (status < 1) {
      // console.log(`[groupaccount/activateMember] '${params.memberSelector}' update failed`);
      throw new Meteor.Error(
        GroupAccountErrors.UpdateFailed, `Unable to activate member '${params.memberSelector}'.`,
      );
    }
    return group._id;
  },

  'groupaccount/deactivateMember': function(params) {
    // console.log('[groupaccount/deactivateMember]', params);
    check(params, Match.ObjectIncluding({
      memberSelector: String,
    }));

    if (!this.userId) {
      throw new Meteor.Error(
        GroupAccountErrors.NotLoggedIn, 'Must be logged in to deactivate group members.');
    }

    const group = Meteor.users.findOne(this.userId);
    if (!group || !group.services || !group.services.groupaccount) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidGroupAccount, 'Not logged into a group account.');
    }

    if (!group.services.groupaccount.members[params.memberSelector]) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidMember,
        `Member '${params.memberSelector}' does not exist in this group.`);
    }

    if (params.memberSelector === 'admin') {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidMember,
        'Cannot deactivate group administrator');
    }

    const query = {};
    query[`services.groupaccount.members.${params.memberSelector}.pendingActivation`] = true;
    // console.log('[groupaccount/activateMember] query:', query);
    const status = Meteor.users.update(group._id, { $set: query });
    if (status < 1) {
      throw new Meteor.Error(
        GroupAccountErrors.UpdateFailed,
        `Unable to deactivate member '${params.memberSelector}.`,
      );
    }
    return group._id;
  },

  'groupaccount/removeMember': function(params) {
    // console.log('[groupaccount/removeMember]', params);
    check(params, Match.ObjectIncluding({
      memberSelector: String,
    }));

    if (!this.userId) {
      throw new Meteor.Error(
        GroupAccountErrors.NotLoggedIn, 'Must be logged in to remove group members.');
    }

    const group = Meteor.users.findOne(this.userId);
    if (!group || !group.services || !group.services.groupaccount) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidGroupAccount, 'Not logged into a group account.');
    }

    if (!group.services.groupaccount.members[params.memberSelector]) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidMember,
        `Member '${params.memberSelector}' does not exist in this group.`);
    }

    if (params.memberSelector === 'admin') {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidMember,
        'Cannot remove group administrator');
    }

    const query = {};
    query[`services.groupaccount.members.${params.memberSelector}`] = {};
    const status = Meteor.users.update(group._id, { $unset: query });
    // console.log('[groupaccount/removeMember] status:', status);
    if (status < 1) {
      throw new Meteor.Error(
        GroupAccountErrors.UpdateFailed,
        `Unable to remove member '${params.memberSelector}'.`,
      );
    }
    return group._id;
  },

  'groupaccount/members': function() {
    if (!this.userId) {
      throw new Meteor.Error(
        GroupAccountErrors.NotLoggedIn, 'Must be logged in to list group members.');
    }

    const group = Meteor.users.findOne(this.userId);
    if (!group || !group.services || !group.services.groupaccount) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidGroupAccount,
        'Not logged into a group account.');
    }

    //
    // strip out sensitive field(s) of member dictionary
    return _.object(
      _.map(group.services.account.members,
            (val, key) => [key, _.omit(val, ['bcrypt'])]),
    );
  },

  'groupaccount/probe': function(params) {
    try {
      check(params, {
        accountSelector: Match.Optional(String),
        memberSelector: Match.Optional(String),
      });
    } catch (e) {
      throw new Meteor.Error(
        GroupAccountErrors.InvalidProbeParams, e.message);
    }

    const ret = {
      ...params,
      validNewGroup: false,
      validOldGroup: false,
      validNewMember: false,
      validOldMember: false,
      membershipOpen: false,
    };

    if (!params.accountSelector) {
      return ret;
    }

    const group = Meteor.users.findOne({ username: params.accountSelector });
    if (!group) {
      //
      // unclaimed Meteor username.
      ret.validNewGroup = true;
      return ret;
    }

    if (!group.services || !group.services.groupaccount) {
      //
      // existing Meteor username, but not group account
      return ret;
    }
    ret.validOldGroup = true;


    if (!group.services.groupaccount.config.enabled) {
      return ret;
    }

    const pendingCount =
      _.reduce(group.services.groupaccount.members,
               (memo, member) => memo + (member.pendingActivation ? 1 : 0), 0);

    if (pendingCount < group.services.groupaccount.config.pendingLimit) {
      ret.membershipOpen = true;
    }

    if (!params.memberSelector || group.services.groupaccount.members[params.memberSelector]) {
      ret.validOldMember = true;
      return ret;
    }

    if (params.memberSelector) {
      //
      // I guess any non-zero-length member name is okay?
      ret.validNewMember = true;
    }
    return ret;
  },

});

DDPRateLimiter.addRule({
  type: 'method',
  name: 'groupaccount/probe',
  connectionId: () => true,
}, 10, 1000);

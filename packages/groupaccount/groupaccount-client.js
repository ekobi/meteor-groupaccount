import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { SHA256 } from 'meteor/sha';
import { GroupAccountUtils } from './groupaccount-utils.js';

GroupAccounts = {};

/** @module groupaccount */
/** @namespace Meteor */
/**
   @desc Callback functions for the MeteorLoginWith* methods.
   Returns a Meteor.Error on early failure. Otherwise, returns
   an object with userId set to Meteor.users document ID for
   this group account, and perhaps error set to a Meteor.Error.
   @callback meteorLoginWithFooCB
   @param {Meteor.Error} err - undefined on successful invocation
 */
/**
   @desc Log in to existing group account. Fails if member activation is pending. Asynchronous.
   @param {Object} params - invocation parameters
   @param {string} params.memberSelector
   @param {string} params.memberPassword
   @param {meteorLoginWithFooCB} callback - invoked upon completion
 */
Meteor.loginWithGroupAccount = function(params, callback) {
  // console.log('[Meteor.loginWithGroupAccount]', params);

  check(params, Match.ObjectIncluding({
    accountSelector: String,
    memberSelector: String,
    memberPassword: String,
  }));
  params.memberPassword = {
    digest: SHA256(params.memberPassword),
    algorithm: 'sha-256',
  };

  Accounts.callLoginMethod({
    methodArguments: [{ groupaccount: params }],
    userCallback: callback,
  });
};

/** @namespace GroupAccounts */
/**
   @desc Callback functions for the GroupAccounts.* methods all have the same
   signature and return semantics.
   @callback groupAccountsCB
   @param {Meteor.Error} err - undefined on successful invocation
   @param {Object} result - varies
 */

/** @desc Helper shim to override template renderFunctions. Succeeds silently, or throws an error.
   Inspired by template-replaces() from aldeed:template-extension package. Good stuff.
   @param {string|Template} replacement - name of updated template as specified in HTML source code, or its corresponding Blaze Template object.
 */
Template.prototype._gaOverride = function (replacement){
  var r = '<non-blaze-template>';
  if (typeof replacement === 'string') {
    r = replacement;
    replacement = Template[replacement];
  }
  if (replacement && replacement instanceof Blaze.Template ) {
    this.renderFunction = replacement.renderFunction;
    return;
  }
  throw new Meteor.Error(
    "groupaccount-invalid-template",
    "unable to override with '" + r + "'");
}

/** @desc Creates a new group account via asynchronous server method invocation
   Callback throws an error, or returns a Meteor.users document
   @param {Object} params - invocation parameters
   @param {string} params.accountSelector
   @param {email} params.accountAdminEmail
   @param {string} params.accountAdminPassword
   @param {groupAccountsCB} callback - invoked upon completion
 */
GroupAccounts.createAccount = function(params, callback) {
  if (callback) { check(callback, Function); }

  check(params, Match.ObjectIncluding({
    accountAdminPassword: String,
    accountAdminEmail: GroupAccountUtils.validEmail,
    accountSelector: String,
  }));
  Accounts.createUser({
    username: params.accountSelector,
    email: params.accountAdminEmail,
    password: params.accountAdminPassword,
  }, callback);
};

/**
   @desc Reports, and optionally modifies, configuration paramters for
   currently-logged-in group account. Asynchronous.
   On success, callback returns the current (and possibly updated) configuration parameters.
   @param {object} params - parameters to configure
   @param {number} [params.pendingLimit]
   @param {groupAccountsCB} callback - invoked upon completion
 */
GroupAccounts.configure = function(params, callback) {
  Meteor.call('groupaccount/configure', params, callback);
};

/**
   @desc Adds a new member to existing group. Asynchronous.
   On success callback returns a Meteor.users document ID for this group account
   @param {object} params - parameters
   @param {string} params.accountSelector
   @param {string} params.memberSelector
   @param {string} params.memberPassword
   @param {groupAccountsCB} callback - invoked upon completion
 */
GroupAccounts.joinGroup = function(params, callback) {
  // console.log('[GroupAccounts.joinGroup]', params);

  if (callback) { check(callback, Function); }
  check(params, Match.ObjectIncluding({
    accountSelector: String,
    memberSelector: String,
    memberPassword: String,
  }));
  params.memberPassword = {
    digest: SHA256(params.memberPassword),
    algorithm: 'sha-256' };
  Meteor.call('groupaccount/joinGroup', params, callback);
};

/**
   @desc Removes an existing existing user from a group.
   Must be logged in to group account. Asynchronous.
   On success, callback returns a Meteor.users document for this group account
   @param {object} params - parameters
   @param {string} params.memberSelector
   @param {groupAccountsCB} callback - invoked upon completion
 */
GroupAccounts.removeMember = function(params, callback) {
  // console.log('[GroupAccounts.removeMember]', params);
  if (callback) { check(callback, Function); }
  check(params, Match.ObjectIncluding({
    memberSelector: String }));
  Meteor.call('groupaccount/removeMember', params, callback);
  Meteor.logoutOtherClients();
};

/**
   @desc Activates a new group member. Must be logged in to group account. Asynchronous.
   On success, callback returns the Meteor.Users doument ID for this group account.
   @param {Object} params - invocation parameters
   @param {string} params.memberSelector
   @param {groupAccountsCB} callback - invoked upon completion
 */
GroupAccounts.activateMember = function(params, callback) {
  if (callback) { check(callback, Function); }
  check(params, Match.ObjectIncluding({ memberSelector: String }));
  Meteor.call('groupaccount/activateMember', params, callback);
};


/**
   @desc Dectivates a group member. Must be logged in to group account. Asynchronous.
   On success, callback returns the Meteor.Users doument ID for this group account.
   @param {Object} params - invocation parameters
   @param {string} params.memberSelector
   @param {groupAccountsCB} callback - invoked upon completion
 */
GroupAccounts.deactivateMember = function(params, callback) {
  if (callback) { check(callback, Function); }
  check(params, Match.ObjectIncluding({
    memberSelector: String }));
  Meteor.call('groupaccount/deactivateMember', params, callback);
  Meteor.logoutOtherClients();
};


/**
   @desc A group account probe status object.
   @typedef {Object} groupAccountStatusObject
   @property {boolean} validNewGroup
   @property {boolean} validOldGroup
   @property {boolean} validNewMember
   @property {boolean} validOldMember
   @property {boolean} membershipOpen
 */
/**
   @desc Throttled probe of group account and, optionally, a group member. Asynchronous.
   On success, callback returns a status object for the group acccount.
   @param {Object} params - invocation parameters
   @param {string} params.accountSelector
   @param {string} [params.memberSelector]
   @param {groupAccountsCB} callback - invoked upon completion
   @returns {groupAccountStatusObject} Well, the callback returns one of these, if it wants.
 */
GroupAccounts.probe = function(params, callback) {
  if (callback) { check(callback, Function); }
  check(params, {
    accountSelector: Match.Optional(String),
    memberSelector: Match.Optional(String),
  });
  Meteor.call('groupaccount/probe', params, callback);
};

import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

GroupAccountUtils = {
  validEmail: Match.Where(function(x) {
    if (_.isString(x)) {
      if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}$/i.test(x)) {
        return true;
      }
    }

    const xString = _.isString(x) ? x : '<non-string-object>';
    throw new Meteor.Error(
      'groupaccount-invalid-email',
      `Invalid email: '${xString}'`,
    );
  }),

  validDigestPassword: Match.Where(function(x) {
    check(x, { digest: String, algorithm: String });
    return x.algorithm === 'sha-256';
  }),

};

GroupAccountErrors = {
  DuplicateMember: 'groupaccount-duplicate-member',
  GroupClosed: 'groupaccount-group-closed',
  InvalidConfiguration_Parameter: 'groupaccount-invalid-configuration-parameter',
  InvalidGroupAccount: 'groupaccount-invalid-group-account',
  InvalidMember: 'groupaccount-invalid-member',
  InvalidPassword: 'groupaccount-invalid-password',
  InvalidProbeParams: 'groupaccount-invalid-probe-params',
  NotAllowed: 'groupaccount-not-allowed',
  NotLoggedIn: 'groupaccount-not-logged-in',
  PendingAuthorization: 'groupaccount-pending-authorization',
  UpdateFailed: 'groupaccount-update-failed',
};

export { GroupAccountUtils, GroupAccountErrors }

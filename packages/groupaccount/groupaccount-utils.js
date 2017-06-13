import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

const GroupAccountUtils = {

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
export default GroupAccountUtils;

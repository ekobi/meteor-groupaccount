import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { _ } from 'lodash';
import xs from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';
import { userInfo$Factory } from './userInfo.js';
import { memberInfo$Factory } from './memberInfo.js';

export const gsiDriver = (collectionHandle) => {
  const factory = () => {
    const stream$s = {
      userInfo$: userInfo$Factory(),
      memberInfo$: memberInfo$Factory(collectionHandle),
    };
    return {
      select: (selector) => {
        if (_.has(stream$s, selector)) { return stream$s[selector]; }
        return null;
      },
    };
  }
  return factory;
};

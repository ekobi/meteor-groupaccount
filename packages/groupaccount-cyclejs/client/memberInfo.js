import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { _ } from 'lodash';
import xs from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';

//
// produce updates tracking reactive GroupAccount member info
export const memberInfo$Factory = (collectionHandle) => {
  const collectionName = collectionHandle._name;
  return adapt(xs.createWithMemory({
    start: (listener) => {
      this.memberInfoSubscription = Meteor.subscribe (
        collectionName, {
          onStop: (err) => {
            listener.next({});
          },
          onReady: () => {
            listener.next(collectionHandle.findOne());
          },
        }
      );

      this.memberInfoTracker = Tracker.autorun ((tc) => {
        listener.next(collectionHandle.findOne() || {});
      });
    },
    stop: () => {
      this.memberInfoTracker.stop();
      this.memberInfoSubscription.stop();
    },
  }));
};

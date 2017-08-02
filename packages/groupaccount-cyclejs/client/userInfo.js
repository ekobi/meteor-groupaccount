import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { _ } from 'lodash';
import xs from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';

//
// produce updates tracking reactive Meteor UserInfo()
// A single tracker instance is shared to all subscribers
export const userInfo$Factory = () => {
  return adapt(xs.createWithMemory({
    start: (listener) => {
      this.alreadyLoggedOut = true;
      this.userInfoTracker = Tracker.autorun(() => {

        //
        // Meteor.user() is a reactive data source in Meteor land.
        let userInfo = Meteor.user() || {};
        if( _.isEmpty(userInfo) ) {
          userInfo.loggedIn = false;

          if(!this.alreadyLoggedOut) {
            //
            // pulse out a single 'freshLogout' notification to trigger
            // reset logic downstream.
            listener.next({ ...userInfo, freshLogout:true });
          }
          userInfo.freshLogout = false;
          this.alreadyLoggedOut = true;
        } else {
          this.alreadyLoggedOut = false;
          userInfo.loggedIn = true;
          userInfo.freshLogout = false;
        }
        listener.next(userInfo);
      });
    },
    stop: () => {
      this.userInfoTracker.stop();
    },
  }));
}

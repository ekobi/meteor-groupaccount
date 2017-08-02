import { _ } from 'lodash';
import xs from 'xstream';
import throttle from 'xstream/extra/throttle';
import { adapt } from '@cycle/run/lib/adapt';
import { GroupAccounts } from 'meteor/verody:groupaccount';

//
// produce responses to probes triggered on
// account/member selector input field updates
const probe = ({ accountSelector, memberSelector }) => {
  return new Promise((resolve, reject) => {
    GroupAccounts.probe({ accountSelector, memberSelector }, function (err, result) {
      if(err) {
        reject(err)
      } else {
        resolve(result);
      }
    });
  });
};

const probeResponseProducer = (formInputVals$) => {
  return {
    start: (listener) => {
      formInputVals$
        .addListener({
        next: (probeParams) => {
          probe(probeParams).then((v) => {
            listener.next(v);
          });
        },
        error: () => {},
        complete: () => {},
      });

    },
    stop: () => {},
  }
};

//
// produce a stream of signin process phase, based on
// probeResponse$ stream.
const phaseGrokker = ({
  validNewGroup=false, validOldGroup=false, membershipOpen=false,
  validNewMember=false, validOldMember=false,
}, { loggedIn }) => {

  if (loggedIn) return 'loggedIn';

  if (!validNewGroup && !validOldGroup ) return 'start';

  if (validNewGroup) return 'newGroup';

  if (validOldGroup && !validNewMember && !validOldMember)
    return 'mainLogin';

  if (validOldGroup && validNewMember && membershipOpen)
    return 'newMember';

  if (validOldGroup && validOldMember) return 'memberLogin';

  if (validOldGroup && validNewMember && !membershipOpen)
    return 'groupClosed';

  return 'start';

};

export const phase$Factory = (formInputVals$, userInfo$) => {
  return adapt(xs
    .combine (xs.createWithMemory(probeResponseProducer(formInputVals$)), userInfo$)
    .map(([formInputVals, userInfo]) => phaseGrokker(formInputVals, userInfo))
  );
}

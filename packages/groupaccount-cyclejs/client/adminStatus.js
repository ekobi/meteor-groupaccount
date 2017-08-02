import { _ } from 'lodash';
import xs from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';
import { GroupAccounts } from 'meteor/verody:groupaccount';

const adminEventHandlers = {
  'approvemember': ({ memberselector }) => {
    GroupAccounts.activateMember ({ memberSelector:memberselector });
  },
  'deactivatemember': ({ memberselector }) => {
    GroupAccounts.deactivateMember ({ memberSelector:memberselector });
  },
  'removemember': ({ memberselector }) => {
    GroupAccounts.removeMember ({ memberSelector:memberselector });
  },
  'bumppendinglimit': ({ delta, pendinglimit }) => {
    GroupAccounts.configure ({
      pendingLimit: Math.max(Number.parseInt(pendinglimit)+Number.parseInt(delta), 0),
    });
  },
};

const adminEventHandler = (attrs) => {
  const action = attrs.action;
  if (!_.has(adminEventHandlers, action)) {
    return Promise.reject(new Error(`Unrecognized admin action '${action}'`));
  }
  adminEventHandlers[action](attrs);
  return Promise.resolve(attrs);
};

//
// trap Admin-related DOM events; fire off
// server requests; and report status responses
export const adminStatus$Factory = (DOM) => {

  const adminEvent$ = DOM
    .select('.gsiadminbutton').events('click');
    //.debug('[adminEvent$]');

  return adapt(xs.create({
    start: (listener) => {
      adminEvent$.addListener({
        next: (event) => {
          event.preventDefault();
          const attrs = _.reduce(event.target.dataset, (ret, val, key) => { ret[key] = val; return ret }, {});
          adminEventHandler(attrs).then((v) => {
            listener.next(v);
          }).catch((reason) => {
            console.log(`[adminInfo -- ${action}] rejected because:`, reason);
            listener.error(reason);
          });
        },
        error: () => {},
        complete: () => {},
      });
    },
    stop: () => {},
  }));
};

import { _ } from 'lodash';
import xs from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';
import { formsquare } from 'formsquare'
import { GroupAccounts } from 'meteor/verody:groupaccount';

//
// produce server status responses to submit clicks
const submitHandlers = {
  'creategroup': (action, formData) => {
    const params = {
      accountAdminPassword: formData.password,
      accountSelector: formData.accountSelector,
      accountAdminEmail: formData.accountEmail,
    };
    return new Promise((resolve, reject) => {
      GroupAccounts.createAccount(params, (err,response) => {
        resolve ({
          action,
          success: err ? false : true,
          text: err ? err.reason : 'Success!',
        });
      });
    });
  },

  'joingroup': (action, formData) => {
    const params = {
      accountSelector: formData.accountSelector,
      memberSelector: formData.memberSelector,
      memberPassword: formData.password,
    };
    return new Promise((resolve, reject) => {
      GroupAccounts.joinGroup(params, (err,res) => {
        if (err && (err.error!='groupaccount-duplicate-member')) {
          resolve ({
            action,
            success: false,
            text: err.reason,
          });
        } else {
          const loginParams = {
            accountSelector: formData.accountSelector,
            memberSelector: formData.memberSelector,
            memberPassword: formData.password,
          };
          Meteor.loginWithGroupAccount(loginParams,(err) => {
            resolve ({
              action,
              success: err ? false : true,
              text: err ? err.reason : 'Success!',
            });
          });
        }
      });
    });
  },

  'logintogroup': (action, formData) => {
    const params = {
      accountSelector: formData.accountSelector,
      memberSelector: formData.memberSelector,
      memberPassword: formData.password,
    };
    return new Promise((resolve, reject) => {
      Meteor.loginWithGroupAccount(params, (err) => {
        resolve ({
          action,
          success: err ? false : true,
          text: err ? err.reason : 'Success!',
        });
      });
    });
  },

  'logout': (action, formData) => {
    return new Promise((resolve, reject) => {
      Meteor.logout((err) => {
        resolve ({
          action,
          success: err ? false : true,
          text: err ? err.reason : 'Adieu.',
        });
      });
    });
  },
};

const submitHandler = (action, formData) => {
  if (!_.has(submitHandlers, action)) {
    return Promise.reject(new Error(`Unrecognized submit action '${action}'`));
  }
  return submitHandlers[action](action, formData);
};

export const submitStatus$Factory = (domSource$) => {
  const submitEvent$ = domSource$
    .select('.gsiinput.submitButton').events('click');
  return adapt(xs
    .createWithMemory({
      start: (listener) => {
        submitEvent$.addListener({
          next: (event) => {
            const action = event.target.dataset.action ;
            //console.log('[submitStatus$] event:', event);
            const formData = formsquare(event.target.form, (el) => {
              return el.type != 'button';
            });
            event.preventDefault();
            submitHandler(action, formData).then((v) => {
              listener.next(v);
            }).catch((reason) => {
              console.log(`[submitStatus$ -- ${action}] rejected because:`, reason);
              listener.error(reason);
            });
          },
          error: () => {},
          complete: () => {},
        });
      },
      stop: () => {},
    })
    .startWith({})
  );
};

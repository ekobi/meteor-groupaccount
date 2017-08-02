import xs from 'xstream';
import { _ } from 'lodash';

const validEmailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const defaultInfo = {
  submitTests: {},
  submitAction: '',
  submitButtonText: 'Sign In',
  infoText: 'Enter a Group Name to get started',
};

export const gsiFormInputNames = [
  'accountSelector',
  'memberSelector',
  'accountEmail',
  'password',
  'verifyPassword',
];

export const gsiCustomization = {
  start: defaultInfo,

  loggedIn: _.defaults({
    submitTests: true,
    submitAction: 'logout',
    submitButtonText: 'Sign Out',
    infoText: 'Signed In',
  }, defaultInfo),

  newGroup: _.defaults(
    {
      submitButtonText: 'Create Group',
      submitTests: {
        require: {
          accountSelector: /[\w-]{3,}$/,
          accountEmail: validEmailRegex,
          password: /[\w-]{3,}$/,
        },
        match: ['password', 'verifyPassword'],
      },
      submitAction: 'creategroup',
      infoText: 'Create new group',
    }, defaultInfo),

  memberLogin: _.defaults(
    {
      submitButtonText: 'Login',
      submitAction: 'logintogroup',
      submitTests: {
        require: {
          accountSelector: /[\w-]{3,}$/,
          password: /[\w-]{3,}$/,
        },
      },
      infoText: 'Login to group as existing member',
    }, defaultInfo),

  mainLogin: _.defaults(
    {
      infoText: 'Enter member name',
      submitButtonText: 'Login',
      submitAction: 'logintogroup',
      submitTests: {
        require: {
          accountSelector: /[\w-]{3,}$/,
          password: /[\w-]{3,}$/,
        },
      },
    }, defaultInfo),

  newMember: _.defaults(
    {
      submitButtonText: 'Join Group',
      submitAction: 'joingroup',
      submitTests: {
        require: {
          accountSelector: /[\w-]{3,}$/,
          memberSelector: /[\w-]{3,}$/,
          password: /[\w-]{3,}$/,
        },
        match: ['password', 'verifyPassword'],
      },
      infoText: 'Join group as new member',
    }, defaultInfo),

  groupClosed: _.defaults({
    infoText: 'Group closed to new members',
  }, defaultInfo),

  pendingApproval: _.defaults({
    submitTests: true,
    submitAction: 'logintogroup',
    submitButtonText: 'Login',
    infoText: 'Try Again Later',
  }, defaultInfo),
};

const isReadyToSubmit$ = (phase$, formVals$) => {

  return xs
    .combine(phase$, formVals$)
    //.debug('[isReadyToSubmit$] combined phase$/formVals$')
    .map(([ phase, formVals ]) => {
      const submitInfo = { formVals };
      const tests = gsiCustomization[phase].submitTests;
      if ( tests === true || tests === false ) { return { ...submitInfo, isReady: tests }; }
      else if (_.isEmpty(tests)) { return { ...submitInfo, isReady: false }; }

      const isReady = _.every(
        _.map(tests, (vals, key) => {
          if ( key == 'match' ) {
            const v0 = formVals[vals[0]];
            return _.isString(v0) && _.every(
              _.tail(vals), (v) => {
                const vn = formVals[v];
                return _.isString(vn) && (v0 == vn);
              }
            );
          } else if (key == 'require') {
            return _.every(vals, (regex, propKey) => {
              const vn = formVals[propKey];
              return _.isString(vn) && regex.test(vn);
            });
          }
          throw new TypeError(
            `Error unknown test "${key}" presented to isReadyToSubmit$.`);
        }), (val) => {
          return val == true;
        }
      );
      //console.log('[isReadyToSubmit] ret:', { ...submitInfo, isReady });
      return { ...submitInfo, isReady };
    })
  /*.startWith(false)*/;
}

export const gsiModel = ({ gsiSources, formInputVals$, phase$, submitStatus$, }) => {

  const formStatus$ = isReadyToSubmit$(phase$, formInputVals$);

  const signinProps$ = xs
    .combine(phase$, gsiSources.select('userInfo$'), formStatus$, submitStatus$)
    .map(([ phase, userInfo, formStatus, submitStatus ]) => {
      const loggedIn = userInfo.loggedIn;
      //console.log('[model] userInfo:', userInfo);
      return {

        userInfo: {
          emails: userInfo.emails,
          username: userInfo.username,
        },

        statusFooter : {
          value: submitStatus.text,
        },

        accountSelector: {
          active: loggedIn? false : true,
          name: 'accountSelector',
          selector: '.accountSelector',
          label: 'Account Selector',
          value: formStatus.formVals.accountSelector,
        },

        memberSelector: (() => {
          let active = undefined;
          if (loggedIn) {
            active = false;
          } else if (_.includes (['newMember', 'memberLogin', 'mainLogin', 'groupClosed', 'pendingApproval' ], phase)) {
            active = true;
          } else {
            active = false;
          }
          return {
            active,
            name: 'memberSelector',
            selector: '.memberSelector',
            label: 'Member Selector',
            value: formStatus.formVals.memberSelector,
          }})(),

        accountEmail: (() => {
          let active = false;
          if (loggedIn) {
            //no-op
          } else if (phase == 'newGroup') {
            active = true;
          }
          return {
            active,
            name: 'accountEmail',
            selector: '.accountEmail',
            label: 'Account Email',
            value: formStatus.formVals.accountEmail,
          }})(),

        password: (() => {
          let active = undefined;
          if (loggedIn) {
            active = false;
          } else if (_.includes (['newGroup', 'memberLogin', 'mainLogin', 'newMember', 'pendingApproval',  ], phase)) {
            active = true;
          } else {
            active = false;
          }
          return {
            active,
            name: 'password',
            selector: '.password',
            label: 'Password',
            value: formStatus.formVals.password,
          }})(),

        verifyPassword: (() => {
          let active = undefined;
          if (loggedIn) {
            active = false;
          } else if (_.includes (['newGroup', 'newMember', 'pendingApproval',  ], phase)) {
            active = true;
          } else {
            active = false;
          }
          return {
            active,
            name: 'verifyPassword',
            selector: '.verifyPassword',
            label: 'Verify Password',
            value: formStatus.formVals.verifyPassword,
          }
        })(),

        submitButton: (() => {
          const { submitTests, submitButtonText, submitAction } = gsiCustomization[phase];
          return {
            active: formStatus.isReady ? true : false,
            test: submitTests,
            action:submitAction,
            value:submitButtonText
          }})(),

        infoBanner: {
          value: gsiCustomization[phase].infoText,
        },
      }
    })/*.debug('model/signinProps$')*/;

  const adminProps$ = gsiSources.select('memberInfo$').map((memberInfo) => {
    if( _.isEmpty(memberInfo)) {
      return { active: false };
    }
    const mappedInfo = { active : true };
    mappedInfo.pendingLimit = memberInfo.pendingLimit;
    mappedInfo.activeMembers = _.reduce(memberInfo.members, (ret, val, key) => {
      return val.pendingActivation ? ret : _.concat(ret,{memberSelector:key});
    }, []);
    mappedInfo.pendingMembers = _.reduce(memberInfo.members, (ret, val, key) => {
      return val.pendingActivation ? _.concat(ret, {memberSelector:key}) : ret;
    }, []);
    return mappedInfo;
  })/*.debug('[model/adminProps$]')*/;

  return ({ signinProps$, adminProps$ })
}

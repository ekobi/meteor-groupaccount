import xs from 'xstream';
import { input, h, hr, h1, p, div, form, ul, li, button } from '@cycle/dom';
import { _ } from   'lodash';

const inputField = (props) => {
  const { active=false, name, selector, label, type='text', value='', placeholder=label, }  = props;
  if (!active ) return null;
  return div([
    input(selector+'.gsiinput', {attrs: { type, name, value, placeholder, }}),
  ]);
}

const submitButton = ({
  active = false, tests = {}, action = '', selector, value = '',
}) => {
  if (!active) return null;
  return input('.gsiinput.submitButton', {attrs: { type: 'button', 'data-action':action, value }});
}

const infoBanner = ({ value }) => {
  return div('.gsiInfoBanner', value);
}

const statusFooter = ({ value }) => {
  return value;
};

const pendingMember = ({ memberSelector }) => {
  return li([
    memberSelector,
    button('.gsiadminbutton', { attrs: { 'data-memberSelector': memberSelector, 'data-action': 'approvemember', }}, 'Approve'),
    button('.gsiadminbutton', { attrs: { 'data-memberSelector': memberSelector, 'data-action': 'removemember', }}, 'Remove'),
  ]);
}
const pendingControlsListItems = ({ pendingMembers, pendingLimit }) => {
  const ret = [
    li([
      `Pending:${pendingMembers.length}/${pendingLimit}`,
      button('.gsiadminbutton', { attrs: { 'data-action': 'bumppendinglimit', 'data-delta': 1, 'data-pendinglimit': pendingLimit }}, '+' ),
      button('.gsiadminbutton', { attrs: { 'data-action': 'bumppendinglimit', 'data-delta': -1, 'data-pendinglimit': pendingLimit }}, '-' ), ]),
    ..._.map((pendingMembers), (memberInfo) => pendingMember(memberInfo)),
  ];
  return ret;
}
const activeMemberListItems = ({ activeMembers }) => {
  return _.map((activeMembers), ({ memberSelector }) => {
    return li([
      memberSelector,
      button('.gsiadminbutton', { attrs: { 'data-memberSelector': memberSelector, 'data-action': 'deactivatemember', }}, 'Deactivate'),
      button('.gsiadminbutton', { attrs: { 'data-memberSelector': memberSelector, 'data-action': 'removemember', }}, 'Remove'),
    ]);
  });
}

export const gsiView = ({ signinProps$, adminProps$ })  => {
  const vdom$ = xs
    .combine(signinProps$, adminProps$)
    .map(([ signinProps, adminProps ]) => {
      return div('.gsi', [
	h('legend',signinProps.infoBanner.value),

	adminProps.active ? div([
	  hr(),
	  ul('.gsiadminlist',[
	    ...activeMemberListItems(adminProps),
	    ...pendingControlsListItems(adminProps),
	  ])]) : null,

	div(form('.gsiinputform', [
	  hr(),
	  inputField(signinProps.accountSelector),
	  inputField(signinProps.memberSelector),
	  inputField({ ...signinProps.accountEmail, type:'email' }),
	  inputField({ ...signinProps.password, type:'password' }),
	  inputField({ ...signinProps.verifyPassword, type:'password' }),
	  submitButton(signinProps.submitButton),
	])),
	hr(),
	statusFooter(signinProps.statusFooter),
    ]);
  });
  return {
    DOM: vdom$,
  };
}

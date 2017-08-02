import xs from 'xstream';
import { a, input, h, hr, h1, p, div, form, ul, li, button, span } from '@cycle/dom';
import { _ } from   'lodash';

const inputField = (props) => {
  const { active=false, name, selector, label, type='text', value='', placeholder=label, }  = props;
  if (!active ) return null;
  return div([
    input(selector+'.gsiinput.form-control', {
      attrs: { type, name, value, placeholder, },
      style: { border: 'none', 'border-color': 'transparent' }
    }),
  ]);
}

const submitButton = ({
  active = false, tests = {}, action = '', selector, value = '',
}) => {
  if (!active) return [null];
  return [
    hr(),
    input('.gsiinput.submitButton.btn.btn-default', {attrs: { type: 'button', 'data-action':action, value }})
  ];
}

const pendingMember = ({ memberSelector }) => {
  return li('.list-group-item.justify-content-between',[
    memberSelector,
    span('.gsiadminbutton.btn.btn-default.btn-xs.pull-right.glyphicon.glyphicon-ok', { attrs: {
      'data-memberSelector': memberSelector, 'data-action': 'approvemember', }
    }),

    span('.gsiadminbutton.btn.btn-default.btn-xs.pull-right.glyphicon.glyphicon-remove', { attrs: {
      'data-memberSelector': memberSelector, 'data-action': 'removemember', }
    }),
  ]);
}
const pendingControlsListItems = ({ pendingMembers, pendingLimit }) => {
  const ret = [
    li('.list-group-item.justify-content-between',[
      `Pending:${pendingMembers.length}/${pendingLimit}`,
      span('.gsiadminbutton.btn.btn-default.btn-xs.pull-right.glyphicon.glyphicon-plus', { attrs: {
        'data-action': 'bumppendinglimit', 'data-delta': 1, 'data-pendinglimit': pendingLimit }
      }),
      span('.gsiadminbutton.btn.btn-default.btn-xs.pull-right.glyphicon.glyphicon-minus', { attrs: {
        'data-action': 'bumppendinglimit', 'data-delta': -1, 'data-pendinglimit': pendingLimit }
      }),
    ]),
    ..._.map((pendingMembers), (memberInfo) => pendingMember(memberInfo)),
  ];
  return ret;
}
const activeMemberListItems = ({ activeMembers }) => {
  return _.map((activeMembers), ({ memberSelector }) => {
    return li('.list-group-item', [
      memberSelector,
      span('.gsiadminbutton.btn.btn-default.btn-xs.pull-right.glyphicon.glyphicon-pause', { attrs: {
        'data-action': 'deactivatemember', 'data-memberSelector': memberSelector, }
      }),
      span('.gsiadminbutton.btn.btn-default.btn-xs.pull-right.glyphicon.glyphicon-remove', { attrs: {
        'data-action': 'removemember', 'data-memberSelector': memberSelector, }
      }),
    ]);
  });
}

const infoHeader = ({ value }) => {
	return div('.panel-heading', p ({
    attrs: { style:"text-align: center; margin-top: 30px;" }
  }, value ));
}

const statusFooter = ({ value }) => {
	return div('.panel-footer', p ({
    attrs: { style:"text-align: center; margin-top: 30px;" }
  }, value ));
}
export const gsiView = ({ signinProps$, adminProps$ })  => {
  const vdom$ = xs
    .combine(signinProps$, adminProps$)
    .map(([ signinProps, adminProps ]) => {
      return div('.gsi.panel.panel-default',[
        infoHeader(signinProps.infoBanner),
        div('.panel-body',[
	        adminProps.active ? div([
	          ul('.gsiadminlist.list-group', [
	            ...activeMemberListItems(adminProps),
	            ...pendingControlsListItems(adminProps),
	          ])]) : null,

	        div(form('.gsiinputform',{
            style: {'text-align': 'center', 'margin-top': '30px' }}, [
	            inputField(signinProps.accountSelector),
	            inputField(signinProps.memberSelector),
	            inputField({ ...signinProps.accountEmail, type:'email' }),
	            inputField({ ...signinProps.password, type:'password' }),
	            inputField({ ...signinProps.verifyPassword, type:'password' }),
	            ...submitButton(signinProps.submitButton),
	          ])),
        ]),
	      statusFooter(signinProps.statusFooter),
      ]);
    });
  return {
    DOM: vdom$,
  };
}

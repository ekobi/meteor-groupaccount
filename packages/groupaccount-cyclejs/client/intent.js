import xs from 'xstream';
import { _ } from 'lodash';

import { adminStatus$Factory } from './adminStatus.js'
import { submitStatus$Factory } from './submitStatus.js'
import { formInputVals$Factory } from './formInputVals.js'
import { phase$Factory } from './phase.js'

export const gsiIntent = ({ DOM, gsiSources }) => {

  const submitStatus$ = submitStatus$Factory(DOM)
  const formInputVals$ = formInputVals$Factory(DOM, gsiSources.select('userInfo$'));
  const phase$ = phase$Factory(formInputVals$,gsiSources.select('userInfo$'));


  //
  // Need to attach listener in order to kick off
  // submit handlers, whether or not we care about the
  // response (which we probably don't).
  const adminStatus$ = adminStatus$Factory(DOM);
  adminStatus$
    //.debug('[adminStatus$]')
    .addListener({
    next: (status) => {
      //console.log('[intent/adminStatus] status:', status);
    },
    error: () => {},
    complete: () => {},
  });

  return { gsiSources, submitStatus$, formInputVals$, phase$, };
}

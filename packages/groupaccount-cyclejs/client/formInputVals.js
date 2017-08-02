import { _ } from 'lodash';
import xs from 'xstream';
import { gsiFormInputNames } from './model.js';
import { adapt } from '@cycle/run/lib/adapt';

//
// combine all specified input fields into a single stream
// of key/value dicts. Replace input value streams on fresh logout.
export const formInputVals$Factory = (DOM, userInfo$) => {

  const sources$Factory = (listener) => {
    const formInputVal$List = _.reduce(gsiFormInputNames, (ret, name) => {
      const inputNameVal$ = DOM
        .select(`.gsiinput.${name}`)
        .events('input')
        .map(ev => ({name, value:ev.target.value }))
        .startWith({ name, value:''});
      ret.push(inputNameVal$);
      return ret;
    }, []);

    const sources$ = xs
      .combine(...formInputVal$List)
      .map((formInputValList) => {
        return _.reduce(formInputValList, (ret, { name, value }) => {
          ret[name] = value;
          return ret;
        }, {});
      });

    sources$.addListener({
      next:(formInputVals) => {
        listener.next(formInputVals);
      },
      error: () => {},
      complete: () => {},
    });
    return sources$;
  }

  const formInputValsProducer = {
    start: (listener) => {
      //
      // kick off attaching listener to new sources$ stream.
      let sources$ = sources$Factory(listener);

      //
      // replace sources$ when logout detected.
      userInfo$.addListener({
        next: ({ freshLogout }) => {
          if ( freshLogout ) {
            sources$.removeListener(listener);
            sources$ = sources$Factory(listener);
          }
        },
        error: () => {},
        complete: () => {},
      });
    },
    stop: () => {},
  };

  return adapt(xs.createWithMemory(formInputValsProducer));
};

# groupaccount-cyclejs
Use `groupaccount-cyclejs` to build an xstream-based UI component for [`groupaccount`](https://atmospherejs.com/verody/groupaccount).

## Usage

Add the package thus:

```
meteor add verody:groupaccount-cyclejs
```

which will pull in the core groupaccount package as well.

## Example

The exported GSI package includes a driver that encapsulates singleton subscription to the groupaccount/memberInfo table; and a Cycle.js component main function:

```

    import { makeDOMDriver } from '@cycle/dom';
    import { run } from '@cycle/run';
    import { GSI } from 'meteor/verody:groupaccount-cyclejs';

    Meteor.startup(() => {
      console.log('[Meteor.startup]');

      const collectionName = 'groupaccount/memberInfo';
      const collectionHandle = new Mongo.Collection(collectionName);

      const DOM = makeDOMDriver('#app');
      const gsiSources = GSI.driver(collectionHandle);

      const drivers = { DOM, gsiSources };
      const dispose = run(GSI.main, drivers);

    });

```

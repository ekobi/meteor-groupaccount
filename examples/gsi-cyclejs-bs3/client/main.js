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

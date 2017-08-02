// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by groupaccount-cyclejs.js.
import { name as packageName } from "meteor/groupaccount-cyclejs";

// Write your tests here!
// Here is an example.
Tinytest.add('groupaccount-cyclejs - example', function (test) {
  test.equal(packageName, "groupaccount-cyclejs");
});

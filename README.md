[![Build Status](https://travis-ci.org/ekobi/meteor-groupaccount.svg?branch=master)](https://travis-ci.org/ekobi/meteor-groupaccount)
# groupaccount
Use the `groupaccount` packages to provide qualified access to a single Meteor account from one or more sets of credentials:

1. [`groupaccount`](https://atmospherejs.com/verody/groupaccount) - Provides the core, server-side functionality, along with some client-side wrappers and helpers.
2. [`groupaccount-signin`](https://atmospherejs.com/verody/groupaccount-signin) - Provides an unstyled, reactive signin UI template
3. [`groupaccount-manager`](https://atmospherejs.com/verody/groupaccount-manager) - Provides an unstyled, reactive management UI template

## Some helpful definitions

- **`accountSelector`** : a globally-unique identifier for the account. Associated with a single `Meteor.user`
- **`memberSelector`** : locally-unique identifier for someone allowed to read/write some or all data associated with the group
- **`accountAdmin`** : special, non-optional account member allowed to read/write all data associated with the group

## Usage

Add the package thus:

```
meteor add verody:groupaccount
```

## Examples

Callback functions for the `GroupAccounts.*` methods all have the same signature and return semantics:

```
        var params = {
            accountAdminPassword: 'thisIsASeriousPassword',
            accountSelector: 'joes-group-account',
            accountAdminEmail: 'joes-group@example.com'
        };
        GroupAccounts.createAccount (params, function (err,res) {
            //
            // err is undefined on successful invocation.
            // res is the Meteor.userId for the new account.
            console.log ('[groupaccount test createAccount CB]', res, err);
        });
```

The callback for Meteor.loginWithGroupAccount follows the convention for the Meteor.loginWith* methods:

```
        var params = {
            accountSelector: 'joes-group-account',
            memberSelector: 'admin',
            memberPassword: 'thisIsASeriousPassword'
        };

        Meteor.loginWithGroupAccount (params, function (err) {
            //
            // err is undefined on successful invocation.
            console.log ('[groupaccount test loginWithGroupAccount CB]', err);
        });

```

Also, take a look at the [`examples on github`](https://github.com/ekobi/meteor-groupaccount/tree/master/examples/groupaccount-bs3). And there may be [`a live demo running here.`](http://groupaccount.meteor.com)

## Pipeline
- **member roles** to facilitate access control to portions of the `Meteor.user()` data.

* * *
## API Reference

* [groupaccount](#module_groupaccount)
    * [`~Meteor`](#module_groupaccount..Meteor) : <code>object</code>
        * [`.loginWithGroupAccount(params, callback)`](#module_groupaccount..Meteor.loginWithGroupAccount)
    * [`~GroupAccounts`](#module_groupaccount..GroupAccounts) : <code>object</code>
        * [`.createAccount(params, callback)`](#module_groupaccount..GroupAccounts.createAccount)
        * [`.configure(params, callback)`](#module_groupaccount..GroupAccounts.configure)
        * [`.joinGroup(params, callback)`](#module_groupaccount..GroupAccounts.joinGroup)
        * [`.removeMember(params, callback)`](#module_groupaccount..GroupAccounts.removeMember)
        * [`.activateMember(params, callback)`](#module_groupaccount..GroupAccounts.activateMember)
        * [`.deactivateMember(params, callback)`](#module_groupaccount..GroupAccounts.deactivateMember)
        * [`.probe(params, callback)`](#module_groupaccount..GroupAccounts.probe) ⇒ <code>groupAccountStatusObject</code>
    * [`~meteorLoginWithFooCB`](#module_groupaccount..meteorLoginWithFooCB) : <code>function</code>
    * [`~groupAccountsCB`](#module_groupaccount..groupAccountsCB) : <code>function</code>
    * [`~groupAccountStatusObject`](#module_groupaccount..groupAccountStatusObject) : <code>Object</code>

<a name="module_groupaccount..Meteor"></a>
### `groupaccount~Meteor` : <code>object</code>
**Kind**: inner namespace of <code>[groupaccount](#module_groupaccount)</code>  
<a name="module_groupaccount..Meteor.loginWithGroupAccount"></a>
#### `Meteor.loginWithGroupAccount(params, callback)`
Log in to existing group account. Fails if member activation is pending. Asynchronous.

**Kind**: static method of <code>[Meteor](#module_groupaccount..Meteor)</code>  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | invocation parameters |
| params.memberSelector | <code>string</code> |  |
| params.memberPassword | <code>string</code> |  |
| callback | <code>meteorLoginWithFooCB</code> | invoked upon completion |

<a name="module_groupaccount..GroupAccounts"></a>
### `groupaccount~GroupAccounts` : <code>object</code>
**Kind**: inner namespace of <code>[groupaccount](#module_groupaccount)</code>  

* [`~GroupAccounts`](#module_groupaccount..GroupAccounts) : <code>object</code>
    * [`.createAccount(params, callback)`](#module_groupaccount..GroupAccounts.createAccount)
    * [`.configure(params, callback)`](#module_groupaccount..GroupAccounts.configure)
    * [`.joinGroup(params, callback)`](#module_groupaccount..GroupAccounts.joinGroup)
    * [`.removeMember(params, callback)`](#module_groupaccount..GroupAccounts.removeMember)
    * [`.activateMember(params, callback)`](#module_groupaccount..GroupAccounts.activateMember)
    * [`.deactivateMember(params, callback)`](#module_groupaccount..GroupAccounts.deactivateMember)
    * [`.probe(params, callback)`](#module_groupaccount..GroupAccounts.probe) ⇒ <code>groupAccountStatusObject</code>

<a name="module_groupaccount..GroupAccounts.createAccount"></a>
#### `GroupAccounts.createAccount(params, callback)`
Creates a new group account via asynchronous server method invocation
    Callback throws an error, or returns a Meteor.users document

**Kind**: static method of <code>[GroupAccounts](#module_groupaccount..GroupAccounts)</code>  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | invocation parameters |
| params.accountSelector | <code>string</code> |  |
| params.accountAdminEmail | <code>email</code> |  |
| params.accountAdminPassword | <code>string</code> |  |
| callback | <code>groupAccountsCB</code> | invoked upon completion |

<a name="module_groupaccount..GroupAccounts.configure"></a>
#### `GroupAccounts.configure(params, callback)`
Reports, and optionally modifies, configuration paramters for currently-logged-in group account. Asynchronous.
   On success, callback returns the current (and possibly updated) configuration parameters.

**Kind**: static method of <code>[GroupAccounts](#module_groupaccount..GroupAccounts)</code>  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | parameters to configure |
| [params.pendingLimit] | <code>number</code> |  |
| callback | <code>groupAccountsCB</code> | invoked upon completion |

<a name="module_groupaccount..GroupAccounts.joinGroup"></a>
#### `GroupAccounts.joinGroup(params, callback)`
Adds a new member to existing group. Asynchronous.
   On success callback returns a Meteor.users document ID for this group account

**Kind**: static method of <code>[GroupAccounts](#module_groupaccount..GroupAccounts)</code>  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | parameters |
| params.accountSelector | <code>string</code> |  |
| params.memberSelector | <code>string</code> |  |
| params.memberPassword | <code>string</code> |  |
| callback | <code>groupAccountsCB</code> | invoked upon completion |

<a name="module_groupaccount..GroupAccounts.removeMember"></a>
#### `GroupAccounts.removeMember(params, callback)`
Removes an existing existing user from a group. Must be logged in to group account. Asynchronous.
   On success, callback returns a Meteor.users document for this group account

**Kind**: static method of <code>[GroupAccounts](#module_groupaccount..GroupAccounts)</code>  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | parameters |
| params.memberSelector | <code>string</code> |  |
| callback | <code>groupAccountsCB</code> | invoked upon completion |

<a name="module_groupaccount..GroupAccounts.activateMember"></a>
#### `GroupAccounts.activateMember(params, callback)`
Activates a new group member. Must be logged in to group account. Asynchronous.
   On success, callback returns the Meteor.Users doument ID for this group account.

**Kind**: static method of <code>[GroupAccounts](#module_groupaccount..GroupAccounts)</code>  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | invocation parameters |
| params.memberSelector | <code>string</code> |  |
| callback | <code>groupAccountsCB</code> | invoked upon completion |

<a name="module_groupaccount..GroupAccounts.deactivateMember"></a>
#### `GroupAccounts.deactivateMember(params, callback)`
Dectivates a group member. Must be logged in to group account. Asynchronous.
   On success, callback returns the Meteor.Users doument ID for this group account.

**Kind**: static method of <code>[GroupAccounts](#module_groupaccount..GroupAccounts)</code>  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | invocation parameters |
| params.memberSelector | <code>string</code> |  |
| callback | <code>groupAccountsCB</code> | invoked upon completion |

<a name="module_groupaccount..GroupAccounts.probe"></a>
#### `GroupAccounts.probe(params, callback)` ⇒ <code>groupAccountStatusObject</code>
Throttled probe of group account and, optionally, a group member. Asynchronous.
   On success, callback returns a status object for the group acccount.

**Kind**: static method of <code>[GroupAccounts](#module_groupaccount..GroupAccounts)</code>  
**Returns**: <code>groupAccountStatusObject</code> - Well, the callback returns one of these, if it wants.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | invocation parameters |
| params.accountSelector | <code>string</code> |  |
| [params.memberSelector] | <code>string</code> |  |
| callback | <code>groupAccountsCB</code> | invoked upon completion |

<a name="module_groupaccount..meteorLoginWithFooCB"></a>
### `groupaccount~meteorLoginWithFooCB` : <code>function</code>
Callback functions for the MeteorLoginWith* methods.
   Returns a Meteor.Error on early failure. Otherwise, returns an object with userId set to Meteor.users document ID for this group account, and perhaps error set to a Meteor.Error.

**Kind**: inner typedef of <code>[groupaccount](#module_groupaccount)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Meteor.Error</code> | undefined on successful invocation |

<a name="module_groupaccount..groupAccountsCB"></a>
### `groupaccount~groupAccountsCB` : <code>function</code>
Callback functions for the GroupAccounts.* methods all have the same signature and return semantics.

**Kind**: inner typedef of <code>[groupaccount](#module_groupaccount)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Meteor.Error</code> | undefined on successful invocation |
| result | <code>Object</code> | varies |

<a name="module_groupaccount..groupAccountStatusObject"></a>
### `groupaccount~groupAccountStatusObject` : <code>Object</code>
A group account probe status object.

**Kind**: inner typedef of <code>[groupaccount](#module_groupaccount)</code>  
**Properties**

| Name | Type |
| --- | --- |
| validNewGroup | <code>boolean</code> | 
| validOldGroup | <code>boolean</code> | 
| validNewMember | <code>boolean</code> | 
| validOldMember | <code>boolean</code> | 
| membershipOpen | <code>boolean</code> | 

* * *
&copy; 2015-2016 Verody, LLC.

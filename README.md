# groupaccount
Use `groupaccount` to provide qualified access to a single Meteor account from one or more sets of credentials. Some helpful definitions:

- **`accountSelector`** : a globally-unique identifier for the account. Associated with a single `Meteor.user`
- **`memberSelector`** : locally-unique identifier for someone allowed to read/write some or all data associated with the group
- **`accountAdmin`** : special, non-optional account member allowed to read/write all data associated with the group
##Usage

Add the package thus:

```
meteor add verody:groupaccount
```

Then, skillfully manipulate the following methods to achieve your ends:

```
GroupAccounts.createAccount(params, callback) // params include: accountSelector, accountAdminEmail, accountAdminPassword
```

```
GroupAccounts.addMember(params, callback) // params include: memberSelector, memberPassword. Must be logged in to do this.
```

```
GroupAccounts.removeMember(params, callback) // params include: memberSelector. Must be logged in to do this.
```

```
Meteor.loginWithGroupAccount(params, callback) // params include: accountSelector, memberSelector, memberPassword
```

##Examples

Callback functions for the `GroupAccounts.*` methods all have the same signature and semantics:

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

##Pipeline
- **member roles** to facilitate access control to portions of the `Meteor.user()` data.
- **token-based invitation/authorization** to control group membership

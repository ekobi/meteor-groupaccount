GroupAccounts = {};
var ValidEmail = Match.Where (function (x) {
    check (x, String);
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}$/i.test (x);
});

var ValidDigestPassword = Match.Where (function (x){
    check (x, { digest:String, algorithm:String});
    return 'sha-256' == x.algorithm;
});

if (Meteor.isClient) {
    Accounts.onLogin (function () {
        //console.log ('[GroupAccounts.onLogin]');
    });
    Accounts.onLoginFailure (function () {
        //console.log ('[GroupAccounts.onGroupAccountLoginFailure]');
    });
    GroupAccounts.createAccount = function (params, callback) {
        //console.log ('[GroupAccounts.createAccount]', params);
        if (callback) { check (callback, Function); }
        check (params, Match.ObjectIncluding ({ accountAdminPassword: String }));
        params.accountAdminPassword = {
            digest: SHA256 (params.accountAdminPassword),
            algorithm: 'sha-256' };
        Meteor.call ('groupaccount/createAccount', params, callback);
    };

    GroupAccounts.joinGroup = function (params, callback) {
        //console.log ('[GroupAccounts.joinGroup]', params);
        if (callback) { check (callback, Function); }
        check (params, Match.ObjectIncluding ({
            accountSelector: String,
            memberPassword: String 
	    }));
        params.memberPassword = {
            digest: SHA256 (params.memberPassword),
            algorithm: 'sha-256' };
        Meteor.call ('groupaccount/joinGroup', params, callback);
    };

    GroupAccounts.removeMember = function (params, callback) {
        //console.log ('[GroupAccounts.removeMember]', params);
        if (callback) { check (callback, Function); }
        check (params, Match.ObjectIncluding ({
            memberSelector: String }));
        Meteor.call ('groupaccount/removeMember', params, callback);
    };

    GroupAccounts.activateMember = function (params, callback) {
        if (callback) { check (callback, Function); }
        check (params, Match.ObjectIncluding ({
            memberSelector: String}));
        Meteor.call ('groupaccount/activateMember', params, callback);
    };

    Meteor.loginWithGroupAccount = function (params, callback) {
        //console.log ('[Meteor.loginWithGroupAccount]', params);
        check (params, Match.ObjectIncluding ({
            memberPassword:String,
            memberSelector:String
        }));
        params.memberPassword = {
            digest: SHA256 (params.memberPassword),
            algorithm: 'sha-256'
        };
        Accounts.callLoginMethod ({
            methodArguments: [{groupaccount:params}],
            userCallback: callback
        });

    };
}

if (Meteor.isServer) {

    var bcrypt = NpmModuleBcrypt;
    var bcryptHash = Meteor.wrapAsync(bcrypt.hash);
    var bcryptCompare = Meteor.wrapAsync(bcrypt.compare);

    Accounts.registerLoginHandler ("groupaccount", function (params){
        if (!params.groupaccount) {
            return undefined;
        }

        params = params.groupaccount;
        check (params, Match.ObjectIncluding ({
            accountSelector: String,
            memberSelector: String,
            memberPassword: ValidDigestPassword
        }));

        //console.log ('[GroupAccounts.loginHandler] accountSelector:', params.accountSelector);
        var group = Meteor.users.findOne ({username: params.accountSelector});
        if (!group) {
            throw new Meteor.Error(
                "Invalid Group Account",
                "Group Account not found for '" + params.accountSelector +"'");
        }

        //console.log ('[groupaccount/loginHandler] groupaccount:', group.services.groupaccount);

        var groupMember = group.services.groupaccount.members[params.memberSelector];
        if (!groupMember) {
            throw new Meteor.Error (
                "Invalid Member",
                "No member '"+params.memberSelector+"' in group '"+params.accountSelector+"'");
        }


        var result = { userId: group._id };
	    if (groupMember.pendingActivation) {
	        result.error = new Meteor.Error ("Group membership pending authorization.");
	    }
        if (!bcryptCompare ( params.memberPassword.digest, groupMember.bcrypt)) {
            result.error = new Meteor.Error ("Invalid Password");
        }
        //console.log ('[GroupAccounts.loginHandler] result:', result);
        return result;
    });

    Meteor.methods ({
        'groupaccount/createAccount': function (params){
            check (params, Match.ObjectIncluding({
                accountSelector:String,
                accountAdminEmail:ValidEmail,
                accountAdminPassword:ValidDigestPassword
            }));

            //console.log ('[groupaccount/createAccount] params:', params);
            if (Meteor.users.find ({username: params.accountSelector}).count()) {
                throw new Meteor.Error(
                    "Duplicate Group",
                    "Duplicate Group Account '" + params.accountSelector +"'");
            }

            var user = Accounts.insertUserDoc( { profile: {}}, {
                username: params.accountSelector,
                emails: [{address: params.accountAdminEmail, verified: false}],
                services: {
                    groupaccount : {
                        members: {
                            admin: {
                                bcrypt: bcryptHash(params.accountAdminPassword.digest,10)
                            }
                        }
                    }
                }
            });
            
            //console.log ('[groupaccount/createAccount] result:', user);
            return user;
        },

        'groupaccount/removeAccount': function (params){
            //console.log ('[groupaccount/removeAccount]', params);
            check (params, Match.ObjectIncluding({
                accountSelector:String
            }));

            var group = Meteor.users.findOne ({username: params.accountSelector});
            if (!group || !group.services ||!group.services.groupaccount) {
                throw new Meteor.Error(
                    "Invalid Group Account", "No group account '"+params.accountSelector+"'.");
            }

            throw new Meteor.Error ("Not allowed","Removing groups not allowed.");
            return {};
        },

        'groupaccount/joinGroup': function (params) {
            //console.log ('[groupaccount/joinGroup]', params);
            check (params, Match.ObjectIncluding({
		        accountSelector:String,
                memberSelector:String,
                memberPassword:ValidDigestPassword
            }));

            var group = Meteor.users.findOne ({username: params.accountSelector});
            if (!group || !group.services ||!group.services.groupaccount) {
		        throw new Meteor.Error(
                    "Invalid Group Account",
                    "Group Account not found for '" + params.accountSelector +"'");
            }
            //console.log ('[groupaccount/joinGroup] members:', group.services.groupaccount);

            if (group.services.groupaccount.members[params.memberSelector]) {
                throw new Meteor.Error (
                    "Duplicate Member",
                    "Member '"+params.memberSelector+"' already exists in this group '");
            }

            var query = {};
            query['services.groupaccount.members.'+params.memberSelector] = {
		        bcrypt: bcryptHash (params.memberPassword.digest,10),
		        pendingActivation: true
	        };
            var status = Meteor.users.update ( group._id, { $set: query } );
            if (status<1) {
                throw new Meteor.Error (
                    "Update Failed", "Unable to add member '"+params.memberSelector+"'."
                );
            }
            return group._id;
        },
        'groupaccount/activateMember': function (params) {
            //console.log ('[groupaccount/activateMember]', params);
            check (params, Match.ObjectIncluding({
                memberSelector:String
            }));

            if (!this.userId) {
                throw new Meteor.Error (
                    'Not logged in', 'Must be logged in to activate group members.');
            }
            
            var group = Meteor.users.findOne (this.userId);
            if (!group || !group.services ||!group.services.groupaccount) {
                throw new Meteor.Error(
                    "Invalid Group Account", "Not logged into a group account.");
            }

            if (!group.services.groupaccount.members[params.memberSelector]) {
                throw new Meteor.Error (
                    "No such member",
                    "Member '"+params.memberSelector+"' does not exist in this group '");
            }

            var query = {};
            query['services.groupaccount.members.'+params.memberSelector+'.pendingActivation'] = false;
            //console.log ('[groupaccount/activateMember] query:', query);
            var status = Meteor.users.update ( group._id, { $set: query } );
            if (status<1) {
                throw new Meteor.Error (
                    "Update Failed", "Unable to activate member '"+params.memberSelector+"'."
                );
            }
            return group._id;
        },
        'groupaccount/removeMember': function (params) {
            //console.log ('[groupaccount/removeMember]', params);
            check (params, Match.ObjectIncluding({
                memberSelector:String
            }));

            if (!this.userId) {
                throw new Meteor.Error (
                    'Not logged in', 'Must be logged in to remove group members.');
            }
            
            var group = Meteor.users.findOne (this.userId);
            if (!group || !group.services ||!group.services.groupaccount) {
                throw new Meteor.Error(
                    "Invalid Group Account", "Not logged into a group account.");
            }

            if (!group.services.groupaccount.members[params.memberSelector]) {
                throw new Meteor.Error (
                    "No such member",
                    "Member '"+params.memberSelector+"' does not exist in this group '");
            }

            var query = {};
            query['services.groupaccount.members'+params.memberSelector] = {};
            var status = Meteor.users.update ( group._id, { $unset: query } );
            //console.log ('[groupaccount/removeMember] status:', status);
            if (status<1) {
                throw new Meteor.Error (
                    "Update Failed", "Unable to remove member '"+params.memberSelector+"'."
                );
            }
            return group._id;
        }
    });
}



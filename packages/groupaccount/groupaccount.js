GroupAccounts = {};
var ValidEmail = Match.Where (function (x) {
    if ( _.isString(x) ) {
        if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}$/i.test (x)) {
            return true;
        }
    }
    if (! _.isString(x)) {
        x="<non-string-object>";
    }
    throw new Meteor.Error (
        "groupaccount-invalid-email",
        "Invalid email:'" + x  + "'"
    );
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

    GroupAccounts.configure = function ( params, callback) {
        Meteor.call ('groupaccount/configure', params, callback);
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

    //
    // Helper shim to override template renderFunctions
    // Inspired by template-replaces() from aldeed:template-extension package. Good stuff.
    Template.prototype._gaOverride = function (replacement){
        if (typeof replacement === 'string') {
            replacement = Template[replacement];
        }
        if (replacement && replacement instanceof Blaze.Template ) {
            this.renderFunction = replacement.renderFunction;
        }
    }

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
                "groupaccount-invalid-group-account",
                "Group Account not found for '" + params.accountSelector +"'");
        }

        //console.log ('[groupaccount/loginHandler] groupaccount:', group.services.groupaccount);

        var groupMember = group.services.groupaccount.members[params.memberSelector];
        if (!groupMember) {
            throw new Meteor.Error (
                "groupaccount-invalid-member",
                "No member '"+params.memberSelector+"' in group '"+params.accountSelector+"'");
        }


        var result = { userId: group._id };
	    if (groupMember.pendingActivation) {
	        result.error = new Meteor.Error (
                "groupaccount-pending-authorization",
                "Group membership pending authorization.");
	    }
        if (!bcryptCompare ( params.memberPassword.digest, groupMember.bcrypt)) {
            result.error = new Meteor.Error (
                "groupaccount-invalid-password", "Invalid Password");
        }
        //console.log ('[GroupAccounts.loginHandler] result:', result);
        return result;
    });

    Meteor.publish ('groupaccount/memberInfo', function () {
        if (!this.userId) {
            return [ ];
        }
        var group = Meteor.users.findOne (this.userId);
        if (!group || !group.services ||!group.services.groupaccount) {
            return [ ];
        }
        var _self = this;
        function infoRecord (services) {
            if (!services) {
                return {};
            }
            var ret = { pendingLimit: services.groupaccount.config.pendingLimit };
            ret.members = _.object (
                _.map (services.groupaccount.members, function (val, key) {
                    return [ key, _.omit (val, ['bcrypt']) ];
                })
            );
            return ret;
        }
        var handle = Meteor.users.find(this.userId).observeChanges({
            added: function (id, fields) {
                if (fields.services) {
                    _self.added ("groupaccount/memberInfo", _self.userId, infoRecord(fields.services));
                }
            },
            changed: function (id, fields) {
                if (fields.services) {
                    _self.changed ("groupaccount/memberInfo", _self.userId, infoRecord(fields.services));
                }
            }
        });

        _self.added ("groupaccount/memberInfo", _self.userId, infoRecord(group.services));

        _self.ready ();
        _self.onStop (function (){
            handle.stop();
        });
    });

    Meteor.methods ({
        'groupaccount/createAccount': function (params){
            check (params, Match.ObjectIncluding({
                accountSelector:String,
                accountAdminEmail:ValidEmail,
                accountAdminPassword:ValidDigestPassword
            }));

            if (Meteor.users.find ({username: params.accountSelector}).count()) {
                throw new Meteor.Error(
                    "groupaccount-duplicate-group",
                    "Duplicate Group Account '" + params.accountSelector +"'");
            }

            var user = Accounts.insertUserDoc( { profile: {}}, {
                username: params.accountSelector,
                emails: [{address: params.accountAdminEmail, verified: false}],
                services: {
                    groupaccount : {
                        config : { pendingLimit: 1 },
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

        'groupaccount/configure': function (params){
            try {
                check (params, { pendingLimit: Match.Optional(Number) });
            } catch (e) {
                //console.log ('[groupaccount/configure]', e);
                throw new Meteor.Error (
                    "groupaccount-invalid-configuration-parameter",
                    "Invalid configuration parameter: "+e.path);
            }
            if (!this.userId) {
                throw new Meteor.Error (
                    "groupaccount-not-logged-in",
                    'Must be logged in to activate group members.');
            }
            
            var group = Meteor.users.findOne (this.userId);
            if (!group || !group.services ||!group.services.groupaccount) {
                throw new Meteor.Error(
                    "groupaccount-invalid-group-account", "Not logged into a group account.");
            }

            var ret = _.extend( group.services.groupaccount.config, params);
            var query = {};
            query['services.groupaccount.config'] = ret;
            //console.log ('[groupaccount/configure] query:', query);
            var status = Meteor.users.update ( group._id, { $set: query } );
            if (status<1) {
                throw new Meteor.Error (
                    "groupaccount-update-failed", "Unable to configure"
                );
            }
            return ret;
        },
        'groupaccount/removeAccount': function (params){
            //console.log ('[groupaccount/removeAccount]', params);
            check (params, Match.ObjectIncluding({
                accountSelector:String
            }));

            var group = Meteor.users.findOne ({username: params.accountSelector});
            if (!group || !group.services ||!group.services.groupaccount) {
                throw new Meteor.Error(
                    "groupaccount-invalid-group-account", "No group account '"+params.accountSelector+"'.");
            }

            throw new Meteor.Error (
                "groupaccount-not-allowed", "Removing groups not allowed.");
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
                    "groupaccount-invalid-group-account",
                    "Group Account not found for '" + params.accountSelector +"'");
            }
            //console.log ('[groupaccount/joinGroup] services.groupaccount:', group.services.groupaccount);

            var pendingCount = _.reduce (group.services.groupaccount.members, function (memo, member) {
                return memo + member.pendingActivation?1:0;
            }, 0);

            if (pendingCount >= group.services.groupaccount.config.pendingLimit) {
                throw new Meteor.Error (
                    "groupaccount-group-closed",
                    "Group not considering new members."
                );
            }

            if (group.services.groupaccount.members[params.memberSelector]) {
                throw new Meteor.Error (
                    "groupaccount-duplicate-member",
                    "Duplicate member:"+params.memberSelector
                );
            }

            var query = {};
            query['services.groupaccount.members.'+params.memberSelector] = {
		        bcrypt: bcryptHash (params.memberPassword.digest,10),
		        pendingActivation: true
	        };
            var status = Meteor.users.update ( group._id, { $set: query } );
            if (status<1) {
                throw new Meteor.Error (
                    "groupaccount-update-failed",
                    "Unable to add member '"+params.memberSelector+"'."
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
                    "group-account-not-logged-in", "Must be logged in to activate group members.");
            }
            
            var group = Meteor.users.findOne (this.userId);
            if (!group || !group.services ||!group.services.groupaccount) {
                throw new Meteor.Error(
                    "groupaccount-invalid-group-account", "Not logged into a group account.");
            }

            if (!group.services.groupaccount.members[params.memberSelector]) {
                throw new Meteor.Error (
                    "groupaccount-invalid-member",
                    "Member '"+params.memberSelector+"' does not exist in this group '");
            }

            var query = {};
            query['services.groupaccount.members.'+params.memberSelector+'.pendingActivation'] = false;
            //console.log ('[groupaccount/activateMember] query:', query);
            var status = Meteor.users.update ( group._id, { $set: query } );
            if (status<1) {
                throw new Meteor.Error (
                    "groupaccount-update-failed",
                    "Unable to activate member '"+params.memberSelector+"'."
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
                    "group-account-not-logged-in", "Must be logged in to remove group members.");
            }
            
            var group = Meteor.users.findOne (this.userId);
            if (!group || !group.services ||!group.services.groupaccount) {
                throw new Meteor.Error(
                    "groupaccount-invalid-group-account", "Not logged into a group account.");
            }

            if (!group.services.groupaccount.members[params.memberSelector]) {
                throw new Meteor.Error (
                    "groupaccount-invalid-member",
                    "Member '"+params.memberSelector+"' does not exist in this group '");
            }

            var query = {};
            query['services.groupaccount.members.'+params.memberSelector] = {};
            var status = Meteor.users.update ( group._id, { $unset: query } );
            //console.log ('[groupaccount/removeMember] status:', status);
            if (status<1) {
                throw new Meteor.Error (
                    "groupaccount-update-failed",
                    "Unable to remove member '"+params.memberSelector+"'."
                );
            }
            return group._id;
        },
        'groupaccount/members': function () {
            if (!this.userId) {
                throw new Meteor.Error (
                    'not-logged-in', 'Must be logged in to list group members.');
            }

            var group = Meteor.users.findOne (this.userId);
            if (!group || !group.services ||!group.services.groupaccount) {
                throw new Meteor.Error(
                    "groupaccount-invalid-group-account",
                    "Not logged into a group account.");
            }

            //
            // strip out sensitive field(s) of member dictionary
            return _.object (
                _.map (group.services.account.members, function (val, key) {
                    return [ key, _.omit (val, ['bcrypt']) ];
                })
            );
        },
        'groupaccount/probe': function (params) {

            try {
                check ( params, {
                    accountSelector: Match.Optional(String),
                    memberSelector: Match.Optional(String),
                });
            } catch (e) {
                throw new Meteor.Error (
                    "groupaccount-invalid-probe-params", e.message );
            }

            var ret = {
                validNewGroup:false,
                validOldGroup:false,
                validNewMember:false,
                validOldMember:false,
                membershipOpen:false
            }

             if (!params.accountSelector) {
                return ret;
            }

            var group = Meteor.users.findOne ({username: params.accountSelector});
            if (!group) {
                //
                // unclaimed Meteor username.
                ret.validNewGroup=true;
                return ret;
            }

            if (!group.services || !group.services.groupaccount) {
                //
                // existing Meteor username, but not group account
                return ret;
            } else {
                ret.validOldGroup=true;
            }

            var pendingCount = _.reduce (group.services.groupaccount.members, function (memo, member) {
                return memo + member.pendingActivation?1:0;
            }, 0);

            if (pendingCount < group.services.groupaccount.config.pendingLimit) {
                ret.membershipOpen=true;
            }

            if (group.services.groupaccount.members[params.memberSelector]) {
                ret.validOldMember=true;
                return ret;
            }

            if (params.memberSelector) {
                //
                // I guess any non-zero-length member name is okay?
                ret.validNewMember=true;
            }
            return ret;
        }

    });

    DDPRateLimiter.addRule ({
        type:'method',
        name:'groupaccount/probe',
        connectionId : function () { return true; }
    },10,1000);

}



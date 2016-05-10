if (Meteor.isClient) {

    Template.groupSignIn.events ({
        'keyup .gsi-groupnameinput': function (event) {
            Template.instance().groupNameInput.set (event.currentTarget.value);
        },
        'keyup .gsi-emailinput': function (event) {
            Template.instance().emailInput.set (event.currentTarget.value);
        },
        'keyup .gsi-membernameinput': function (event) {
            Template.instance().memberNameInput.set (event.currentTarget.value);
        },
        'keyup .gsi-passwordinput': function (event) {
            Template.instance().passwordInput.set (event.currentTarget.value);
        },
        'keyup .gsi-passwordverifyinput': function (event) {
            event.preventDefault();
            Template.instance().passwordVerifyInput.set (event.currentTarget.value);
        },

        'click [data-action=creategroup]': function (event, template) {
            event.preventDefault();
            var params = {
                accountAdminPassword: template.passwordInput.get(),
                accountSelector: template.groupNameInput.get(),
                accountAdminEmail: template.emailInput.get()
            };
            GroupAccounts.createAccount (params, function (err,res) {
                if (err) {
                    template.signInResult.set(err.reason);
                } else {
                    template.signInResult.set('Success!');
                }
            });
        },
        'click [data-action=joingroup]': function (event, template) {
            event.preventDefault();
            var params = {
                accountSelector: template.groupNameInput.get(),
                memberSelector: template.memberNameInput.get(),
                memberPassword: template.passwordInput.get(),
            };
            GroupAccounts.joinGroup (params, function (err,res) {
                if (err && (err.error!='groupaccount-duplicate-member')) {
                    template.signInResult.set (err.reason);
                } else {
                    var loginParams = {
                        accountSelector: template.groupNameInput.get(),
                        memberSelector: template.memberNameInput.get(),
                        memberPassword: template.passwordInput.get(),
                    };
                    Meteor.loginWithGroupAccount (loginParams, function (err) {
                        if (err) {
                            template.signInResult.set(err.reason);
                        } else {
                            template.signInResult.set('Success!');
                        }
                    });
                }
            });
        },
        'click [data-action=logintogroup]': function (event, template) {
            event.preventDefault();
            var params = {
                accountSelector: template.groupNameInput.get(),
                memberSelector: template.memberNameInput.get(),
                memberPassword: template.passwordInput.get(),
            };
            Meteor.loginWithGroupAccount (params, function (err) {
                if (err) {
                    template.signInResult.set(err.reason);
                } else {
                    template.signInResult.set('Success!');
                }
            });
        },
        'click [data-action=cancelgroupsignin]': function (event, template) {
            event.currentTarget.form.reset();
            event.preventDefault();
        },
    });

    Template.groupSignIn.onCreated (function (){
        this.probeStatus=new ReactiveVar({},function (before,after) {
            return _.isEqual(before,after);
        });
        this.formInfo = new ReactiveVar({}, function (before,after) {
            return _.isEqual(before,after);
        });
        this.groupNameInput = new ReactiveVar ('');
        this.memberNameInput = new ReactiveVar ('');
        this.passwordInput = new ReactiveVar ('');
        this.passwordVerifyInput = new ReactiveVar ('');
        this.emailInput = new ReactiveVar ('');
        this.signInResult = new ReactiveVar ('');
        var _instance=this;
        this.saneProbe = _.debounce (function(params) {
            _instance.signInResult.set('');
            Meteor.call ('groupaccount/probe', params, function (err, result) {
                if (err) {
                    //console.log ('[statusTracker]err:', err);
                    return;
                }
                //console.log ('[statusTracker] result:', result);
                _instance.probeStatus.set (result);
                return;
            });
        }, 400, false);
    });

    Template.groupSignIn.onRendered (function () {
        var _instance=this;
        this.probeTracker = this.autorun (function (tc) {
            _instance.saneProbe( {
                accountSelector:_instance.groupNameInput.get(),
                memberSelector:_instance.memberNameInput.get(),
            });
        });
        this.statusTracker = this.autorun (function (tc) {
            _instance.formInfo.set ( (function () {
                var ti=Template.instance();
                var probeStatus=ti.probeStatus.get();
                var defaultInfo = {
                    passwordInputActive:false,
                    passwordVerifyInputActive:false,
                    memberInputActive:false,
                    emailInputActive:false,
                    submitButtonActive:false,
                    submitAction:'',
                    submitButtonText:'Sign In',
                    infoText:'Enter a Group Name to get started',
                    signInResult:ti.signInResult.get()
                };
                
                if (!probeStatus.validNewGroup && !probeStatus.validOldGroup ) {
                    return defaultInfo;
                }

                if ( probeStatus.validNewGroup ) {
                    return _.defaults ({
                        submitButtonActive:true,
                        submitButtonText:'Create Group',
                        submitAction:'creategroup',
                        emailInputActive:true,
                        passwordInputActive:true,
                        passwordVerifyInputActive:true,
                        infoText:'Create new group',
                    }, defaultInfo);
                }

                if (probeStatus.validOldGroup) {
                    if (probeStatus.validOldMember ) {
                        return _.defaults ({
                            submitButtonActive:true,
                            submitButtonText:'Login',
                            submitAction:'logintogroup',
                            memberInputActive:true,
                            passwordInputActive:true,
                            infoText:'Login to group as existing member',
                        }, defaultInfo);
                    } else if ( probeStatus.validNewMember ) {
                        if (probeStatus.membershipOpen) {
                            return _.defaults({
                                submitButtonActive:true,
                                submitButtonText:'Join Group',
                                submitAction:'joingroup',
                                memberInputActive:true,
                                passwordInputActive:true,
                                passwordVerifyInputActive:true,
                                infoText:'Join group as new member',
                            }, defaultInfo);
                        } else {
                            return _.defaults({
                                memberInputActive:true,
                                infoText:'Group closed to new members',
                            }, defaultInfo);
                        }
                    } else {
                        return _.defaults ({
                            memberInputActive:true,
                            infoText:'Enter member name',
                            passwordInputActive:true,
                            submitButtonActive:true,
                            submitButtonText:'Login',
                            submitAction:'logintogroup',
                        }, defaultInfo);
                    }
                }

                return defaultInfo;
            }) ());
        });
    });

    Template.groupSignIn.helpers ({
        '_gsiFormInfo': function (item) {
            var formInfo=Template.instance().formInfo.get();
            if (!item) {
                return formInfo;
            }
            return formInfo[item];
        },
    });
}


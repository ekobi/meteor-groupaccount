if (Meteor.isClient) {

    var memberInfoCollection = new Mongo.Collection('groupaccount/memberInfo');
    Template.groupAccountManager.onCreated (function () {
        this.memberInfo = new ReactiveVar ({},function (before,after) {
            return _.isEqual (before,after);
        });
        var _instance=this;
        this.memberInfoSubscription = Meteor.subscribe ('groupaccount/memberInfo', {
            onStop: function (err) {
                _instance.memberInfo.set ({});
                //console.log( '[groupAccountManager/memberInfoSubscription on ready]', err);
            }
        });
        this.memberInfoTracker = this.autorun (function (tc){
            //console.log( '[groupAccountManager/memberInfoTracker]', _instance.memberInfo.get());
            _instance.memberInfo.set (memberInfoCollection.findOne());
        });
    });

    Template.groupAccountManager.helpers ({
        '_gamPendingMembers': function () {
            var memberInfo = Template.instance().memberInfo.get();
            if (memberInfo && memberInfo.members) {
                return _.reduce (memberInfo.members, function (memo, v, k) {
                    if (v.pendingActivation) {
                        memo.push({memberId: k});
                    }
                    return memo;
                },[ ]);
            }
            return [ ];
        },
        '_gamPendingCount': function () {
            var memberInfo = Template.instance().memberInfo.get();
            if (memberInfo && memberInfo.members) {
                return _.reduce (memberInfo.members, function (memo, v, k) {
                    if (v.pendingActivation) {
                        memo.push({memberId: k});
                    }
                    return memo;
                },[ ]).length;
            }
            return [ ];
        },
        '_gamPendingLimit': function () {
            var memberInfo = Template.instance().memberInfo.get();
            if (memberInfo) {
                return memberInfo.pendingLimit;
            }
        },
    });

    Template.groupAccountManager.events ({
        'click [data-action=_gamApprove]': function (event,tpl) {
            GroupAccounts.activateMember ({memberSelector:this.memberId});
        },
        'click [data-action=_gamDeny]': function (event,tpl) {
            GroupAccounts.removeMember ({memberSelector:this.memberId});
        },
        'click [data-action=_gamIncreasePendingLimit]': function (event,tpl) {
            var memberInfo=tpl.memberInfo.get();
            if (memberInfo) {
                GroupAccounts.configure ({pendingLimit:memberInfo.pendingLimit+1});
            }
        },

        'click [data-action=_gamDecreasePendingLimit]': function (event,tpl) {
            var memberInfo=tpl.memberInfo.get();
            if (memberInfo && memberInfo.pendingLimit) {
                GroupAccounts.configure ({pendingLimit:memberInfo.pendingLimit-1});
            }
        },
    })


}

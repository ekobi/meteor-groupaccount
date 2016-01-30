if (Meteor.isClient) {

    Template.groupSignIn._gaOverride ('bs3GroupSignIn');
    Template.groupAccountManager._gaOverride ('bs3GroupAccountManager');

    Template.LoginMenu.events({
        'click [data-action=admin]'(e, tmpl) {
            e.preventDefault();
            var gaConfig = GroupAccounts.configure ({}, function(err,res){
                console.log ('[loginMenu/admin]',err,res);
            });
        },

        'click [data-action=logout]'(e, tmpl) {
            e.preventDefault();
            Meteor.logout();
        }
    });

}

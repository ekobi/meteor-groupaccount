const GroupAccountUtils = {

    validEmail: Match.Where (function (x) {
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
        )
    }),

    validDigestPassword: Match.Where (function (x){
        check (x, { digest:String, algorithm:String});
        return 'sha-256' == x.algorithm;
    }),

};
export { GroupAccountUtils };

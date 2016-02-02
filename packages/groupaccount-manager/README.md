# groupaccount-manager
Use `groupaccount-manager` to build a reactive management UI for [`groupaccount`](https://atmospherejs.com/verody/groupaccount).

## Usage

Add the package thus:

```
meteor add verody:groupaccount-manager
```

which will pull in the core groupaccount package as well. Then, reference the template in your HTML someplace:

```
{{>groupAccountManager}}
```

Note that you *must* do this, else the eyes of the template gods shall blaze upon thee with fearsome anger. Verily, unless you ...

## Override the default template

In your js source:

```
    Template.groupAccountManager._gaOverride ("myGroupAccountManager");
```

As you implement `myGroupAccountManager` in your HTML, these template helpers will be at your disposal:

- `_gamPendingMembers`
- `_gamPendingCount`
- `_gamPendingLimit`

and also to these event handlers:

- `click [data-action=_gamApprove]`
- `click [data-action=_gamDeny]`
- `click [data-action=_gamIncreasePendingLimit]`
- `click [data-action=_gamDecreasePendingLimit]`

* * *
&copy; 2015-2016 Verody, LLC.

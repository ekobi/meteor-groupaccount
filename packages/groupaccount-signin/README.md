# groupaccount-siginin
Use `groupaccount-manager` to build a reactive signin UI for [`groupaccount`](https://atmospherejs.com/verody/groupaccount).

## Usage

Add the package thus:

```
meteor add verody:groupaccount
```

which will pull in the core groupaccount package as well. Then, reference the template in your HTML someplace:

```
{{>groupSignIn}}
```

Note that you *must* do this, else the eyes of the template gods shall blaze upon thee with fearsome anger. Verily, unless you ...

## Override the default template

In your js source:

```
    Template.groupSignIn._gaOverride ("myGroupSignIn");
```

As you implement `myGroupSignIn` in your HTML, you can use reactive data from the template helper `_gsiFormInfo` to control form elements. Invoking with no parameters gets you all the available data. Or you can pluck specific elements like this:

```
    {{#if _gsiFormInfo "memberInputActive"}}
      <input type="text" class="gsi-membernameinput" placeholder="memberName">
    {{/if}}
```

Here's the full list:

| datum | indicium |
| ------------------- | --------- |
| passwordInputActive | `boolean` |
| passwordVerifyInputActive | `boolean` |
| memberInputActive | `boolean` |
| emailInputActive | `boolean` |
| submitButtonActive | `boolean` |
| submitAction | `string`, see click event handlers below |
| submitButtonText | `string`, *e.g.*, "Create Group", "Login", *etc*. |
| infoText | `string`, *e.g.*, "Enter a Group Name to get started". |
| signInResult | `string`, *e.g.*, "Success!" |


Your replacement template should emit the following events at some point:

- `click [data-action=cancelgroupsignin]`
- `click [data-action=creategroup]`
- `click [data-action=joingroup]`
- `click [data-action=logintogroup]`
- `click [data-action=cancelgroupsignin]`

* * *

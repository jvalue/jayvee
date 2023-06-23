<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0010: Constraints as Expressions

| | |
|---|---|
| Feature Tag | `constraints-as-expressions` | 
| Status | `ACCEPTED` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `georg-schwarz` | 
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC presents an alternative representation of value type constraints using expressions. It replaces the current ConstraintTypes (but not the existing ConstraintType mechanism itself that will us allow to add more complex domain-specific constraints that are not expressible by expressions).

## Motivation

Defining constraints is currently very bloated on the syntax level.

Example:
```
constraint HundredScale oftype RangeConstraint {
  lowerBound: 1;
  lowerBoundInclusive: false;
  upperBound: 100;      
}
```

## Explanation

Instead of using this block-like syntax, we can use expressions to define constraints.

The general syntax looks like this: 
```
constraint <name> on <primitive value type>: <expression with parameter value, evaluating to boolean>
```

### Examples

The following subsections will go over the existing constraints and showcase them in an example.

#### AllowlistConstraint

```
constraint TimeUnitString on text:
  value =="ms" or 
  value == "s" or 
  value == "min" or 
  value == "h" or 
  value == "d" or 
  value == "m" or 
  value == "y";
```

#### DenylistConstraint
```
constraint NoPrimaryColors on text:
  not (value == "red" or value == "blue" or value == "yellow");

// alternative
constraint NoPrimaryColors on text:
  value != "red" and 
  value != "blue" and 
  value != "yellow";
```

#### LengthConstraint
```
constraint JavaStringLength on text:
  value.length  >= 0 and value.length  <= maxLength;
```

#### RangeConstraint
```
constraint HundredScale on decimal:
  value > 1 and value <= 100; 
```

#### RegexConstraint
```
constraint IFOPT_Format on text:
  value matches /[a-z]{2}:\d+:\d+(:\d+)?(:\d+)?/;
```

### Hidden Enhancements
This RFC introduces / relies of some features that are not implemented yet:
* Expressions allow parameters (keyword `value`).
* The length of text parameters is accessible by `value.length`. Evaluates to an integer (zero or positive).
* The binary operator `matches` is introduced which evaluates to a boolean value. The usage is `<text> matches <regex>`.

### Usage in ValueTypes
In ValueTypes, these constraints can be added like before by name. Combining constraints on non-matching value types leads to a diagnostic error at compile-time (by the language server).
```
valuetype GasFillLevel oftype decimal {
    constraints: [ GasFillLevelRange ];
}
```

Alternatively, constraints can be defined inline with the caveat that they are not reusable elsewhere. Then the value, that the `value` keyword refers to, adheres to the type of the enclosing ValueType.
```
valuetype GasFillLevel oftype decimal {
    constraints: [ value >= 0 and value <= 100 ];
}
```


## Drawbacks
- Requires the features in the "Hidden Enhancements" section in order to match the current functionality.

## Alternatives

- Syntax to define parameter in constraint could be different, e.g., `constraint MyConstraint: (number) => <expression>`.
- Put the expression into a `{}`-wrapped scope for consistency (probably together with if/else statements, looks more like a method).



## Possible Future Changes/Enhancements
- Allow if/else statements in a more imperative way rather than packing everything into one expression.
- Allow renaming of `value` to a custom parameter name, e.g., `for text as x`.
- add `in` operator for collections for syntactic sugar.



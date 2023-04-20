<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0000: Constraints as Expressions

| | |
|---|---|
| Feature Tag | `constraints-as-expressions` | 
| Status | `DRAFT` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `georg-schwarz` | 
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC presents an alternative representation of value type constraints. It would displace the current solution.

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
constraint <name> on <primitive value type> = <expression with parameter value, evaluating to boolean>
```

### Examples

The following subsections will go over the existing constraints and showcase them in an example.

#### AllowlistConstraint

```
constraint TimeUnitString on text = 
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
constraint NoPrimaryColors on text = 
  not (value == "red" or value == "blue" or value == "yellow");

// alternative
constraint NoPrimaryColors on text = 
  value != "red" and 
  value != "blue" and 
  value != "yellow";
```

#### LengthConstraint
```
constraint JavaStringLength on text = value.length  >= 0 and value.length  <= maxLength;
```

#### RangeConstraint
```
constraint HundredScale on decimal = value > 1 and value <= 100; 
```

#### RegexConstraint
```
constraint IFOPT_Format on text = value matches /[a-z]{2}:\d+:\d+(:\d+)?(:\d+)?/;
```

### Hidden Enhancements
* Expressions allow parameters (keyword `on`).
* length of string parameters is accessible by `value.length`.
* Assignment operator `=` instead of `:` because the latter looks weird.
* String operator `matches` is introduced.

### Usage in ValueTypes
In ValueTypes, these constraints can be added like before by name. Combining constraints on non-matching value types leads to an error at runtime in the IDE hints.
```
valuetype GasFillLevel oftype number {
    constraints: [ GasFillLevelRange ];
}
```

Alternatively, constraints can be defined inline with the caveat that they are not reusable elsewhere. Value then uses the type of the ValueType.
```
valuetype GasFillLevel oftype number {
    constraints: [ value >= 0 and value <= 100 ];
}
```


## Drawbacks

- Inconsistency of constraint definition via `=` and property initialization via `:`.
- Future constraints have to be expressible by a boolean expression.
- Users now have to be able to write expressions instead of just supplying property values.

## Alternatives

- Syntax to define parameter in constraint could be different, e.g., `constraint MyConstraint = (number) => <expression>`.




## Possible Future Changes/Enhancements
- Allow renaming of `value` to a custom parameter name, e.g., `for text as x`.

<!-- TODO: (optional) Point out what changes or enhancements you see in the future to the proposed concepts. -->

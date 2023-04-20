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
constraint <name> on <primitive value type> = <expression with parameter x, evaluating to boolean>
```

### Examples

The following subsections will go over the existing constraints and showcase them in an example.

#### AllowlistConstraint

```
constraint TimeUnitString on x as text = 
  x =="ms" or 
  x == "s" or 
  x == "min" or 
  x == "h" or 
  x == "d" or 
  x == "m" or 
  x == "y";
```

#### DenylistConstraint
```
constraint NoPrimaryColors on x as text = 
  not (x == "red" or x == "blue" or x == "yellow");

// alternative
constraint NoPrimaryColors on x as text = 
  x != "red" and 
  x != "blue" and 
  x != "yellow";
```

#### LengthConstraint
```
constraint JavaStringLength on x as text = x.length >= 0 and x.length <= maxLength;
```

#### RangeConstraint
```
constraint HundredScale on x as decimal = x > 1 and x <= 100; 
```

#### RegexConstraint
```
constraint IFOPT_Format on x as text = x matches /[a-z]{2}:\d+:\d+(:\d+)?(:\d+)?/;
```

### Hidden Enhancements
* Expressions allow parameters (keyword `on`).
* length of string parameters is accessible by `<param name>.length`.
* Assignment operator `=` instead of `:` because the latter looks weird.
* String operator `matches` is introduced.

### Usage in ValueTypes
In ValueTypes, these constraints can be added like before by name. Combining constraints on non-matching value types leads to an error at runtime in the IDE hints.
```
valuetype GasFillLevel oftype number {
    constraints: [ GasFillLevelRange ];
}
```

Alternatively, constraints can be defined inline with the caveat that they are not reusable elsewhere:
```
valuetype GasFillLevel oftype number {
    constraints: [ constraint on x as decimal = x >= 0 and x <= 100 ];
}
```


## Drawbacks

- Inconsistency of constraint definition via `=` and property initialization via `:`.
- Future constraints have to be expressible by a boolean expression.
- Users now have to be able to write expressions instead of just supplying property values.

## Alternatives

- Syntax to define parameter in constraint could be different, e.g., `constraint MyConstraint = (x oftype number) => <expression>`.




## Possible Future Changes/Enhancements

<!-- TODO: (optional) Point out what changes or enhancements you see in the future to the proposed concepts. -->

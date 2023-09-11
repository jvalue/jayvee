---
sidebar_position: 2
---
# Primitive ValueTypes

`Primitive ValueTypes` are based on `Built-in ValueTypes` and use a collection of constraints to restrict the range of valid values.
Such constraints are implicitly connected via a logical `AND` relation.
Note that the `Constraints` need to be applicable to the base-type of the `ValueType` - indicated by the identifier after the keyword `oftype`:

```jayvee
valuetype GasFillLevel oftype integer {
    constraints: [ GasFillLevelRange ];
}
```


## Constraints

`Constraints` for `ValueTypes` declare the validity criteria that each concrete value is checked against.

### Syntax 1: Expression syntax

The syntax of expression-based `Constraints` uses an expression that evaluates to `true` or `false` for the given `value`. The type of the values the expression is working in is indicated ofter the keyword `on`:

```jayvee
constraint GasFillLevelRange on decimal:
    value >= 0 and value <= 100;
```

Refer to the [Expression documentation](../expressions.md) for further reading on expressions.


### Syntax 2: Block-like syntax

The syntax of `Constraints` is similar to the syntax of `Blocks`.
The availability of property keys and their respective `ValueTypes` is determined by the type of the `Constraint` - indicated by the identifier after the keyword `oftype`:

```jayvee
constraint GasFillLevelRange oftype RangeConstraint {
    lowerBound: 0;
    lowerBoundInclusive: true;
    upperBound: 100;
    upperBoundInclusive: true;
}
```

Note that the type of `Constraint` also determines its applicability to `ValueTypes`.
For instance, a `RangeConstraint` can only be applied to the numerical types `integer` and `decimal`.
---
sidebar_position: 2
---

# Primitive Value Types

_Primitive value types_ are based on _built-in value types_ and use a collection of _constraints_ to restrict the range of valid values.
Such _constraints_ are implicitly connected via a logical `AND` relation.
Note that the _constraints_ need to be applicable to the base-type of the _value type_ - indicated by the identifier after the keyword `oftype`:

```jayvee
valuetype GasFillLevel oftype integer {
    constraints: [ GasFillLevelRange ];
}
```

## Constraints

_Constraints_ for _value types_ declare the validity criteria that each concrete value is checked against.

### Syntax 1: Expression syntax

The syntax of expression-based _constraints_ uses an expression that evaluates to `true` or `false` for the given `value`. The type of the values the expression is working in is indicated ofter the keyword `on`:

```jayvee
constraint GasFillLevelRange on decimal:
    value >= 0 and value <= 100;
```

Refer to the [expression documentation](../expressions.md) for further reading on expressions.

### Syntax 2: Block-like syntax

The syntax of _constraints_ is similar to the syntax of _blocks_.
The availability of property keys and their respective _value types_ is determined by the type of the _constraint_ - indicated by the identifier after the keyword `oftype`:

```jayvee
constraint GasFillLevelRange oftype RangeConstraint {
    lowerBound: 0;
    lowerBoundInclusive: true;
    upperBound: 100;
    upperBoundInclusive: true;
}
```

Note that the type of _constraint_ also determines its applicability to _value types_.
For instance, a `RangeConstraint` can only be applied to the numerical types `integer` and `decimal`.

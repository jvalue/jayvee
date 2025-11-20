---
sidebar_position: 2
---

# Primitive Value Types

_Primitive value types_ are comprised of _properties_.

```jayvee
valuetype GasFillLevel {
    property level oftype integer;
}
```

A _Property_ is a named "part" with its own _value type_ (type cycles are
forbidden). _Value types_ with multiple _properties_ are allowed in the
language, but not yet supported by the interpreter.


## Constraints

_Constraints_ restrict the range of valid values.

```jayvee
valuetype GasFillLevel {
    property level oftype integer;
    constraint levelRange: level >= 0 and level <= 100;
}
```

A _value type_ can have zero or more _constraints_, which are implicitly
connected via a logical `AND` operation.

_Constraints_ use an _expression_ that evaluates to `true` or `false` and can
reference every _property_ of the _value type_.
In the above example, `level >= 0 and level <= 100` is evaluated for each value
of type `GasFillLevel`, `level` being replaced by that properties actual value.

Refer to the [expression documentation](../expressions.md) for further reading
on _expressions_.

### Outline definition.

_Constraints_ can also be defined outside of value types, allowing them to be
reused.

```jayvee
valuetype GasFillLevel {
    property level oftype integer;
    constraint levelRange: GasFillLevelRange on level;
}

constraint GasFillLevelRange on decimal:
    value >= 0 and value <= 100;
```

Since there are no _properties_ to reference from the _constraint_ definition,
the special `value` keyword represents the tested value.
Note that reusable _constraints_ need to be applied to exactly one _property_ of
the _value type_ - indicated by the identifier after the keyword `on`.


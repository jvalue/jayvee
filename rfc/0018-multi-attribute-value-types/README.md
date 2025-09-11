<!--
SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0018: Multi attribute value types

| | |
|---|---|
| Feature Tag | `multi-attribute value types` |
| Status | `DRAFT` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `tungstnballon` |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC allows value types to have multiple attributes.
Value types are used to define tables, replacing the existing syntax.

## Motivation

- Mentioned in the 'Future Changes/Enhancements' section of RFC0014.
- The jayvee interpreter still uses inheritance for value types, going against
  the jayvee design principle of composition over inheritance.

## Explanation

Value types can contain multiple attributes:
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;
}
```


### Usage

Value types are used to define tables, each attribute defining a column:
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;
}

block toTable oftype TableInterpreter {
  header: true;
  type: Coordinate2D;  // Naming suggestions instead of `type` are welcome
}
```
This replaces the current syntax:
```jayvee
block toTable oftype TableInterpreter {
  header: true;
  columns: [
    "x" oftype decimal,
    "y" oftype decimal,
  ];
}
```

Nested value types are allowed, but only if the inner value has exactly one
attribute. This is because, table cells cannot contain multiple values
(e.g. arrays, dictionaries).

Conceptually, a value type defines a table. The instance of that value type is a
row inside the table.

Allowed, because the `x` column can just store an integer:
```jayvee
valuetype Inner {
  property x oftype decimal;
}
valuetype Outer {
  property x oftype Inner;
  property y oftype decimal;
}
```
Not allowed, the `center` column can't be stored in a single column.
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;
}
valuetype Circlde {
  property center oftype Coordinate2D;
  property radius oftype decimal;
}
```

### Constraints

Inline constraints are able to reference all attributes:
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;

  constraint isOn45DegreeLine: x == y;
}
```

As a consequence, constraints can be defined on tables:
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;

  constraint isOn45DegreeLine: x == y;
}

block toTable oftype TableInterpreter {
  header: true;
  type: Coordinate2D;
}
```

Constraints defined on the table's type need to be checked after every
block modifying to the table.
This means `CellWriter`, `ColumnDeleter`, `TableInterpreter` and
`TableTransformer`.
`RowDeleter` is explicitly excluded here, because deleting a row cannot cause
remaining rows to become invalid.

Value types with multiple attributes follow the existing behavior that once a
value becomes invalid, it stays invalid.

For example, a value of type `Coordinate2D` could become invalid by halving the
`x` attribute. If the `y` attribute is also halved later, the value stays
invalid.

## Drawbacks

- Unintuitive restriction, that nested value types can only have one attribute.
- New syntax for defining tables may be a little more verbose.

## Alternatives

- Don't introduce multi attribute value types.

## Possible Future Changes/Enhancements

- Allow nested value types with multiple attributes. This probably requires
  dynamically creating a new table and putting foreign keys into the cell the
  value should be.

- Define to inline the valuetype into `TableInterpreter` to reduce verbosity.


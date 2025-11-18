<!--
SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0020: Value types as table schema

| | |
|---|---|
| Feature Tag | `table-schema-value-types` |
| Status | `ACCEPTED` |
| Responsible | `jrentlez` |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

Table schemata are now defined by value types. Sheet rows are parsed into table
rows, using transforms and the following new concepts:
  - New `SheetRow` value type with a new cell access syntax
  - New syntax to create a table row with an expression

## Motivation

- Currently, table schemata cannot be reused.
- The parsing of table rows is hard-coded.
- A specific table schema is always parsed the same.

## Explanation

### Example

```jayvee
valuetype Coordinate {
  x oftype integer;
  y oftype integer;
}

transform ParseCoordinate {
  from row oftype SheetRow;
  to coord oftype Coordinate;

  coord: {
    x: asInteger row["x"],
    y: asInteger row[2],
  };
}

block CoordinateTable oftype TableInterpreter {
  columns: Coordinate;
  rowParsedWith: ParseCoordinate;
}
```
The table output by `CoordinateTable` has two columns `x` and `y`, both
containing integer values.

### Table schemata defined by value types

From now on, value types are used to define a table schema, each property
defining a column.

### Parsing sheet rows into table rows

Parsing sheet rows is done explicitly by the user, inside a transform, with some
additional restrictions:
- only one input of type `SheetRow`.
- only one output with the same value type as in `<block>`'s `columns` property.
- must create a row with the row-creation syntax

#### New value type `SheetRow`

`SheetRow` is a new builtin value type only available in transforms that are
used to parse rows.
Values of type `SheetRow` can be indexed using brackets:
- `row[<integer>]`: evaluates to the cell with index `<integer>`
- `row[<string>]`: evaluates to the cell in column `<string>`

#### New row-creation syntax

The row-creation syntax follows this pattern (inspired by the JavaScript object
syntax):
```jayvee
{
  <value type property>: <expression>,
  // ...
}
```

### Constraint handling

Constraints are validated after every change to a value within the table. For
example:

```jayvee
valuetype Coordinate {
  x oftype integer;
  y oftype integer;

  constraint inFirstQuadrant: x >= 0 && y >= 0;
}

block CoordinateTable oftype TableInterpreter {
  columns: Coordinate;
  rowParsedWith: /* ... */;
}

transform invert {
  from n oftype integer;
  to inverted oftype integer;

  inverted: -n;
}

block Inverter oftype TableTransformer {
  inputColumns: ["x"];
  outputColumn: "x";
  uses: invert;
}
```

All values of column `x` would now be invalid because of the `inFirstQuadrant`
constraints.

If `Inverter` would create a new column `minus_x` instead of overwriting `x`,
then the values of `minus_x` would be valid.

### Nested value types

Using nested value types as table schema is allowed, but the resulting table
represents a flattened variant of the nested type. The following code:
```jayvee
valuetype Coordinate {
  x oftype integer;
  y oftype integer;
}
valuetype Circle {
  center oftype Coordinate;
  radius oftype integer;
}

transform ParseCircle {
  from row oftype SheetRow;
  to circle oftype Circle;

  circle: {
    center: { x: asInteger row["x"], y: asInteger row["y"]},
    radius: asInteger row["r"],
  };
}

block CircleTable oftype TableInterpreter {
  columns: Circle;
  rowParsedWith: ParseCircle;
}
```
results in a table with three columns, `x`, `y` and `radius` all of type
integer.

## Drawbacks

- Column names in tables must match the ID regex (e.g. no spaces).

## Alternatives

- There are different approaches to handling the nested value types:
  - Forbid using nested value types as table schema definitions
  - Save nested value types as dictionaries and serialize to JSON when writing
    to a database

## Possible Future Changes/Enhancements

- Use foreign keys to represent nested value types when writing to a database.
- Allow inlining the transform and value type definitions into the
TableInterpreter definition

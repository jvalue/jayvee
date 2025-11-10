<!--
SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0020: Value types as table schema <!-- TODO: adapt title -->

| | |
|---|---|
| Feature Tag | `table-schema-value-types` |
| Status | `DRAFT` |
| Responsible | `jrentlez` |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC changes the way sheets are parsed into tables, using a multi property
value type as the table schema definition.

## Motivation

- Allows users to define how a sheet is parsed into a table.
- Allows users to reuse table schema definitions.
- Remove special syntax regarding table definitions.

## Explanation

From now on, value types are used to define a table schema, each property
defining a column.
```jayvee
valuetype Coordinate {
  x oftype integer;
  y oftype integer;
}

block CoordinateTable oftype TableInterpreter {
  columns: Coordinate;
}
```
The table output by `CoordinateTable` has two columns `x` and `y`, both
containing integer values.

However, this creates problems if the sheet contains column names with spaces,
because such a column could not be represented as a value type property.
Thus, parsing the individual rows must be done explicitly by the user, inside a
transform (`<>` denotes a placeholder):

```jayvee
transform <transform> {
  from <row> oftype SheetRow;
  to <output> oftype <value type>;

  <output>: <row-creation expression>
}

block <block> oftype TableInterpreter {
  columns: <value type>;
  rowParsedWith: <transform>;
}
```

Because `<transform>` parses rows, it needs to conform to:
- only one input of type `SheetRow`.
- only one output with the same value type as in `<block>`'s `columns` property.
- must use a row-creation expression (see below)

### `SheetRow`

`SheetRow` is a new builtin value type only available in transforms that are
used to parse rows.
Values of type `SheetRow` can be indexed using brackets:
- `row[<integer>]`: evaluates to the cell with index `<integer>`
- `row[<string>]`: evaluates to the cell in column `<string>`

### Row-creation expression

A row-creation expression is similar to creating a JavaScript object:
```jayvee
{
  <value type property>: <expression>,
  // ...
}
```

### Example

Filling in the placeholders, we arrive at this concrete example:
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

### Constraints

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

## Possible Future Changes/Enhancements

- Use foreign keys to represent nested value types.
- Allow inlining the transform and value type definitions into the
TableInterpreter definition

<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0021: Sheet row access syntax

| | |
|---|---|
| Feature Tag | `sheet-row-access-syntax` |
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

This RFC removes an unnecessary definition of RFC 0020 regarding sheet row
access.

## Motivation

The `[]` syntax introduced in RFC 0020 is a completely new concept to new users.

## Explanation

Below is the current way of accessing the values of a sheet row, as specified
in RFC 0020:

```jayvee
transform Parser {
  from row oftype SheetRow;
  to coord oftype Coordinate;

  coord: {
    x: asInteger row["x"],
    y: asInteger row[2],
  }
}
```

### `.` replaces `[]`

`row[2]` is a familiar syntax for accessing a collection.
But at a deeper level, `[]` is a function that takes a collection and a
"location" and returns the collection's value at the "location".

Jayvee already has a concept for this, operators.
As a consequence, the `[]` syntax is replaced with the new binary operator `.`.

```jayvee
coord: {
  // Both notations (with and without spaces around `.`) are valid.
  x: asInteger (row . "x"),
  y: asInteger (row.2),
}
```

## Drawbacks

- Parentheses may be mistaken as a function call

## Alternatives

### `.`'s name

We could use a "speaking name" for `.` e.g. `cellInColumn`.

Pros:
  - If the name is well chosen, it's obvious what the operator does

Cons:
  - `cellInColumn` would be used very frequently, creating lots of visual
  "noise".
  - We are committing to the singular function of this operator and cannot
    expand it in the future

### `.` precedence

`.` has the highest precedence out of all binary and ternary operators, but a
lower precedence than unary operators (RFC 0009).
This results in braces being necessary (see example above).
We could make an exception and give `.` the highest precedence out of all
operators, which would enable the following:

```jayvee
someValue: {
  x: asInteger row . "x",
  y: asInteger row.2,
  z: asInteger row."x",
}
```

## Possible Future Changes/Enhancements

- We may be able to unify the `.` operator and the nested property access from
  RFC 0018.

<!--
SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0019: Ternary if

| | |
|---|---|
| Feature Tag | `ternary-if` |
| Status | `ACCEPTED` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `tungstnballon` |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC introduces a ternary if operator.

## Motivation

Some form of control flow is reqiured for error handling.

## Explanation

The syntax is as follows:
```jayvee
<then expression> if <condition> else <else expression>.
```

Since `if else` is an expression, it must always have a return value.
As a conseqence the else cannot be omitted and the `then expression` and the
`else expression` must have the same return type.

Example:
```jayvee
transform tr {
  from x oftype integer;
  to y oftype integer;

  y: x*2 if x != invalid else 0;
}
```

## Drawbacks

Nested if statements may be hard to read.

## Alternatives

### Alternative syntax

An alternative syntax could be:
```jayvee
if <condition> then <then expression> else <else expression>.
```
This syntax was rejected because it places less emphasis on the happy path.

### If is not an expression

The if statement could also be an entirely new concept seperate from an
expression.
This may allow users to ommit the else path if desired.
This approach was rejected because of its unnecessary complexity.

## Possible Future Changes/Enhancements

Extend the formatter to make if statements easily readable.

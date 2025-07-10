<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0017 : Error Values

| | |
|---|---|
| Feature Tag | `error-values` |
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

This RFC introduces the concept of invalid or missing values to the Jayvee interpreter.
Specifically, it defines two new special values that the Jayvee interpreter must be able to handle.

> [!NOTE]
> This RFC does not define any changes to the Jayvee grammar

## Motivation

Currently, there are two behaviors when an error occurs during pipeline
execution.
1. Terminate pipeline execution. This is the case for almost all errors that can
   happen outside table processing.
2. Discard. If an error occurs during table processing, the affected row is
   discarded and the user is notified via a log message.

These behaviors make the following impossible:
- Exporting tables that contain `NULL`
- Parsing CSV that contains missing cells
- Gracefully recovering from calculation errors occurring during transforms,
instead of discarding the entire row.

## Explanation

This RFC introduces two error values:
- `invalid`: Represents an invalid value.
- `missing`: Represents a missing value.

This distinction is made in order to allow both users and the interpreter more
fine grained control.

### invalid

This error's primary use case is to represent an erroneous calculation result
(e.g. Division by zero). It is intended to be used by operator evaluators.

Additionally, parsers can represent a failed value parse using `invalid` (e.g.
when attempting to parse a number but encountering a letter).

### missing

This error's use case is related to parsing text data and exporting SQL.
When a parser encounters a missing value (e.g. empty cell in CSV) it can now use
this error instead of crashing.
Similarly, SQL exporters can now replace any table cell containing `missing`
with `NULL`.

## Drawbacks

<!-- TODO: (optional) Discuss the drawbacks of the proposed design. -->

## Alternatives

- One single `ERROR`.
- More fine-grained errors. E.g `ParsingError`, `DivisionByZeroError`,
`EmptyCellError`

## Possible Future Changes/Enhancements

- Allow the user to define the interpreter's behavior in case of an error. This
  could mean replacing missing values, or crashing in case of an erroneous
calculation.

- Type unions to express a value can be `number | invalid | missing`

- Add context to errors (reason, location)

- Change the syntax to define which blocks can throw which errors. This may lead
  to more generic error handling (try/catch)


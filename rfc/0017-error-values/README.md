<!--
SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg

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

For now, these values are valid for all types (see
[Possible Future Changes/Enhancements](#possible-future-changesenhancements))

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

### Operator interactions

- Unary operators:
  - If the parameter is `invalid`, the result is `invalid`
  - If the parameter is `missing`, the result is `missing`
  - The following operations evaluate to `invalid`:
    - Square root of a negative number
    - Parsing failure for `asDecimal`, `asInteger` or `asBoolean`

- Binary operators:
  - The following operations always evaluate to `invalid`:
    - Division by zero
    - Root of a negative number
    - 0th root of a number
    - Number modulo zero
  - If at least one of the parameters is `invalid`, the result is `invalid`
  - If at least one of the parameters is `missing` and no parameter is `invalid`, the result is `missing`

- Ternary operators:
  - If at least one of the parameters is `invalid`, the result is `invalid`
  - If at least one of the parameters is `missing` and no parameter is `invalid`, the result is `missing`

### Example

data.csv:
```csv
column
3
```

pipeline.jv:
```
pipeline CarsPipeline {
  Extractor
    -> ToTextFile
    -> ToCSV
    -> ToTable
    -> ProduceInvalid
    -> ToSQLite;

  block Extractor oftype LocalFileExtractor {
    filePath: "data.csv";
  }
  block ToTextFile oftype TextFileInterpreter {}
  block ToCSV oftype CSVInterpreter {}
  block ToTable oftype TableInterpreter {
    header: true;
    columns: [
      "column" oftype integer,
    ];
  }
  /*
  | column |
  |--------|
  | 3      |
  */
  transform divideByZero {
    from num oftype integer;
    to out oftype decimal;

    // This calculation results in `invalid`
    out: num / 0;
  }
  block ProduceInvalid oftype TableTransformer {
    inputColumns: ["column"];
    outputColumn: "result";
    uses: divideByZero;
  }
  /*
  | column | result  |
  |--------|---------|
  | 3      | invalid |
  */
  // `invalid` is replaced with `NULL`
  block ToSQLite oftype SQLiteLoader {
    table: "Table";
    file: "data.sqlite";
  }
}
```

data.sqlite:
| column | result |
|--------|--------|
| 3      | NULL   |

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


<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0008: Builtin blocktypes

|             |                      |
|-------------|----------------------|
| Feature Tag | `builtin-blocktypes` |
| Status      | `ACCEPTED`              | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `@rhazn` (written by `@felix-oq`)         |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

Blocktypes that are built into the language are declared syntactically by denoting their inputs, outputs and properties.
This change does not alter any semantics, but it can serve as a foundation for composite block types in an upcoming RFC.

## Motivation

Currently, all blocktypes only exist implicitly in the language.
To make their definition more explicit, we should support the declaration of builtin blocktypes (i.e. blocktypes that are built into the language).
This allows users to look up inputs, outputs and properties without having to look at the documentation.

## Explanation

- `builtin` keyword to indicate that the blocktype is built into the language
  - Produces an error if the blocktype is unknown
- `input` / `output` keywords to type the input and output of the blocktype
  - If omitted, a blocktype has no input or output
- `property` keyword to define a property with a name and a type
  - Optionally, a default value can be assigned
- Adds new keywords for existing property types:
  - Valuetypes: `regex`, `cellrange` / `row` / `column` / `cell`, `valuetypeAssignment`
  - Typed collections: `collection<type>`
    - Nested collections are not supported for now
  - IO types: `file`, `fileSystem`, `textFile`, `sheet`, `table`

See the following section for concrete code examples.

### Syntax for current block types

<details>
<summary>Click to show</summary>

```jayvee
builtin blocktype HttpExtractor {
    property url oftype text;

    output oftype file;
}

builtin blocktype ArchiveInterpreter {
    input oftype file;

    property archiveType oftype text;

    output oftype fileSystem;
}

builtin blocktype FilePicker {
    input oftype fileSystem;

    property path oftype text;

    output oftype file;
}

builtin blocktype TextFileInterpreter {
    input oftype file;

    property encoding oftype text;
    property lineBreak oftype regex;

    output oftype textFile;
}

builtin blocktype TextLineDeleter {
    input oftype textFile;

    property lines oftype collection<integer>;

    output oftype textFile;
}

builtin blocktype TextRangeSelector {
    input oftype textFile;

    property lineFrom oftype integer;
    property lineTo oftype integer;

    output oftype textFile;
}

builtin blocktype CSVInterpreter {
    input oftype textFile;

    property delimiter oftype text: ",";
    property enclosing oftype text: "";
    property enclosingEscape oftype text: "";

    output oftype sheet;
}

builtin blocktype CellRangeSelector {
    input oftype sheet;

    property select oftype cellrange;

    output oftype sheet;
}

builtin blocktype CellWriter {
    input oftype sheet;

    property write oftype text;
    property at oftype cell;

    output oftype sheet;
}

builtin blocktype ColumnDeleter {
    input oftype sheet;

    property delete oftype collection<column>;

    output oftype sheet;
}

builtin blocktype RowDeleter {
    input oftype sheet;

    property delete oftype collection<row>;

    output oftype sheet;
}

builtin blocktype TableInterpreter {
    input oftype sheet;

    property header oftype boolean;
    property columns oftype collection<valuetypeAssignment>;

    output oftype table;
}

builtin blocktype SQLiteLoader {
    input oftype table;

    property table oftype text;
    property file oftype text;
}

builtin blocktype PostgresLoader {
    input oftype table;

    property host oftype text;
    property port oftype integer;
    property username oftype text;
    property password oftype text;
    property database oftype text;
    property table oftype text;
}
```
</details>

## Drawbacks

- Adds valuetype keywords for properties, but these types cannot be assigned to table columns (e.g. `regex`)

## Alternatives

- Not having declarations for builtin block types at all
- No mixing of property valuetypes and column valuetypes
- Using a less verbose syntax (e.g. omit `property` keyword or use a shorthand operator instead of `oftype` keyword)

## Possible Future Changes/Enhancements

- Usage of custom valuetypes for typing properties
  - Constraints could then be used to validate property values
  - Properties could be considered inputs of a block, so property values can be provided dynamically by pipes
- Include semantics for validating property values beyond valuetypes
- Introduce a standard for documenting blocktypes in the code
- Possibility to declare multiple named inputs and outputs for blocktypes
- Can serve as a foundation for composite blocktypes, e.g.:

```jayvee
composite blocktype HttpFileExtractor {
    property url oftype text;

    output oftype textFile;

    block Extractor oftype HttpExtractor {
        url: url;
    }

    Extractor -> Interpreter;

    block Interpreter oftype TextFileInterpreter {
    }

    Interpreter -> output;
}
```

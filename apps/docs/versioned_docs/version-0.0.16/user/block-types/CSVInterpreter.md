---
title: CSVInterpreter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `TextFile`

Output type: `Sheet`

## Description

Interprets an input file as a csv-file containing string-values delimited by `delimiter` and outputs a `Sheet`.

## Example 1

```jayvee
block AgencyCSVInterpreter oftype CSVInterpreter {  
    delimiter: ";"
  }
```

Interprets an input file as a csv-file containing string-values delimited by `;` and outputs `Sheet`.

## Properties

### `delimiter`

Type `text`

Default: `","`

#### Description

The delimiter for values in the CSV file.

#### Example 1

```jayvee
delimiter: ","
```

Commas are used to separate values in the CSV file.

### `enclosing`

Type `text`

Default: `""`

#### Description

The enclosing character that may be used for values in the CSV file.

### `enclosingEscape`

Type `text`

Default: `""`

#### Description

The character to escape enclosing characters in values.

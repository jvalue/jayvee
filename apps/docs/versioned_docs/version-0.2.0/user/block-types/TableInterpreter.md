---
title: TableInterpreter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Sheet`

Output type: `Table`

## Description

Interprets a `Sheet` as a `Table`. In case a header row is present in the sheet, its names can be matched with the provided column names. Otherwise, the provided column names are assigned in order.

## Example 1

```jayvee
 block CarsTableInterpreter oftype TableInterpreter {
   header: true;
   columns: [
     "name" oftype text,
     "mpg" oftype decimal,
     "cyl" oftype integer,
   ];
 }
```

Interprets a `Sheet` about cars with a topmost header row and interprets it as a `Table` by assigning a primitive valuetype to each column. The column names are matched to the header, so the order of the type assignments does not matter.

## Example 2

```jayvee
 block CarsTableInterpreter oftype TableInterpreter {
   header: false;
   columns: [
     "name" oftype text,
     "mpg" oftype decimal,
     "cyl" oftype integer,
   ];
 }
```

Interprets a `Sheet` about cars without a topmost header row and interprets it as a `Table` by sequentially assigning a name and a primitive valuetype to each column of the sheet. Note that the order of columns matters here. The first column (column `A`) will be named "name", the second column (column `B`) will be named "mpg" etc.

## Properties

### `header`

Type `boolean`

Default: `true`

#### Description

Whether the first row should be interpreted as header row.

### `columns`

Type `Collection<ValuetypeAssignment>`

#### Description

Collection of valuetype assignments. Uses column names (potentially matched with the header or by sequence depending on the `header` property) to assign a primitive valuetype to each column.

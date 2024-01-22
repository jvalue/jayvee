---
title: CellWriter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Sheet`

Output type: `Sheet`

## Description

Writes textual values into cells of a `Sheet`. The number of text values needs to match the number of cells to write into.

## Example 1

```jayvee
 block NameHeaderWriter oftype CellWriter {
   at: cell A1;
   write: ["Name"];
 }
```

Write the value "Name" into cell `A1`.

## Example 2

```jayvee
 block HeaderSequenceWriter oftype CellWriter {
   at: range A1:A2;
   write: ["Name", "Age"];
 }
```

Write the values "Name", "Age" into cells `A1` and `A2`.

## Properties

### `write`

Type `Collection<text>`

#### Description

The values to write.

### `at`

Type `CellRange`

#### Description

The cells to write into.

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

#### Example 1

```jayvee
write: ["Name"]
```

Write the value "Name" into the cell.

#### Example 2

```jayvee
write: ["Name1", "Name2"]
```

Write the value "Name1" into the first cell and "Name2 into the second.

### `at`

Type `CellRange`

#### Description

The cells to write into.

#### Validation

Needs to be a one-dimensional range of cells.

#### Example 1

```jayvee
at: cell A1
```

Write into cell A1.

#### Example 2

```jayvee
at: range A1:A3
```

Write into cells A1, A2 and A3.

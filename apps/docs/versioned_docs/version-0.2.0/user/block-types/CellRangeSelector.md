---
title: CellRangeSelector
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Sheet`

Output type: `Sheet`

## Description

Selects a subset of a `Sheet` to produce a new `Sheet`.

## Example 1

```jayvee
 block CarsCoreDataSelector oftype CellRangeSelector {
   select: range A1:E*;
 }
```

Selects the cells in the given range and produces a new `Sheet` containing only the selected cells.

## Properties

### `select`

Type `CellRange`

#### Description

The cell range to select.

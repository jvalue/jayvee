---
title: CellRangeSelector
---

<!-- Do NOT change this document as it is auto-generated from the language server -->


# BlockType `CellRangeSelector`


## Description


Selects a subset of a `Sheet` to produce a new `Sheet`.


## Attributes


- `select`: The cell range to select.


## Example 1


```
block CarsCoreDataSelector oftype CellRangeSelector {
  select: A1:E*;
}
```
Selects the cells in the given range and produces a new `Sheet` containing only the selected cells.


## Attribute Details


### Attribute `select`


#### Description


The cell range to select.


#### Example 1


```
select: A1:E*
```
Select cells from `A1` to the last cell of column `E`.


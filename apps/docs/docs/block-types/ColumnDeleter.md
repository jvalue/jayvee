---
title: ColumnDeleter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->


# BlockType `ColumnDeleter`


## Description


Deletes columns from a `Sheet`. Column IDs of subsequent columns will be shifted accordingly, so there will be no gaps.


## Attributes


- `delete`: The columns to delete.


## Example 1


```
block MpgColumnDeleter oftype ColumnDeleter {
  delete: [column B];
}
```
Deletes column B (i.e. the second column).


## Attribute Details


### Attribute `delete`


#### Description


The columns to delete.


#### Validation


You need to specify at least one column.


#### Example 1


```
delete: [column B]
```
Delete column B.


#### Example 2


```
delete: [column B, column C]
```
Delete column B and column C.


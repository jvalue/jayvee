---
title: RowDeleter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->


# BlockType `RowDeleter`


## Description


Deletes one or more rows from a `Sheet`. Row IDs of subsequent rows will be shifted accordingly, so there will be no gaps.


## Attributes


- `delete`: The rows to delete.


## Example 1


```
block SecondRowDeleter oftype ColumnDeleter {
  delete: [row 2];
}
```
Deletes row 2 (i.e. the second row).


## Attribute Details


### Attribute `delete`


#### Description


The rows to delete.


#### Validation


You need to specify at least one row.


#### Example 1


```
delete: [row 2]
```
Delete row 2.


#### Example 2


```
delete: [row 2, row 3]
```
Delete row 2 and row 3.


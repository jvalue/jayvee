---
title: CellWriter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->


# BlockType `CellWriter`


## Description


Writes a textual value into a cell of a `Sheet`.


## Attributes


- `write`: The value to write.
- `at`: The cell to write into.


## Example 1


```
block NameHeaderWriter oftype CellWriter {
  at: cell A1;
  write: "Name";
}
```
Write the value "Name" into cell `A1`.


## Attribute Details


### Attribute `write`


#### Description


The value to write.


#### Example 1


```
write: "Name"
```
Write the value "Name" into the cell


### Attribute `at`


#### Description


The cell to write into.


#### Validation


You need to specify exactly one cell.


#### Example 1


```
at: A1
```
Write into cell A1


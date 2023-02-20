---
title: SQLiteLoader
---

<!-- Do NOT change this document as it is auto-generated from the language server -->


# BlockType `SQLiteLoader`


## Description


Loads a `Table` into a SQLite database sink.


## Attributes


- `table`: The name of the table to write into.
- `file`: The path to the SQLite file that will be created. Usual file extensions are `.sqlite` and `.db`.


## Example 1


```
block CarsLoader oftype SQLiteLoader {
  table: "Cars";
  file: "./cars.db";
}
```
A local SQLite file is created at the given path and filled with table data about cars.


## Attribute Details


### Attribute `table`


#### Description


The name of the table to write into.


### Attribute `file`


#### Description


The path to the SQLite file that will be created. Usual file extensions are `.sqlite` and `.db`.


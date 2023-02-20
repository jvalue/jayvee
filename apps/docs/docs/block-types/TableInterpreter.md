---
title: TableInterpreter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->


# BlockType `TableInterpreter`


## Description


Interprets a `Sheet` as a `Table`. In case a header row is present in the sheet, its names can be matched with the provided column names. Otherwise, the provided column names are assigned in order.


## Attributes


- `header`: Whether the first row should be interpreted as header row.
- `columns`: Collection of data type assignments. Uses column names (potentially matched with the header or by sequence depending on the `header` attribute) to assign a data type to each column.


## Example 1


```
block CarsTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "name" typed text,
    "mpg" typed decimal,
    "cyl" typed integer,
  ];
}
```
Interprets a `Sheet` about cars with a topmost header row and interprets it as a `Table` by assigning a data type to each column. The column names are matched to the header, so the order of the column data type assignments does not matter.


## Example 2


```
block CarsTableInterpreter oftype TableInterpreter {
  header: false;
  columns: [
    "name" typed text,
    "mpg" typed decimal,
    "cyl" typed integer,
  ];
}
```
Interprets a `Sheet` about cars without a topmost header row and interprets it as a `Table` by sequentially assigning a name and a data type to each column of the sheet. Note that the order of columns matters here. The first column (column `A`) will be named "name", the second column (column `B`) will be named "mpg" etc.


## Attribute Details


### Attribute `header`


#### Description


Whether the first row should be interpreted as header row.


#### Example 1


```
header: true
```
The first row is interpreted as table header. The values in the header row will become the column names of the table.


#### Example 2


```
header: false
```
The first row is NOT interpreted as table header and columns of the sheet are directly mapped to table columns. The column names are taken form the provided names in the `columns` attribute.


### Attribute `columns`


#### Description


Collection of data type assignments. Uses column names (potentially matched with the header or by sequence depending on the `header` attribute) to assign a data type to each column.


#### Validation


Needs to be a collection of data type assignments. Each column needs to have a unique name.


#### Example 1


```
columns: [ "name" typed text ]
```
There is one column with the header "name". All values in this colum are typed as text.


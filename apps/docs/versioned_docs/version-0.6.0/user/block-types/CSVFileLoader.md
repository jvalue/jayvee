---
title: CSVFileLoader
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Table`

Output type: `None`

## Description

Loads a `Table` into a CSV file sink.

## Example 1

```jayvee
 block CarsLoader oftype CSVFileLoader {
   file: "./cars.csv";
 }
```

A SQLite file `cars.csv` is created in the working directory.

## Properties

### `file`

Type `text`

#### Description

The path to a CSV file that will be created if it does not exist.
 IF THE FILE ALREADY EXISTS, IT WILL BE OVERWRITTEN
 The usual file extension is `.csv`.

### `delimiter`

Type `text`

Default: `","`

### `enclosing`

Type `text`

Default: `""`

#### Description

The enclosing character that may be used for values in the CSV file.

### `enclosingEscape`

Type `text`

Default: `""`

#### Description

The character to escape enclosing characters in values.

---
title: SQLiteLoader
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Table`

Output type: `None`

## Description

Loads a `Table` into a SQLite database sink.

## Example 1

```jayvee
 block CarsLoader oftype SQLiteLoader {
   table: "cars";
   file: "./cars.db";
 }
```

A SQLite file `cars.db` is created in the working directory. Incoming data is written to the table `cars`.

## Properties

### `table`

Type `text`

#### Description

The name of the table to write into.

### `file`

Type `text`

#### Description

The path to a SQLite file that will be created if it does not exist. Usual file extensions are `.sqlite` and `.db`.

### `dropTable`

Type `boolean`

Default: `true`

#### Description

Indicates, whether to drop the table before loading data into it. If `false`, data is appended to the table instead of dropping it.

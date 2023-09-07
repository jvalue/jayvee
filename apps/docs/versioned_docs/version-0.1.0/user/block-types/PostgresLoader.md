---
title: PostgresLoader
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Table`

Output type: `None`

## Description

Loads a `Table` into a PostgreSQL database sink.

## Example 1

```jayvee
block CarsLoader oftype PostgresLoader {
  host: "localhost";
  port: 5432;
  username: "postgres";
  password: "postgres";
  database: "CarsDB";
  table: "Cars";
}
```

A local Postgres instance is filled with table data about cars.

## Properties

### `host`

Type `text`

#### Description

The hostname or IP address of the Postgres database.

### `port`

Type `integer`

#### Description

The port of the Postgres database.

### `username`

Type `text`

#### Description

The username to login to the Postgres database.

### `password`

Type `text`

#### Description

The password to login to the Postgres database.

### `database`

Type `text`

#### Description

The database to use.

### `table`

Type `text`

#### Description

The name of the table to write into.

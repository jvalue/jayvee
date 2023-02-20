---
title: PostgresLoader
---

<!-- Do NOT change this document as it is auto-generated from the language server -->


# BlockType `PostgresLoader`


## Description


Loads a `Table` into a PostgreSQL database sink.


## Attributes


- `host`: The hostname or IP address of the Postgres database.
- `port`: The port of the Postgres database.
- `username`: The username to login to the Postgres database.
- `password`: The password to login to the Postgres database.
- `database`: The database to use.
- `table`: The name of the table to write into.


## Example 1


```
block CarsLoader oftype PostgresLoader {
  host: "localhost";
  port: "5432";
  username: "postgres";
  password: "postgres";
  database: "CarsDB";
  table: "Cars";
}
```
A local Postgres instance is filled with table data about cars.


## Attribute Details


### Attribute `host`


#### Description


The hostname or IP address of the Postgres database.


### Attribute `port`


#### Description


The port of the Postgres database.


### Attribute `username`


#### Description


The username to login to the Postgres database.


### Attribute `password`


#### Description


The password to login to the Postgres database.


### Attribute `database`


#### Description


The database to use.


### Attribute `table`


#### Description


The name of the table to write into.


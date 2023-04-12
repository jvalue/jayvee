---
sidebar_position: 4
---

# Runtime Parameters

Property values in Jayvee can be assigned to `values` or left open for later configuration via `runtime parameters`.

## Syntax

Runtime parameters are indicated by the `requires` keyword, followed by the identifier of the parameter. Example

```javascript
block CarsLoader oftype SQLiteLoader {
  table: "Cars";
  file: requires CARS_SQLITE_FILE;
}
```

## CLI

The interpreter CLI has to define all existing runtime parameters for execution. 
Use the CLI flag `-e` to to define them as key-value pairs of identifier and value.

```console
jv -e <param>=<value> -e <param>=<value> ... <file>
```


## JV Hub

In the [JV Hub](https://JV.com), this mechanism is used to leave the configuration to the JV infrastructure for using hosted the data sinks.


### Data Sinks / Loader Blocks

| Identifier | Description |
| --- | --- |
| `HUB_DB_HOST` | Database IP address populated by the JV infrastructure |
| `HUB_DB_PORT` | Database port address populated by the JV infrastructure |
| `HUB_DB_USERNAME` | Username for the database populated by the JV infrastructure |
| `HUB_DB_PASSWORD` | Password for the database populated by the JV infrastructure |
| `HUB_DB_DATABASE` | Database name populated by the JV infrastructure |
| `HUB_DB_TABLE` | Table name populated by the JV infrastructure |
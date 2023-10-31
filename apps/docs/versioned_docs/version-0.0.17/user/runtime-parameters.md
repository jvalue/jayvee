---
sidebar_position: 8
---

# Runtime Parameters

Property values in Jayvee can be assigned to `values` or left open for later configuration via `runtime parameters`.

## Syntax

Runtime parameters are indicated by the `requires` keyword, followed by the identifier of the parameter. Example

```jayvee
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

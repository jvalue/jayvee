---
title: Built-in Value Types
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

# Description

For an introduction to _value types_, see the [core concepts](../core-concepts).
_Built-in value types_ come with the basic version of Jayvee.
They are the basis for more restricted [_primitive value types_](./primitive-value-types)
that fullfil [_constraints_](./primitive-value-types#constraints).

# Available built-in value types

## boolean

### Description

A boolean value.
Examples: true, false

### Example 1

```jayvee
block ExampleTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "columnName" oftype boolean
  ];
}
```

A block of type `TableInterpreter` that
              interprets data in the column `columnName` as `boolean`.

## decimal

### Description

A decimal value.
Example: 3.14

### Example 1

```jayvee
block ExampleTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "columnName" oftype decimal
  ];
}
```

A block of type `TableInterpreter` that
              interprets data in the column `columnName` as `decimal`.

## integer

### Description

An integer value.
Example: 3

### Example 1

```jayvee
block ExampleTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "columnName" oftype integer
  ];
}
```

A block of type `TableInterpreter` that
              interprets data in the column `columnName` as `integer`.

## text

### Description

A text value. 
Example: "Hello World"

### Example 1

```jayvee
block ExampleTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "columnName" oftype text
  ];
}
```

A block of type `TableInterpreter` that
              interprets data in the column `columnName` as `text`.

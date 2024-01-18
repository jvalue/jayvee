---
title: Built-in Valuetypes
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

# Description

For an introduction to valuetypes, see the [Core Concepts](../core-concepts).
Built-in valuetypes come with the basic version of Jayvee.
They are the basis for more restricted [Primitive Valuetypes](./primitive-valuetypes)
that fullfil [Constraints](./primitive-valuetypes#constraints).

# Available built-in valuetypes

## Boolean

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

## Decimal

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

## Integer

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

## Text

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

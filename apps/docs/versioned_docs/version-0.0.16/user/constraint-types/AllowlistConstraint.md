---
title: AllowlistConstraint
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Compatible ValueType: text

## Description

Limits the values to a defined a set of allowed values. Only values in the list are valid.

## Example 1

```jayvee
constraint TimeUnitString oftype AllowlistConstraint {
  allowlist: ["ms", "s", "min", "h", "d", "m", "y"];
}
```

Only allows the common abbreviations for millisecond, second, minute, etc..

## Properties

### `allowlist`

Type `collection<text>`

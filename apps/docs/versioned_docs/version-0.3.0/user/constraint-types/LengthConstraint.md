---
title: LengthConstraint
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Compatible ValueType: text

## Description

Limits the length of a string with an upper and/or lower boundary.
 Only values with a length within the given range are valid.

## Example 1

```jayvee
 constraint ShortAnswerConstraint oftype LengthConstraint {
   minLength: 0;
   maxLength: 20;
 }
```

A text constraint with 0 to 20 characters.

## Properties

### `minLength`

Type `integer`

Default: `0`

### `maxLength`

Type `integer`

Default: `9007199254740991`

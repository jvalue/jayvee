---
title: DenylistConstraint
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Compatible value type: text

## Description

Defines a set of forbidden values. All values in the list are considered invalid.

## Example 1

```jayvee
 publish constraint NoPrimaryColors oftype DenylistConstraint {
   denylist: ["red", "blue", "yellow"];
 }
```

Denies all primary colors.

## Properties

### `denylist`

Type `Collection<text>`

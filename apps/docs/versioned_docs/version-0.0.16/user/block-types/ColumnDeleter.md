---
title: ColumnDeleter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Sheet`

Output type: `Sheet`

## Description

Deletes columns from a `Sheet`. Column IDs of subsequent columns will be shifted accordingly, so there will be no gaps.

## Example 1

```jayvee
block MpgColumnDeleter oftype ColumnDeleter {
  delete: [column B];
}
```

Deletes column B (i.e. the second column).

## Properties

### `delete`

Type `collection<cellRange>`

#### Description

The columns to delete.

#### Validation

You need to specify at least one column.

#### Example 1

```jayvee
delete: [column B]
```

Delete column B.

#### Example 2

```jayvee
delete: [column B, column C]
```

Delete column B and column C.

---
title: RowDeleter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Sheet`

Output type: `Sheet`

## Description

Deletes one or more rows from a `Sheet`. Row IDs of subsequent rows will be shifted accordingly, so there will be no gaps.

## Example 1

```jayvee
block SecondRowDeleter oftype RowDeleter {
  delete: [row 2];
}
```

Deletes row 2 (i.e. the second row).

## Properties

### `delete`

Type `Collection<CellRange>`

#### Description

The rows to delete.

#### Validation

You need to specify at least one row.

#### Example 1

```jayvee
delete: [row 2]
```

Delete row 2.

#### Example 2

```jayvee
delete: [row 2, row 3]
```

Delete row 2 and row 3.

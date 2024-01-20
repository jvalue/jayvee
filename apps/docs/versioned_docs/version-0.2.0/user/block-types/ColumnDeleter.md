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

Type `Collection<CellRange>`

#### Description

The columns to delete. Has to be a full column.

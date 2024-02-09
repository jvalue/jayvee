---
title: SheetPicker
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Workbook`

Output type: `Sheet`

## Description

Selects one `Sheet` from a `Workbook` based on its `sheetName`. If no sheet matches the name, no output is created and the execution of the pipeline is aborted.

## Example 1

```jayvee
 block AgencySheetPicker oftype SheetPicker {
   sheetName: "AgencyNames";
 }
```

Tries to pick the sheet `AgencyNames` from the provided `Workbook`. If `AgencyNames` exists it is passed on as `Sheet`, if it does not exist the execution of the pipeline is aborted.

## Properties

### `sheetName`

Type `text`

#### Description

The name of the sheet to select.

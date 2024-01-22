---
title: FilePicker
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `FileSystem`

Output type: `File`

## Description

Selects one `File` from a `FileSystem` based on its relative path to the root of the `FileSystem`. If no file matches the relative path, no output is created and the execution of the pipeline is aborted.

## Example 1

```jayvee
 block AgencyFilePicker oftype FilePicker {
   path: "./agency.txt";
 }
```

Tries to pick the file `agency.txt` from the root of the provided `FileSystem`. If `agency.txt` exists it is passed on as `File`, if it does not exist the execution of the pipeline is aborted.

## Properties

### `path`

Type `text`

#### Description

The path of the file to select, relative to the root of the provided `FileSystem`.

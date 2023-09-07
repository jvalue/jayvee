---
title: ArchiveInterpreter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `File`

Output type: `FileSystem`

## Description

Interprets a `File` as an archive file and converts it to a `FileSystem`. The archive file root is considered the root of the `FileSystem`.

## Example 1

```jayvee
block ZipArchiveInterpreter oftype ArchiveInterpreter {
  archiveType: "zip";
}
```

Interprets a `File` as a ZIP-archive and creates a `FileSystem` of its extracted contents.

## Properties

### `archiveType`

Type `text`

#### Description

The archive type to be interpreted, e.g., "zip" or "gz".

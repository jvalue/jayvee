---
title: LocalFileExtractor
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `None`

Output type: `File`

## Description

Extracts a `File` from the local file system.

## Example 1

```jayvee
 block CarsFileExtractor oftype LocalFileExtractor {
   filePath: "cars.csv";
 }
```

Extracts a file from the given path on the local file system.

## Properties

### `filePath`

Type `text`

#### Description

The path to the file in the local file system to extract. Path can not traverse up the directory tree.

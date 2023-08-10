---
title: HttpExtractor
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `None`

Output type: `File`

## Description

Extracts a `File` from the web.

## Example 1

```jayvee
block CarsFileExtractor oftype HttpExtractor {
  url: "tinyurl.com/4ub9spwz";
}
```

Fetches a file from the given URL.

## Properties

### `url`

Type `text`

#### Description

The URL to the file in the web to extract.

#### Example 1

```jayvee
url: "tinyurl.com/4ub9spwz"
```

Specifies the URL to fetch the data from.

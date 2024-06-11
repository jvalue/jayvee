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

### `retries`

Type `integer`

Default: `0`

#### Description

Configures how many retries should be executed after a failure fetching the data.

### `retryBackoffMilliseconds`

Type `integer`

Default: `1000`

#### Description

Configures the wait time in milliseconds before executing a retry.

### `retryBackoffStrategy`

Type `text`

Default: `"exponential"`

#### Description

Configures the wait strategy before executing a retry. Can have values "exponential" or "linear".

### `followRedirects`

Type `boolean`

Default: `true`

#### Description

Indicates, whether to follow redirects on get requests. If `false`, redirects are not followed. Default `true`

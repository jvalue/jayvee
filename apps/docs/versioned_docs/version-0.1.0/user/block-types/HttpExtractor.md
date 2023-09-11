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

### `retries`

Type `integer`

Default: `0`

#### Description

Configures how many retries should be executed after a failure fetching the data.

#### Example 1

```jayvee
retries: 3
```

Executes up to 3 retries if the original retry fails (so in total max. 4 requests).

### `retryBackoffMilliseconds`

Type `integer`

Default: `2000`

#### Description

Configures the wait time in milliseconds before executing a retry.

#### Example 1

```jayvee
retryBackoff: 5000
```

Waits 5s (5000 ms) before executing a retry.

### `retryBackoffStrategy`

Type `text`

Default: `"exponential"`

#### Description

Configures the wait strategy before executing a retry. Can have values "exponential" or "linear".

#### Example 1

```jayvee
retryBackoffStrategy: "linear"
```

Waits always the same amount of time before executing a retry.

#### Example 2

```jayvee
retryBackoffStrategy: "exponential"
```

Exponentially increases the wait time before executing a retry.

### `followRedirects`

Type `boolean`

Default: `true`

#### Description

Indicates, whether to follow redirects on get requests. If `false`, redirects are not followed. Default `true`

#### Example 1

```jayvee
url: "tinyurl.com/4ub9spwz" 
 followRedirects: true
```

Specifies the URL to fetch the data from and allows redirects.

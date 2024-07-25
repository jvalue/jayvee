---
title: RegexConstraint
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Compatible value type: text

## Description

Limits the values complying with a regex.
 Only values that comply with the regex are considered valid.

## Example 1

```jayvee
 publish constraint IPv4Format oftype RegexConstraint {
   regex: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
 }
```

Text that complies with the IPv4 address format.

## Properties

### `regex`

Type `Regex`

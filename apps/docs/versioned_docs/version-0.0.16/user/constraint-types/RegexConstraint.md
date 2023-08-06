---
title: RegexConstraint
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Compatible ValueType: text

## Description

Limits the values complying with a regex. Only values that comply with the regex are considered valid.

## Example 1

```jayvee
constraint IFOPT_Format oftype RegexConstraint {
  regex: /[a-z]{2}:\d+:\d+(:\d+)?(:\d+)?/;
}
```

Text that complies with the IFOPT (Identification of Fixed Objects in Public Transport) DIN EN 28701:2012 format.

## Properties

### `regex`

Type `regex`

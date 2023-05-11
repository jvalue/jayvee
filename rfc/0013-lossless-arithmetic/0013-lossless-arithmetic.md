<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0013: Lossless arithmetic

| | |
|---|---|
| Feature Tag | `Lossless arithmetic` | <!-- TODO: choose a unique and declarative feature name -->     |
| Status      | `DISCUSSION`          | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED --> |
| Responsible | `@rhazn`              | <!-- TODO: assign yourself as main driver of this RFC -->       |

<!--
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

As we built out Jayvee and define (arithmetric) expressions, we are not defining a formal semantic of how they are evaluated but rely on our interpreter implementation. With this RFC, we define our goal to support mathematically correct arithmetric expressions that are not limited by JavaScript idiosyncrasies when dealing with numbers.

## Motivation

Jayvee is a language to model data pipelines and will therefore handle numeric data as well. For this data, it is important that it arrives in a sink as correctly as possible. Number representation and evaluation of arithmetric expressions has various edge cases in any programming languages, especially in Javascript. Our goal should be to be as correct as possible.

## Explanation

### Use appropriate data types for numbers

[BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) should be used for `integer`s instead of numbers.

## Drawbacks

- Performance will suffer from non-native number types

## Alternatives

- Accept limitations of the interpreter implementation

## Possible Future Changes/Enhancements

- Find an appropriate library for decimal handling
  - Consider [decimal.js](https://github.com/MikeMcl/decimal.js/) and [mathjs](https://github.com/josdejong/mathjs)
- Delay expression evaluation as to as late as possible

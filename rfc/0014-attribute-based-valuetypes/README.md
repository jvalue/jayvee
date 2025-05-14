<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0014: Attributed-based syntax for defining value types

|             |                               |
| ----------- | ----------------------------- | --------------------------------------------------------------- |
| Feature Tag | `attribute-based value types` | <!-- TODO: choose a unique and declarative feature name -->     |
| Status      | `DISCUSSION`                  | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED --> |
| Responsible | `dirkriehle`                  | <!-- TODO: assign yourself as main driver of this RFC -->       |

<!--
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

Value types are a core concept in Jayvee for data validation.
This RFC reworks the syntax to an attribute-based syntax.

## Motivation

To define a value type like CorrelationCoefficient and its range of -1 to +1, we have to write:

```jayvee
valuetype CorrelationCoefficient oftype decimal {
  constraints: [
    MinusOneToPlusOneRange,
  ];
}
```

This syntax is smart in that you don't have to list and name an attribute but rather rely on an implicit 'value' attribute.

The current syntax, in which an underlying value type is referenced through 'oftype', it does not use instantiation/inheritance but rather composition.
The purpose of using composition is that it is

1. more similar to traditional programming and
2. is needed anyway for multi-attribute value types.

Thus, this RFC removes reference to a parent value type in a value type definition and proposes an explicit attribute-based syntax instead that is extendable to a future multi-attribute syntax.

## Explanation

I propose to make that attribute explicit. The new syntax would be:

```jayvee
valuetype CorrelationCoefficient {
  property correlation oftype decimal;

  constraint minusOneToPlusOneRange: MinusOneToPlusOneRange on correlation;
}

constraint MinusOneToPlusOneRange on decimal:
  value >= -1 and value <= 1;
```

The syntax is kept flat rather than using arrays in alignment with the [Jayvee Design Principles](https://jvalue.github.io/jayvee/docs/0.4.0/dev/design-principles#jayvee-manifesto).

Despite referencing reusable constraints, the syntax also allows in-place constraint definition:

```jayvee
valuetype CorrelationCoefficient {
  property correlation oftype decimal;

  constraint minusOneToPlusOneRange:
    correlation >= -1 and correlation <= 1;
}
```

## Drawbacks

1. No backward compatible syntax (breaking change).
2. Removes the inheritance mechanism.

## Alternatives

1. Keep the current syntax.
2. Use arrays instead of the flat syntax.

## Possible Future Changes/Enhancements

1. Multi-attribute value types.

```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;
}
```

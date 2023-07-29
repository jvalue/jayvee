<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0014: Attributed-based syntax for defining value types

| | |
|---|---|
| Feature Tag | `attribute-based value types` | <!-- TODO: choose a unique and declarative feature name -->
| Status | `DRAFT` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `dirkriehle` | <!-- TODO: assign yourself as main driver of this RFC -->
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

I'd like to allow the definition of user-defined single-attribute value types. In addition to the current syntax, in which an underlying value type is referenced through 'oftype', it does not use instantiation/inheritance but rather composition. 

## Motivation

The purpose of using composition is that it is

1. more similar to traditional approaches and
2. is needed anyway for multi-attribute value types.

## Explanation

To define a value type like CorrelationCoefficient and its range of -1 to +1, we have to write:

```jayvee
valuetype CorrelationCoefficient oftype decimal {
  constraints: [
    MinusOneToPlusOneRange,
  ];
}
```

This syntax is smart in that you don't have to list and name an attribute but rather rely on an implicit 'value' attribute. Still, I propose to make that attribute explicit. New syntax would be:

```jayvee
valuetype CorrelationCoefficient {
  attributes: [
    value oftype decimal;
  ];
  constraints: [
    MinusOneToPlusOneRange; // Don't know how to attach this to value attribute
  ];
}
```

While more verbose, it prepares the way for 

```jayvee
valuetype Money {
  attributes: [
    amount oftype decimal;
    currency oftype Currency;
  ];
}
```
which we'll need anyway. Conceivably, the step to multi-attribute value types could be merged with this one, but I simply wanted to try the RFC process rather than keep sending email ;-)

<!-- 
  TODO: Explain the details of the RFC. 
  If the RFC contains more than a single cohesive aspect, structure this section accordingly.
  Make sure to provide realistic modelling examples on the example data set introduced above.
-->

## Drawbacks

1. Introduces a redundant syntax,
2. Creates extra work/may be too difficult, and
3. May be disruptive to how the language currently works. 

## Alternatives

Conceivably, we could use multiple inheritance for multi-attribute value types... just joking. 

## Possible Future Changes/Enhancements

This proposal is to prepare the way for multi-attribute value types.

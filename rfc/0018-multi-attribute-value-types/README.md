<!--
SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0018: Multi attribute value types

| | |
|---|---|
| Feature Tag | `multi-attribute value types` |
| Status | `DISCUSSION` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `jrentlez` |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC allows value types to have multiple attributes.

## Motivation

Domain-specific values can be multi-dimensional, and we want to support those on the long run.
Simple example: Cartesian coordinates composed of an x and an y value.

This RFC is a first step into the direction of fully supporting multi-dimensional value types in the future by extending Jayvee to represent such as composite value types (parsing etc. coming in the future). 

Further, on a pure language design level, we intend to move the current that relies on inheritance towards one that relies on composition, closely aligning with the Jayvee design principle "composition over inheritance".

## Explanation

Value types can contain multiple properties:
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;
}
```

Nested value types are allowed:
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;
}
valuetype Circle {
  property center oftype Coordinate2D;
  property radius oftype decimal;
}
```

### `invalid` and `missing` properties

- If one or more properties are `invalid` and none are `missing`, the composite
value is also `invalid`.
- If one or more properties are `missing` and none are `invalid`, the composite
value is also `missing`.
- If one or more properties are `invalid` and one or more properties are
`missing`, the composite value is `invalid`.


### Constraints

Inline constraints are able to reference all properties:
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;

  constraint isOn45DegreeLine: x == y;
}
```
Constraints can also access the properties of nested value types.
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;
}
valuetype Circle {
  property center oftype Coordinate2D;
  property radius oftype decimal;

  constraint someConstraint: center.x == radius;
}
```

Value types with multiple properties follow the existing behavior that once a
value becomes invalid, it stays invalid.

For example, a value of type `Coordinate2D` could become invalid by halving the
`x` property. If the `y` property is also halved later, the value stays
invalid.

## Drawbacks

## Alternatives

- Don't introduce multi attribute value types.

## Possible Future Changes/Enhancements


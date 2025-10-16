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

- Without this, we cannot handle values comprised of other values.
- The jayvee interpreter still uses inheritance for value types, going against
  the jayvee design principle of composition over inheritance.

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

### Constraints

Inline constraints are able to reference all properties:
```jayvee
valuetype Coordinate2D {
  property x oftype decimal;
  property y oftype decimal;

  constraint isOn45DegreeLine: x == y;
}
```
Constraints can also access the properties of contained value types.
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


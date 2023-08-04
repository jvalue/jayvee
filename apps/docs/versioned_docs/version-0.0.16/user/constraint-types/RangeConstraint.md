---
title: RangeConstraint
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Compatible ValueType: decimal

## Description

Limits the range of a number value with an upper and/or lower boundary which can be inclusive or exclusive. Only values within the given range are considered valid.

## Example 1

```jayvee
constraint HundredScale oftype RangeConstraint {
  lowerBound: 1;
  upperBound: 100;		
}
```

A scale between (and including) 1 and 100.

## Example 2

```jayvee
constraint HundredScale oftype RangeConstraint {
  lowerBound: 1;
  lowerBoundInclusive: false;
  upperBound: 100;		
}
```

A scale for numbers strictly larger than 1 and less or equal to 100.

## Properties

### `lowerBound`

Type `decimal`

Default: `null`

### `lowerBoundInclusive`

Type `boolean`

Default: `true`

### `upperBound`

Type `decimal`

Default: `null`

### `upperBoundInclusive`

Type `boolean`

Default: `true`

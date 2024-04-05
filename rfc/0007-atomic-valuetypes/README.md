<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0007: Atomic Valuetypes

|             |                     |
|-------------|---------------------|
| Feature Tag | `atomic-value-types` |
| Status      | `ACCEPTED`        |
| Responsible | `@felix-oq`         |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC introduces an initial, limited value type concept that allows users to define custom atomic value types 
based on builtin primitive value types. Common constraints can be defined and applied to value types, allowing to restrict the 
set of valid values for a given value type.

## Motivation

As open data is not bound to a particular domain, users need a way to define domain-specific semantics in regard 
to values. This RFC proposes a domain-agnostic way to accomplish this using user-defined value types.

A value type is used to define a set of valid values, so invalid values can easily be identified. In many cases, it 
is sufficient to specify a value type based on a primitive value type (like `text` or `decimal`) and apply 
constraints to further limit the set of values. Consider the following excerpt from a [dataset found on mobilithek.info](
https://mobilithek.info/offers/-8739430008147831066):

| EVA_NR  | DS100 |      IFOPT      |        NAME        | Verkehr |  Laenge   |  Breite   |      Betreiber_Name       | Betreiber_Nr | Status |
|:-------:|:-----:|:---------------:|:------------------:|:-------:|:---------:|:---------:|:-------------------------:|:------------:|:------:|
| 8002551 | AELB  | de:02000:11943  | Hamburg Elbbrücken |   RV    |  10,0245  |  53,5345  | DB Station und Service AG |              |  neu   |
| 8001510 | TDSA  | de:08237:8009:2 |  Dornstetten-Aach  |   RV    |  8,48291  |  48,4733  | DB Station und Service AG |              |  neu   |
| 8001966 | MFOL  | de:09187:90183  |     Feldolling     | nur DPN | 11,852244 | 47,895336 | DB Station und Service AG |              |  neu   |

Some values in the columns could be described using value types, e.g. `Laenge` and `Breite` are decimals ranging 
from -90 to 90 as they are supposed to be geographic coordinates. Further examples for value types will be addressed 
in upcoming sections.

## Explanation

### User-defined value types based on primitive value types

Valuetypes are defined using the `value type` keyword, giving a name and specifying the underlying primitive value type. 
constraints can be added via the `constraints` collection, see [this upcoming section](#adding-constraints-to-value types)
for details.

Here are some examples:

```jayvee
value type IFOPT oftype text {
   constraints: [ ... ];
}

value type Longitude oftype decimal {
   constraints: [ ... ];
}
```

### Defining constraints for value types

Constraints can be defined using the `constraint` keyword, providing a name and by selecting the type of 
constraint. There are several builtin constraints to choose from, see
[the next section](#builtin-types-of-constraints) for details. Constraints are configured by assigning values to attributes (similar 
to block types).

Some examples:

```jayvee
constraint IFOPT_Format oftype RegexConstraint {
   regex: /[a-z]{2}:\d+:\d+(:\d+)?/;
}
```

```jayvee
constraint TrafficValueRange oftype WhitelistConstraint {
   whitelist: [ "FV", "RV", "nur DPN" ];
}
```

```jayvee
constraint GeographicCoordinateRange oftype RangeConstraint {
   lowerBound: -90;
   lowerBoundInclusive: true;
   upperBound: 90;
   upperBoundInclusive: true;
}
```

#### Builtin types of constraints

There are a number of constraints that are built into the language. They should be sufficient to cover most use cases.

##### For any primitive value type

**`WhitelistConstraint`**: Configured via a collection of values to be considered valid. Any other values are 
considered invalid.

**`BlacklistConstraint`**: Configured via a collection of values that are considered invalid.

##### Specifically for `text`

**`RegexConstraint`**: Configured via a regex. Only text values that are matching the given regex are considered valid.

**`LengthConstraint`**: Configured via a minimum and/or a maximum length for text values to be considered valid.

##### Specifically for `decimal` and `integer`

**`RangeConstraint`**: Configured via a lower and an upper bound (each either inclusive or exclusive). Only values in 
that range are considered valid.

### Adding constraints to value types

To add constraints to a value type, they have to be added to the `constraints` collection of that value type:

```jayvee
value type MyValuetype oftype text {
   constraints: [
       MyRegexConstraint,
       MyLengthConstraint
   ];
}

constraint MyRegexConstraint oftype RegexConstraint {
   // ...
}

constraint MyLengthConstraint oftype LengthConstraint {
   // ...
}
```

Note that the constraints have to be suitable regarding the primitive value type.

### Syntactic sugar for common constraints

There are syntactic sugar variants for common constraints. They can be used within the `constraints` collection of 
a value type. Using such a syntax implicitly creates a corresponding constraint with no name.

#### For `RegexConstraint`:

```jayvee
value type IFOPT oftype text {
   constraints: [
       /[a-z]{2}:\d+:\d+(:\d+)?/
   ];
}
```

#### For `WhitelistConstraint`:

Enumeration of all valid values, each separated with `|`:

```jayvee
value type DB_Traffic oftype text {
   constraints: [
       "FV" | "RV" | "nur DPN"
   ];
}
```

#### For `RangeConstraint`:

```jayvee
value type Longitude oftype decimal {
   constraints: [
       -90 <= value <= 90
   ];
}
```

In this context, `value` is a keyword that stands for the value being inspected. Conceptually, the expression above 
desugars to `-90 <= value AND value <= 90`.

Note that it is also allowed to use `<` instead of `<=` for exclusive bounds.

### Assigning value types to columns

The assignment of a user-defined value type to a column is similar to how it is done with primitive value types:

```jayvee
block DbStopsTableInterpreter oftype TableInterpreter {
    header: true;
    columns: [
        "EVA_NR" oftype integer,
        "DS100" oftype text,
        // Here we assign a user-defined value type to the column "IFOPT"
        "IFOPT" oftype IFOPT,
        "NAME" oftype text,
        "Verkehr" oftype DB_Traffic,
        "Laenge" oftype Longitude,
        "Breite" oftype Latitude,
        "Betreiber_Name" oftype text,
        "Betreiber_Nr" oftype integer,
        "Status" oftype text
    ];
}
```

## Drawbacks

- No syntactic sugar available for reusable constraints
- No arbitrary boolean expressions can be used to define custom constraints
- Users are unable to apply boolean operators to constraints other than `AND`

## Alternatives

- Allow arbitrary constraints using boolean expressions that can be combined with boolean operators
  - Unsure how this could be expressed, esp. when constraints of a value type are written down as a collection
  - The syntactic sugar versions in this RFC could be turned into inline boolean expressions

## Possible Future Changes/Enhancements

- Introduce enums as a language feature rather than implicitly via a `text` value type with a `WhitelistConstraint` 
  applied
- Readers and writers to handle different value representations
- Mechanisms for handling invalid values
- More mighty constraints using arbitrary boolean expressions
- Concept for composite value types
- Concept for SI units and operators

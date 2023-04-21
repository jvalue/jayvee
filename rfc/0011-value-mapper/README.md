<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0000: Value Mapper

| | |
|---|---|
| Feature Tag | `value-mapper` |
| Status | `DRAFT` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `georg-schwarz` | <!-- TODO: assign yourself as main driver of this RFC -->
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If anvalue revision emerges, switch to status DRAFT.
-->

## Summary

The RFC introduces a concept to map value types from/to different representations.

## Motivation

Right now, we don't have a concept to transform a value into the format we want it to have.

For example, the text cell `30 °C` should be parsable to a plain number `30`.


## Explanation

### Mapper

A mapper transforms a value from a **primitive** valuetype to another one (or the same). Therefore, we can express certain transformation logic. The syntax looks as follows:

```
mapper <name> from <source-type> to <target-type> {
  <matching rule> => <transformation expression>;
  // potentially multiple mapping rules
}
```

The evaluation of the mapping rules happens top-to-bottom and stops after a match, meaning a single value always is mapped by exactly one or none mapping rules. In other words, it resembles a `if-elseif-else` cascade.

If no matching rule applies, an INVALID value is assigned (to be designed).

You can define a "catch-all" rule only at the bottom of the matching rule cascade:
```
  value => <transformation expression>;
```

#### Examples
```
// Temperature in Kelvin
valuetype Temperature oftype decimal {
  constraints: // ...
}

// string "6 °C" -> decimal (Kelvin)
mapper from text to Temperature {
  \(\d)+ °C\ => (group 1 as decimal) + 273.15:
}

// yes => True, no => False, value => INVALID
mapper from text to boolean {
  "yes" => True;
  "no" => False;
  // value => INVALID; // implicitly
}

mapper StdDecimalReader from text to decimal {
  value => value as decimal;
}
```

#### Matching Rule Format

The matching rules can have the following formats:
- `text`: a matching is successful if the text and the value match (`==` operator).
- `regex`: a matching is successful if the regex applies.

We also support name capture groups for regex, allowing to name the resulting groups instead of only enumerating them.
```
/(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
```


#### Transformation Expression

The transformation expression uses the `value` keyword for the input. Expressions are valid that produce the target type,e.g., arithmetic operations.


### Composite Mapper

Composite mapper are a good way to pull apart complex mapping logic that would otherwise need to be put into one long and hard-to-understand transformation expression.

The target type and the source type of connected mappers have to match. The syntax looks as follows:

```
composite mapper <name> from <source-type> to <target-type> {
  <mapper1> -> <mapper2> -> <mapper3>;
}
```

The chaining of mappers follows the `pipe` syntax and can be defined to any length greater than 2.


#### Example

```
mapper TemperatureSelector from text to decimal {
  \(?<temp>\d)+ °C\ => group temp as decimal:
}

mapper CelsiusToKelvin from decimal to decimal {
  value => value + 273.15;
}

composite mapper CelsiusTemperatureReader from text to decimal {
  TemperatureSelector -> StdDecimalReader -> CelsiusToKelvin;
}
```



### Usage of Mappers

#### TableInterpreter

The `TableInterpreter` block uses a Mapper from `text` to the desired value type with the `with` keyword. Parsing can still be used as currently (`as` keyword)

Example:
```
block GasReserveTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
      "Datum" with TextMapper,
      "Kritisch" with NumberToBooleanMapper,
      "Angespannt" as text,
      "Stabil" with NumberToBooleanMapper,
      "Speicherstand IST" with PercentageMapper,
      "gesetzliche Ziele" with PercentageMapper
    ];
}
```

#### MapperBlock

There is a newly introduced `MapperBlock` block type that applies the mapper to a set of cells in a `Sheet`.

Example:
```
block NumberToBooleanBlock oftype MapperBlock {
  cells: range A3:A17;
  mapper: NumberToBooleanMapper;
}
```

### Parsing

Transformation expression allow parsing with the keyword `as`. On failure, an error is thrown.

Example:
```
value as decimal // parses to decimal
```




## Drawbacks

<!-- TODO: (optional) Discuss the drawbacks of the proposed design. -->

## Alternatives

<!-- TODO: (optional) Point out alternatives to the design or parts of the design. -->

## Possible Future Changes/Enhancements

- Reading / writing compound value types in any form is not supported by this version.
- Builtin mappers/writers for SI units / SI units as first-citizen concept in ValueTypes.
- Automatic reversion of mappings (bidirectional mappers) where possible, e.g., for simple calculations.
- A `replacer` might simplify or even enable further scenarios.  


### Use mappings in transformers

Use multiple input / output parameters in a more general transformer concept to have a more flexible but complex construct.

```
transformer CelsiusToKelvin {
  input tempCelsius oftype decimal;
  output tempKelvin oftype decimal;

  tempKelvin = tempCelsius + 273.15; // simple calculation does not need a mapping
}

// reads "23.4" and "$" into a compound value type
transformer CelsiusToKelvin {
  input amountRaw oftype text;
  input currencyRaw oftype text;
  output balance oftype Balance; // compound type with fields "amount" and "currency"

  balance.amount = amountRaw as decimal;    // simple parsing does not need a mapping
  balance.currency = mapping on currencyRaw { // mapping
    /^(EUR|€)$/ => "EUR";
    /^(USD|$)$/ => "USD";
  };
}

// separates "Example-Street 32a" to "Example-Street" and "32a"
transformer StreetAndNumberSeparator {
  input addressRaw oftype text;
  output street oftype text;
  output houseNumber oftype text;

  street = mapping on addressRaw {
    /^(.*) (.*)$/ => group 1 as text;
  }
  houseNumber = mapping on addressRaw {
    /^(.*) (.*)$/ => group 2 as text;
  }
}
```

Mappings could just be one tool among many in this regard and be encapsulated in the `transformer` concept.


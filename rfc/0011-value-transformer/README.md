<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0011: Value Transform

| | |
|---|---|
| Feature Tag | `value-transform` |
| Status | `ACCEPTED` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `georg-schwarz` |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC introduces the concept of Value Transform functions that allow reading values, writing values, and transforming values.

**Note:** This RFC focuses enhancing the current state but has an elaborate "Possible Enhancements" section that showcases how this concept can be extended in the future.

## Motivation

Right now, we can only "parse" values but not manipulate them in order to clean data.

## Explanation

```
transform <name> {
  from <inputName> oftype <valuetype>;
  to <outputName> oftype <valuetype>;

  <outputName>: <expression producing output valuetype>;
}
```

A transform can map one input to one output with their types.
See future enhancements for multiple inputs and outputs.

The output value is assigned (`:`) to an expression to produces the output values.

### Example: Simple numeric transformation
```
transform CelsiusToKelvin {
  from tempCelsius oftype decimal;
  to tempKelvin oftype decimal;

  tempKelvin: tempCelsius + 273.15; // simple calculation
}
```

### Usage: TableTransformerBlock
There is a newly introduced `TableTransformerBlock` block type that applies the mapper to a column in a `table`.

Example:
```
block GermanToBooleanBlock oftype TableTransformerBlock {
  inputColumn: "Kritisch";  // to satisfy the input of the transform
  outputColumn: "IsCritical"; // might also overwrite the input column if name is identical
  use: GermanToBooleanTransformer;
}
```


## Drawbacks
- declaration of in and outputs might be much boilerplate.

## Alternatives

- use other keyword, e.g., `vtrans`, `mapper`, ...
- use `input`/`output` keywords instead of `from`/`to`, or even shorter `in`/`out`
- Transformers can work on sheets
- refactor TableInterpreter to also allow transforms

## Possible Future Changes/Enhancements

- We could introduce a pipe-like syntax that allows chaining transforms.
- Support multiple inputs and outputs

### Variables in Transformers
Storing interim results can improve coding experience.
```
transform <name> {
  // inputs and outputs
  var <varBane> oftype <valuetype>: <expression producing valuetype>; // alternative: infer type automatically 
  // use variable to compute outputs
}
```

### Composite ValueTypes

Composite ValueTypes could be served with this implementation by extending the assignment statement:
```
// "MyStreet" and "7b" => composite valuetype
transform AddressComposer {
  from streetName oftype text;
  from houseNumber oftype text;
  to address oftype Address; // has properties "streetName" oftype StreetName and "houseNumber" oftype HouseNumber 

  // "." notation to write on property of composite value type
  address.streetName: streetName using StreetNameReader; // StreetNameReader is other transformation text -> StreetName
  address.houseNumber: houseNumber using HouseNumberReader; // HouseNumberReader is other transformation text -> HouseNumber
}
```

### MatchOn

A mapping expression might enable easier string matching. They are syntactic sugar for if-elseif cascades.

```
// reads "23.4" and "$" into a compound value type
transform CelsiusToKelvin {
  from amountRaw oftype text;
  from currencyRaw oftype text;
  to balance oftype Balance; // compound type with fields "amount" and "currency"
  
  balance.amount: amountRaw as decimal;    // simple parsing does not need a mapping
  balance.currency: matchOn currencyRaw { // matching
    /^(EUR|€)$/ => "EUR";
    /^(USD|$)$/ => "USD";
  };
}
```
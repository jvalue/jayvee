<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0000: Value Transformer

| | |
|---|---|
| Feature Tag | `value-transformer` |
| Status | `DRAFT` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `georg-schwarz` |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC introduces the concept of Value Transformers that allow reading values, writing values, and transforming values.

**Note:** This RFC focuses enhancing the current state but has an elaborate "Possible Enhancements" section that showcases how this concept can be extended in the future.

## Motivation

Right now, we can only "parse" values but not manipulate them in order to clean data.

## Explanation

```
transformer <name> {
  input <inputName> oftype <valuetype>; // potentially many
  output <outputName> oftype <valuetype>; // for now: exactly one

  <outputName>: <expression producing output valuetype>;
}
```

A transformer can map none, one, or multiple inputs to at least one output with their types.
See future enhancements for multiple outputs.

The output value is assigned (`:`) to an expression to produces the output values.

### Example 1: Simple numeric transformation
```
transformer CelsiusToKelvin {
  input tempCelsius oftype decimal;
  output tempKelvin oftype decimal;
  tempKelvin: tempCelsius + 273.15; // simple calculation does not need a mapping
}
```

### Example 2: Multiple inputs
```
// "MyStreet" and "7b" => "MyStreet 7b"
transformer AddressComposer {
  input streetName oftype text;
  input houseNumber oftype text;
  output address oftype text;

  address: streetName + " " + houseNumber; // assumption: "+" is string appending
}
```


### Example 3: Multiple outputs
```
// "MyStreet" and "7b" => "MyStreet 7b"
transformer DigitSeparator {
  input number oftype integer;
  output ones oftype integer;
  output tens oftype integer;
  output hundreds oftype integer;

  ones: number % 10;
  tens: floor (((number % 100) - ones) / 10);
  hundreds: floor (((number % 1000) - tens) / 100);
}
```

### Usage 1: TableInterpreter

The `TableInterpreter` block uses a transformer from `text` to the desired value type with the `with` keyword. Parsing can still be used as currently (`as` keyword)

Example:
```
block GasReserveTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [ // only allow transformers with one input and one output or plain parsing here
      "Datum" with DateTransformer,
      "Kritisch" with PercentTransformer,
      "Angespannt" as text,
      "Stabil" with GermanToBooleanTransformer,
      "Speicherstand IST" with PercentTransformer,
      "gesetzliche Ziele" with PercentTransformer
    ];
}
```

### Usage 2: TableTransformerBlock
There is a newly introduced `TableTransformerBlock` block type that applies the mapper to a column in a `table`.

Example:
```
block GermanToBooleanBlock oftype TableTransformerBlock {
  inputColumns: ["Kritisch"];  // array to satisfy all inputs of transformer
  outputColumns: ["IsCritical"]; // might also overwrite one of the input columns
  use: GermanToBooleanTransformer;
}
```

### Usage 3: SheetTransformerBlock
There is a newly introduced `SheetTransformerBlock` block type that applies the mapper to a set of cells in a `sheet`. Please note that the value type is not stored in sheets and thus lost after computation. Outputs are therefore parsed to string automatically by the block.

Example:
```
block GermanToBooleanBlock oftype SheetTransformerBlock {
  inputCells: [range A3:A17]; // if multiple arguments: have to match in dimensions
  outputCells: [range D3:D17]; // has to match dimension of inputs
  use: GermanToBooleanTransformer;
}
```


## Drawbacks
- declaration of in and outputs might be much boilerplate.
- TableInterpreter blocks only allow transformers with one input and one output.

## Alternatives

- use other keyword, e.g., `vtrans`, `mapper`, ...
- shorten `input` and `output` keywords to `in` and `out`
- offer no TransformerBlock or similar for sheets, only operate on tables
- design nicer syntax for multiple inputs and outputs via names instead of relying on the index
- refactor TableInterpreter completely to also allow transformers with multiple in and outputs

## Possible Future Changes/Enhancements

- We could introduce a syntax that allows chaining transformers.

### Variables in Transformers
Storing interim results can improve coding experience.
```
transformer <name> {
  // inputs and outputs
  var <varBane> oftype <valuetype>: <expression producing valuetype>; // alternative: infer type automatically 
  // use variable to compute outputs
}
```

### Composite ValueTypes

Composite ValueTypes could be served with this implementation by extending the assignment statement:
```
// "MyStreet" and "7b" => composite valuetype
transformer AddressComposer {
  input streetName oftype text;
  input houseNumber oftype text;
  output address oftype Address; // has properties "streetName" oftype StreetName and "houseNumber" oftype HouseNumber 

  // "." notation to write on property of composite value type
  address.streetName: streetName using StreetNameReader; // StreetNameReader is other transformation text -> StreetName
  address.houseNumber: houseNumber using HouseNumberReader; // HouseNumberReader is other transformation text -> HouseNumber
}
```

### Mappers

A mapping expression might enable easier string matching.
```
// reads "23.4" and "$" into a compound value type
transformer CelsiusToKelvin {
  input amountRaw oftype text;
  input currencyRaw oftype text;
  output balance oftype Balance; // compound type with fields "amount" and "currency"
  balance.amount: amountRaw as decimal;    // simple parsing does not need a mapping
  balance.currency: mapping on currencyRaw { // mapping
    /^(EUR|€)$/ => "EUR";
    /^(USD|$)$/ => "USD";
  };
}
```
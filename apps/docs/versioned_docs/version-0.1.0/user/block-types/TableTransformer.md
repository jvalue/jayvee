---
title: TableTransformer
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `Table`

Output type: `Table`

## Description

Applies a transform on each value of a column. The input port type of the used transform has to match the type of the input column.

## Example 1

```jayvee

transform CelsiusToFahrenheit {
  from Celsius oftype decimal;
  to Fahrenheit oftype decimal;

  Fahrenheit: (Celsius * 9/5) + 32;
}

block CelsiusToFahrenheitTransformer oftype TableTransformer {
  inputColumns: ['temperature'];
  outputColumn: 'temperature';
  use: CelsiusToFahrenheit;
}
```

Given a column "temperature" with temperature values in Celsius, it overwrites the column with computed values in Fahrenheit by using the `CelsiusToFahrenheit` transform. The transform itself is defined elsewhere in the model.

## Example 2

```jayvee

transform CelsiusToFahrenheit {
  from Celsius oftype decimal;
  to Fahrenheit oftype decimal;

  Fahrenheit: (Celsius * 9/5) + 32;
}

block CelsiusToFahrenheitTransformer oftype TableTransformer {
  inputColumns: ['temperatureCelsius'];
  outputColumn: 'temperatureFahrenheit';
  use: CelsiusToFahrenheit;
}
```

Given a column "temperatureCelsius" with temperature values in Celsius, it adds a new column "temperatureFahrenheit" with computed values in Fahrenheit by using the `CelsiusToFahrenheit` transform. The transform itself is defined elsewhere in the model.

## Properties

### `inputColumns`

Type `Collection<text>`

#### Description

The names of the input columns. The columns have to be present in the table and match with the transform's input port types.

### `outputColumn`

Type `text`

#### Description

The name of the output column. Overwrites the column if it already exists, or otherwise creates a new one.

### `use`

Type `Transform`

#### Description

Reference to the transform that is applied to the column.

---
sidebar_position: 8
---

# Transforms

_Transforms_ are a concept in Jayvee to define the transformation of individual values.
They are similar to functions in programming languages, i.e. they perform computations on some input values and produce output values. _Transforms_ work by mapping input values to outputs using [expressions](./expressions.md).

:::info Important

Up to version `0.0.16`, we only supported a single input for transformers!

:::

:::info Important

In its current state, Jayvee only supports a arbitrary numbers of inputs and a single output for transforms.
For the future, it is planned to support arbitrary numbers for outputs as well.

:::


## Syntax

The general syntax of _transforms_ looks like this:

```jayvee
transform <name> {
  from <inputName> oftype <inputValueType>;
  to <outputName> oftype <outputValueType>;

  <outputName>: <expression>;
}
```

The `transform` keyword is used to define a _transform_ and give it a name.
The curly braces denote the body of the _transform_.

The body first contains the definitions of input and output ports.
Input ports are defined using the `from` keyword whereas output ports use the `to` keyword.
Next, they are given a name and, after the `oftype` keyword, typed with a _value type_.

Below, there needs to be an output assignment for each output port.
The output assignment defines how a particular output value is computed.
They consist of the name of an output port, followed by a `:`.
Next, an [expression](./expressions.md) specifies how the output value shall be computed.
Names of input ports can be used in such an expression to refer to input values.

### Example

The following transform converts temperature values from degree Celsius to Kelvin:

```jayvee
transform CelsiusToKelvin {
  from tempCelsius oftype decimal;
  to tempKelvin oftype decimal;

  tempKelvin: tempCelsius + 273.15;
}
```

The following _transform_ converts a text based status into a boolean value, `true` if the text is `Active`, `false` for any other value:

```jayvee
transform StatusToBoolean {
  from statusText oftype text;
  to statusBoolean oftype boolean;

  statusBoolean: statusText == "Active";
}
```

## Applying transforms to table columns

Transforms can be applied to columns of a table.
Please refer to the documentation of the [`TableTransformer` block type](./block-types/TableTransformer.md) to find out how.

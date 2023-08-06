---
sidebar_position: 5
---

# Expressions

Expressions in Jayvee are arbitrarily nested statements. They consist of:
- literals (e.g., numbers `5` or strings `"Example"`)
- variables (e.g., declared by `from` properties in [Transforms](./transforms.md))
- operators (e.g., `*` or `sqrt`)

Expressions get evaluated at runtime by the interpreter to a [Built-in ValueType](./core-concepts.md#valuetypes).

### Example

The following expression is evaluated to the `integer` `10`: `(2 + 3) * 2`

The following expression is evaluated to the `integer` `3`: `floor (3.14)`

The following expression is evaluated to the `boolean` `true`: `"Example" == "Example"`

### Further reading
For a deeper documentation of how expressions and operators work internally, refer to the [developer docs](../dev/09-expressions-and-operators.md).
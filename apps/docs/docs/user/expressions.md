---
sidebar_position: 7
---

# Expressions

Expressions in Jayvee are arbitrarily nested statements. They consist of:
- literals (e.g., numbers `5` or strings `"Example"`)
- variables (e.g., declared by `from` properties in [Transforms](./transforms.md))
- operators (e.g., `*` or `sqrt`)

Expressions get evaluated at runtime by the interpreter to a [built-in _value type_](./value-types/built-in-value-types).

### Example

The following expression is evaluated to the `integer` `10`: `(2 + 3) * 2`

The following expression is evaluated to the `boolean` `true`: `"Example" == "Example"`

The following expression is evaluated to the `text` `I love Datypus`: `"I love platypuses" replace /platypuses/ with "Datypus"`

### List of Operators

#### Arithmetics (binary operators)
- `+` for addition, e.g., `5 + 3` evaluates to `8`
- `-` for subtraction, e.g., `5 - 3` evaluates to `2`
- `*` for multiplication, e.g., `5 * 3` evaluates to `15`
- `/` for division, e.g., `6 / 3` evaluates to `2`
- `%` for modulo, e.g., `5 % 3` evaluates to `2`
- `pow` for power, e.g., `2 pow 3` evaluates to `8`
- `root` for root, e.g., `27 root 3` evaluates to `3`

#### Arithmetics (unary operators)
- `+` for positive signing, e.g., `+5` evaluates to `5`
- `-` for negative signing, e.g., `-5` evaluates to `-5`
- `sqrt` for square root, e.g., `sqrt 9` evaluates to `3`
- `foor` for flooring a number, e.g., `floor 5.3` evaluates to `5`
- `ceil` for ceiling a number, e.g., `floor 5.3` evaluates to `6`
- `round` for rounding a number, e.g., `floor 5.3` evaluates to `5`

#### Relational (binary operators)
- `<` for smaller, e.g., `3 < 3` evaluates to `false`
- `<=` for smaller or equal, e.g., `3 <= 3` evaluates to `true`
- `>` for greater, e.g., `3 > 3` evaluates to `false`
- `>=` for greater or equal, e.g., `3 >= 3` evaluates to `true`
- `==` for equal, e.g., `3 == 3` evaluates to `true`
- `!=` for not equal, e.g., `3 != 3` evaluates to `false`

#### Logical (binary operators)
- `and` for a logical and (both need to be true to evaluate to true)
- `or` for a logical or (at least left or right needs to be true to evaluate to true)
- `xor` for a logical xor (either left or right needs to be true to evaluate to true)

#### Logical (unary operators)
- `not` for logical negation, `not true` evaluates to `false`

#### Others (binary operators)
- `matches` for a regex match, e.g., `"A07" matches /^[A-Z0-9]*$/` evaluates to `true`
- `in` for inclusion in an array, e.g., `"a" in ["a", "b", "c"]` evaluates to `true`

#### Text manipulation (unary operators)
- `lowercase` converts all alphabetic characters in a text to lowercase
- `uppercase` converts all alphabetic characters in a text to uppercase

#### Text manipulation (ternary operators)
- `replace [...] with [...]` replaces regex matches in a text with a string

### Operator Details

#### `in` Operator

The `in` operator checks whether a value is included in a collection of values. For example:

```jayvee
4.5 in [3, 6.5] // evaluates to false
3 in [3.0, 6.5] // evaluates to true
"a" in ["a", "b", "c"] // evaluates to true
```

The operator supports `text`, `integer` and `decimal` values as operands. The compatibility of left and right operand types follows these rules:
- For the `in` operator we have a type for the needle (left operand) and a type for the elements in the haystack (right operand).
- There is an automated type conversion as long as it is lossless and clearly defined (integer to decimal as of now).
- We allow any combination of operands that has either: (i) An automated type conversion from needle type (left operand) to the type of the elements in the haystack (right operand), or (ii) the other way around.


### Further reading
For a deeper documentation of how expressions and operators work internally, refer to the [developer docs](../dev/04-guides/04-expressions-and-operators.md).

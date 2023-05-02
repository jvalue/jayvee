<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0009: Simple Expressions

| | |
|---|---|
| Feature Tag | `Simple Expressions` | 
| Status | `ACCEPTED` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `georg-schwarz` | <!-- TODO: assign yourself as main driver of this RFC -->
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC introduces a simple expression language for numeric, boolean, and text values.

## Motivation

Right now, users have to to define property values of fractions in the decimal representation, e.g., `0.3`. They cannot express non--terminating decimal values or repeating decimal ones, e.g., `1/3` (a third). 

For future features (like value transformations), we also need boolean expressions that allow for numeric comparisons, e.g. `3 > 5` should resolve to `false`.

## Explanation

### Operators

The following operators are in descending order by their precedence:
- `()` parentheses for grouping a sub-expression
- unary operators (see below)
- binary operators (see below)

When operators of similar precedence don't determine the order, we evaluate from left to right.

#### Unary Prefix Operator
Binary prefix operators follow the pattern `<operator> <operand>`. Parentheses can be used for grouping larger sub-expressions.
The following operators share the same precedence:
- `floor`, `ceil`, `round` for conversion of decimal numbers to integers.
- `sqrt` for calculating the square root on numbers.
- `not` for unary inversion of boolean values

#### Binary Operators
Binary infix operators follow the infix pattern `<left-operand> <operator> <right-operand>`.
The following operators are in descending order by their precedence:
- `pow`, `root` for power and root calculation. E.g., `2 pow 3` is 2³, `5 root 2` is `sqrt(5).
- `*`, `/`, `%` for multiplication, division, and remainder
- `+`, `-` for addition and subtraction
- `<`, `<=`, `>`, `>=` for relational operators comparing numbers
- `==`, `!=` for equality operators comparing numbers, booleans, and texts
- `and` for a logical AND on booleans
- `xor` for a logical XOR on booleans
- `or` for a logical OR on booleans


### Handling of booleans

The expression resolving of boolean does follow the common pattern. 


### Handling of numbers

Division operator and multiplication/addition/subtraction with at least one decimal operand  **always** produce `decimal` values. To convert to an integer value, the operators `floor`, `ceil`, `round` have to be used.

Division by zero throws an error.

Comparison of different number types (e.g., integers and decimals) is solved by converting first to the less restrictive value type (in the example, to decimals).

### Handling of texts

We currently only support equality check on text values


### Interplay of different primitive value types

We infer the primitive value type based on the operator. The resulting value type of each operator is unambiguous. 

The operands `==` and `!=` are the only ones that allow operands of different value types. Other operators are unambiguous. Comparing the equality of two operands of different value types throws an error, unless they are different types of numbers that can be converted to the less restrictive type (e.g., integers are converted to decimals when compared).  


## Drawbacks

- Some operators are functions in other languages which might be unintuitive.
- Always converting to decimals on division might lead to misleading results if the programmer is not aware.

## Alternatives

- Use an established scripting language instead (e.g. Lua script).
- Automatically convert to integer values based on some criteria.
- Make `pow` and `root` prefix operators, e.g., `root(5, 2)`.
- Require grouping brackets on unary operators.

## Possible Future Changes/Enhancements

- Incorporate operators for `text` values (append, split, get length, ...).
- Access input data (e.g., sheet cells) to implement value transformations (#213).
- Division by zero produces an INVALID value.
- Division and multiplication/addition/subtraction with at least one decimal operand might statically evaluate to an integer if no variables are used and the result has no decimals.
- Boolean expressions could be used to describe custom constraints.
- Depending on future design decisions, value transformations may relate more to value representation concepts (e.g., value readers and writers) rather than blocks.

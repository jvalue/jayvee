---
title: Working with the AST
---

The nodes of the Abstract Syntax Tree (AST) consist of types and interfaces generated from the language grammar.
See [here](./06-jayvee-grammar.md) for more information on that topic.

The following sections provide practical guides and tips for working with nodes of the AST.

## Dealing with potentially incomplete AST nodes

According to the generated interfaces, properties of AST nodes are never `undefined`.
In practice however, this is not always the case.

For example, consider the language server being confronted with an incomplete Jayvee model with syntax errors.
In such cases, properties of AST nodes are in fact `undefined`, despite their interface definition.
In the interpreter however, after lexical and syntactic analysis succeeded, it can be assumed that all AST nodes are complete (i.e. they have no undefined properties) and even that all references are resolved.

In order to avoid accessing properties of AST nodes that are potentially undefined, it is recommended to access them via the [`?.` operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining) rather than the regular `.` operator.
Note that this might result in a conflict with the ESLint rule [`@typescript-eslint/no-unnecessary-condition`](https://typescript-eslint.io/rules/no-unnecessary-condition/), so it has to be disabled manually for such cases.

For disabling the rule in an entire file, place this comment below the copyright and licensing header:

```typescript
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
```

For just a single line, place this comment above that particular line:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
```

## Usage of `assertUnreachable`

Most times, it is beneficial to make case distinctions exhaustive, especially when working with AST nodes, properties with a [union literal type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types) or enums.
Exhaustiveness in this context means, that the TypeScript compiler is supposed to yield an error if a case distinction does not cover all possibilities.

Langium offers a function called `assertUnreachable` which is capable of enforcing exhaustiveness and producing compiler errors in case of violations. See the following examples to get an idea on how to use it in practice:

<details>

<summary>Example for an exhaustive switch statement on a union literal type</summary>

```typescript
import { assertUnreachable } from 'langium';

const operator: '+' | '-';

switch(operator) {
  case '+': {
    // ...
    break;
  }
  case '-': {
    // ...
    break;
  }
  default: {
    // To ensure the switch being exhaustive on `operator`:
    assertUnreachable(operator);
  }
}
```

</details>

<details>

<summary>Example for an exhaustive if-elseif-else cascade using typeguards</summary>

Consider the exemplary AST nodes `A`, `B` and `C` and that `A = B | C`:

```typescript
import { assertUnreachable } from 'langium';
import { A, B, isB, C, isC } from './ast'

const astNode: A;

if (isB(astNode)) {
  // `astNode` has type `B` here
} else if (isC(astNode)) {
  // `astNode` has type `C` here
} else {
  // To ensure the if-elseif-else cascade being exhaustive on `astNode`:
  assertUnreachable(astNode);
}
```

</details>

## Usage of `assert` for expressing runtime expectations

TBD

## AST wrapper classes

TBD

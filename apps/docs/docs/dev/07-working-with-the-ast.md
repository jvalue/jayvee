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

<details>

<summary>Full example</summary>

Consider an exemplary AST node `A` with a property `x` of type `string`. To access that property safely:

```typescript
import { A } from './ast'

const astNode: A;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const property: string | undefined = astNode?.x;
```

</details>

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

During development, it may occur that a certain condition is expected to **be always true** at runtime.
For example, an AST node being of a certain type or a property being defined.
The type system of TypeScript is not always able to infer such facts, so developers may have to express these expectations explicitly in their code.
Examples are [type assertions](https://www.typescriptlang.org/docs/handbook/advanced-types.html) or the [non-null assertion operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator).
Their usage may be problematic in case the condition does not always hold, e.g. due to a bug in the program or a wrong expectation by the programmer.
In such cases, it is hard to locate the origin and debug the program because such operations are erased in the compiled JavaScript code.

To avoid these issues, it is recommended to express such expectations as boolean expressions that are actually validated at runtime.
This can be easily achieved by using the `assert` function.
It evaluates a given boolean expression and throws an `AssertionError` in case it evaluates to `false`.
After calling `assert`, the type system of TypeScript assumes the condition to be `true` and afterwards narrows types accordingly.

Here is an example of how to use it in practice:

```typescript
// Import the `assert` function like this:
import { strict as assert } from 'assert';

import { A, B, isB } from './ast';

const astNode: A;
assert(isB(astNode));
// Here `astNode` has type `B`

const referenced = astNode?.reference?.ref;
assert(referenced !== undefined);
// Here `referred` is not `undefined`
```

## AST wrapper classes

The generated interfaces for AST nodes in `ast.ts` are only meant to represent the AST structurally, they don't define any behavior.
Also, in case of syntactic sugar, there may be different kinds of AST nodes representing the same semantic language concept (e.g. single pipes with a verbose syntax or chained pipes). 

To cope with this problem, there is the concept of an `AstNodeWrapper`.
An AST node wrapper is capable of wrapping AST nodes that represent the same semantic language concept and adding behavior to them via custom methods.
To get an impression on how this can be done in practice, please have a look at the [`PipeWrapper` class](https://github.com/jvalue/jayvee/blob/main/libs/language-server/src/lib/ast/wrappers/pipe-wrapper.ts) and the [`AstNodeWrapper` interface](https://github.com/jvalue/jayvee/blob/main/libs/language-server/src/lib/ast/wrappers/ast-node-wrapper.ts).

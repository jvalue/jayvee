---
title: Jayvee Extensions
sidebar_position: 6
---

## Concepts

### Jayvee extension

A Jayvee extension is used to add new block types to the language without having to modify the actual grammar of the language. Such a Jayvee extension usually consists of two parts: a language extension and an execution extension which are described in the upcoming two sections.

Jayvee extensions that shall be used by default are bundled into the so-called [standard extension](https://github.com/jvalue/jayvee/tree/main/libs/extensions/std). That way, the [language server](https://github.com/jvalue/jayvee/tree/main/libs/language-server) and the [interpreter](https://github.com/jvalue/jayvee/tree/main/apps/interpreter) are able to load them out of the box.

### Language extension

A language extension defines meta information of block types which are required by the
[language server](https://github.com/jvalue/jayvee/tree/main/libs/language-server).
Such meta information describes properties of
block types such as their names, input / output types and their properties.

Note that language extensions don't define any behavior. Instead, this is done by the corresponding execution extension.

### Execution extension

An execution extension defines behavior for block types. They build on the meta information from the corresponding
language extension, e.g. input / output types of the block need to match the signature of the execution method and
properties are accessed by their specified name.

Execution extensions are only required by the [interpreter](https://github.com/jvalue/jayvee/tree/main/apps/interpreter) and not necessarily by the [language server](https://github.com/jvalue/jayvee/tree/main/libs/language-server) as they solely define behavior.

## Recipes

### Add a new Jayvee execution extension

#### 1. Generate an execution libraries

```bash
npx nx g @nrwl/node:library --name="extensions/<extension-name>/exec"
```

#### 2. Create extension classes

In `libs/extensions/<extension-name>/exec/src/extension.ts`:

```typescript
import {
  BlockExecutorClass,
  JayveeExecExtension,
} from '@jvalue/jayvee-execution';

export class MyExecExtension implements JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [];
  }
}
```

#### 3. Export extension classes

In `libs/extensions/<extension-name>/exec/src/index.ts`:

```typescript
export * from './extension';
```

#### 4. Register new extension classes in the standard extension

In `libs/extensions/std/exec/src/extension.ts`:

```typescript
// ...

import { MyExecExtension } from '@jvalue/jayvee-extensions/<extension-name>/exec';

export class StdExecExtension implements JayveeExecExtension {
  private readonly wrappedExtensions: JayveeExecExtension[] = [
    // ...
    // Register your execution extension here:
    new MyExecExtension(),
    // ...
  ];

  // ...
}
```

### Add a new block type in a Jayvee extension

#### 1. Create a builtin blocktype

Define the syntax of the new blocktype in the [language server's builtin blocktypes](https://github.com/jvalue/jayvee/tree/main/libs/language-server/src/stdlib/builtin-blocktypes).

The following example defines a block type `MyExtractor` with a text property called `url` and a property `retries` with a default value:

```jayvee
builtin blocktype MyExtractor {
	input default oftype None;
	output default oftype Sheet;

	property url oftype text;
	property retries oftype interger: 10;
}
```

The new block type will be automatically registered on the language server startup.

#### 2. Add custom validation logic (if required)

If the block type and/or its properties requires custom validation logic, you can implement it in the [language server's block type specific checks](https://github.com/jvalue/jayvee/tree/main/libs/language-server/src/lib/validation/checks/blocktype-specific).

#### 3. Implement `BlockExecutor`

The following example implements an executor for the previously defined block type `MyExtractor`.

The `execute` method defines the behavior when a block is executed. Its signature matches the input and output types defined in `MyExtractor.jv` file.

In `libs/extensions/<extension-name>/exec/src/lib/my-extractor-executor.ts`:

```typescript
import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  Sheet,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType, PrimitiveValuetypes } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class MyExtractorExecutor
  extends AbstractBlockExecutor<IOType.NONE, IOType.SHEET>
{
  // Needs to match the type in meta information:
  public static readonly type = 'MyExtractor';

  public readonly inputType = IOType.NONE;
  public readonly outputType = IOType.SHEET;

  async doExecute(
    input: None,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    // Accessing property values by their name:
    const url = context.getPropertyValue(
      'url',
      PrimitiveValuetypes.Text,
    );
    const limit = context.getPropertyValue(
      'limit',
      PrimitiveValuetypes.Integer,
    );

    // ...

    if (error) {
      return R.err(...);
    }

    return R.ok(...);
  }
}
```

> **Info**
> The interface `BlockExecutor<I,O>` is used as an API for block executors. The abstract class `AbstractBlockExecutor<I,O>` gives some further functionality for free, e.g., debug logging.

> **Warning**
> The generic types of `AbstractBlockExecutor<I,O>` need to match the input and output types of the corresponding `blocktype` definition.

#### 4. Register the new `BlockExecutor` in the execution extension

In `libs/extensions/<extension-name>/exec/src/extension.ts`:

```typescript
// ...

import { MyExtractorExecutor } from './lib/my-extractor-executor';

export class MyExecExtension implements JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [
      // ...
      // Register your block executor here:
      MyExtractorExecutor,
      // ...
    ];
  }
}
```

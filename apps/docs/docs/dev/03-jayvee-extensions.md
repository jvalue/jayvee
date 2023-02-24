---
title: Jayvee Extensions
---

## Concepts

### Jayvee extension

A Jayvee extension is used to add new block types to the language without having to modify the actual grammar of the language. Such a Jayvee extension usually consists of two parts: a language extension and an execution extension which are described in the upcoming two sections.

Jayvee extensions that shall be used by default are bundled into the so-called `standard extension`. That way, the `language server` and the `interpreter` are able to load them out of the box.

### Language extension

A language extension defines meta information of block types which are required by the `language server`. Such meta information describes properties of block types such as their names, input / output types and their attributes.

Note that language extensions don't define any behavior. Instead, this is done by the corresponding execution extension.

### Execution extension

An execution extension defines behavior for block types. They build on the meta information from the corresponding language extension, e.g. input / output types of the block need to match the signature of the execution method and attributes are accessed by their specified name.

Execution extensions are only required by the `interpreter` and not necessarily by the `language server` as they solely define behavior.

## Recipes

### Add a new Jayvee extension

#### 1. Generate language and execution libraries

```bash
npx nx g @nrwl/node:library --name="extensions/<extension-name>/lang"
npx nx g @nrwl/node:library --name="extensions/<extension-name>/exec"
```

#### 2. Create extension classes

In `libs/extensions/<extension-name>/lang/src/extension.ts`:

```typescript
import {
  BlockMetaInformationClass,
  JayveeLangExtension,
} from '@jayvee/language-server';

export class MyLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationClass[] {
    return [];
  }
}
```

In `libs/extensions/<extension-name>/exec/src/extension.ts`:

```typescript
import {
  BlockExecutorClass,
  JayveeExecExtension,
} from '@jayvee/execution';

export class MyExecExtension implements JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [];
  }
}
```

#### 3. Export extension classes

In `libs/extensions/<extension-name>/lang/src/index.ts`:

```typescript
export * from './extension';
```

In `libs/extensions/<extension-name>/exec/src/index.ts`:

```typescript
export * from './extension';
```

#### 4. Register new extension classes in the standard extension

In `libs/extensions/std/lang/src/extension.ts`:

```typescript
// ...

import { MyLangExtension } from '@jayvee/extensions/<extension-name>/lang';

export class StdLangExtension implements JayveeLangExtension {
  private readonly wrappedExtensions: JayveeLangExtension[] = [
    // ...
    // Register your language extension here:
    new MyLangExtension(),
    // ...
  ];

  // ...
}
```

In `libs/extensions/std/exec/src/extension.ts`:

```typescript
// ...

import { MyExecExtension } from '@jayvee/extensions/<extension-name>/exec';

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

#### 1. Implement `BlockMetaInformation`

The following example defines a block type called `MyExtractor`. This block type, for instance, takes no input and outputs a sheet. Furthermore, it defines two attributes:

- `url` of type string
- `limit` of type integer and default value `10`
  - Considered optional due to the specified default value

In `libs/extensions/<extension-name>/lang/src/lib/my-extractor-meta-inf.ts`:

```typescript
import {
  AttributeType,
  BlockMetaInformation,
  IOType,
} from '@jayvee/language-server';

export class MyExtractorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'MyExtractor',

      // Input type:
      IOType.UNDEFINED,

      // Output type:
      IOType.SHEET,

      // Attribute definitions:
      {
        url: {
          type: AttributeType.STRING,
        },
        limit: {
          type: AttributeType.INT,
          defaultValue: 10,
        },
      }
    );
  }
}
```

> **Note**
> Use `IOType.UNDEFINED` whenever you expect no input or output:
>
> - Use it as input type if you want to define an extractor
> - Use it as output type if you want to define a loader

#### 2. Register the new `BlockMetaInformation` in the language extension

In `libs/extensions/<extension-name>/lang/src/extension.ts`:

```typescript
// ...

import { MyExtractorMetaInformation } from './lib/my-extractor-meta-inf';

export class MyLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationClass[] {
    return [
      // ...
      // Register your meta information here:
      MyExtractorMetaInformation,
      // ...
    ];
  }
}
```

#### 3. Implement `BlockExecutor`
warn
The following example implements an executor for the previously defined block type `MyExtractor`.

The `execute` method defines the behavior when a block is executed. Its signature matches the input and output types defined in `MyExtractorMetaInformation`.

In `libs/extensions/<extension-name>/exec/src/lib/my-extractor-executor.ts`:

```typescript
import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

export class MyExtractorExecutor extends BlockExecutor<void, Sheet> {
  constructor() {
    // Needs to match the name in meta information:
    super('MyExtractor');
  }

  override async execute(): Promise<R.Result<Sheet>> {
    // Accessing attribute values by their name:
    const url = this.getStringAttributeValue('url');
    const limit = this.getIntAttributeValue('limit');
    
    // ...

    if (error) {
      return R.err(...);
    }

    return R.ok(...);
  }
}
```

> **Warning**
> The generic types of `BlockExecutor<I,O>` need to match the input and output types of the corresponding `BlockMetaInformation`.
>
> - E.g. use `undefined` or `void` for `IOType.UNDEFINED`, `Sheet` for `IOType.SHEET` and so on
> - For other types, see `libs/execution/src/lib/types/io-types`.
>
> Be careful, as there is currently no mechanism to detect such potential mismatches.

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

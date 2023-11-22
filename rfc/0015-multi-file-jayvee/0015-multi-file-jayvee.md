<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0015: Multi-file Jayvee

|             |                 |
| ----------- | --------------- | --------------------------------------------------------------- |
| Feature Tag | `multi-file`    |
| Status      | `DISCUSSION`    | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED --> |
| Responsible | `georg-schwarz` | <!-- TODO: assign yourself as main driver of this RFC -->       |

<!--
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary

This RFC introduces the possibility of distributing a Jayvee program over multiple files.
This feature will foster reuse of valuetypes, blocks, and other elements.
Inherent to this feature is a concept of how scoping and naming is handled for nested structures.
This RFC introduces two concepts:

- Element usage from other files, and
- Libraries

## Motivation

Right now, Jayvee users can only pack their whole Jayvee model into one file.
The challenge is two-fold:

1. Larger projects will become unmaintainable quite quickly, as the elements cannot be organized into multiple files.
2. Without distribution to multiple files, there is no possibility to reuse models of other projects.

For example, users will be enable to build libraries of valuetypes that can be reused across multiple projects instead of copying the code.

## Explanation

### Publishing elements for usage elsewhere (within the project)

For publishing single elements, the RFC introduces the keyword `publish`.
All elements within a file are not published per default.
Explicitly declaring an element as published allows for usage elsewhere.

**Example publish**

```
publish valuetype MyValueType {
  // ... details
}
```

### Bundling elements to a library for usage elsewhere (outside of the project)

For bundling and publishing elements, the RFC introduces a new concept called `libraries`.
A `library` can inhibit `Valuetype`s, `Block`s, `BlockType`s, `Constraint`s, and `Transform`s.
A library is published per default.
All elements within a library have to use the `publish` keyword.

**Example library**

```
library MyDomainLibrary {
  // definition of a new valuetype as part of the library
  publish valuetype MyDomainSpecificValuetype1 {
    // ... details of valuetype
  }

  // reference to an existing valuetype to make it part of the library
  publish MyDomainSpecificValuetype2;

  // ... possibly more elements
}
```

### Visibility of elements in a file

By introducing the concept of `libraries`, most elements can be defined on three levels in a Jayvee file:

1. On the root level of the file
2. Within a pipeline
3. (new) Within a library

The name of an element is given by its definition.
The **qualified name** is constructed by prepending container structures in this pattern: `<container name>.<element name>`, e.g., `MyDomainLibrary.MyDomainSpecificValuetype1`.

**Access paths:**

- root level elements can access
  - root level elements by their name
  - and elements of libraries by their qualified name
- elements within a library can access
  - root level elements by their name
  - and elements of other libraries by their qualified name
- elements within a pipeline can access
  - root level elements by their name
  - elements within the same pipeline by their name
  - and elements of libraries by their qualified name

**No-access paths:**

- elements within a pipeline cannot be referenced by outside elements

**Used elements of different files are handled as if they were defined at the root level.**

### Using elements

Only `publish`ed elements can be used in other files.

#### Usage paths

When using elements of a file or a library, we have to define where the elements are located.
Jayvee provides the following possibilities:

- a relative file path, e.g., `from './path/to/file.jv' use *;`
- an HTTP URL, e.g., `from 'https://jvalue.com/my-org/my-repo' use *;`

#### Using published elements of a file (within the same project)

```
from './path/to/location.jv' use *; // use all published elements from the file, access via qualified name as if it would be defined at the root level
from './path/to/location.jv' use { MyDomainSpecificValuetype1 }; // only use the published elements from the file, access via qualified name as if it would be defined at the root level
from './path/to/location.jv' use { MyDomainSpecificValuetype1 called Vt1} // only use the published elements from the file, access via qualified name using the alias
```

References to these used elements is by their qualified name (unless altered by an alias).

#### Using a library (from outside of the project)

The `use` syntax is similar to importing an element of a file.
Libraries can only be used as a whole.

```
from './path/to/location.jv' use { MyDomainLibrary }; // only use the named library, access via qualified name
from './path/to/location.jv' use {
  MyDomainLibrary1,
  MyDomainLibrary1
}; // only use the named libraries, access via qualified name
from './path/to/location.jv' use { MyDomainLibrary called MyLibraryAlias} // only use the named library, access via qualified name using the alias
```

References to these used elements is by their qualified name (unless altered by an alias).

## Drawbacks

- Two different sharing mechanisms (`publish` keyword, `library` concept`)
- Elements of a pipeline cannot be reused, leading to potentially more slim pipelines and a parallel library
- The elements of a library within a file always need the qualified name (alternative: allow access via sole name within file?)
- The RFC does not allow re-publishing (only by putting elements into a containing library)
- Langium might not support this scoping mechanism out-of-the-box (more complex implementation)

## Alternatives

- "use" syntax without braces, etc., `from './path/to/file.jv' use MyDomainLibrary1, MyDomainLibrary2`
- different syntax for using files and libraries (e.g., `import`)
- Rather call it `module` instead of `library`

## Possible Future Changes/Enhancements

- build out to use libraries of other projects via a package-manager mechanism, e.g., by using an URL as location of a "use" statement
- allow "using" single elements of a library instead of "using" the whole library
- allow additional usage paths, like
  - absolute file paths, and
  - org/repo combination at a central package registry, e.g., `from 'jv:my-org/my-repo' use *;`

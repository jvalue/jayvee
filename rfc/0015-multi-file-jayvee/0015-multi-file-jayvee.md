<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0015: Multi-file Jayvee

|             |                 |
| ----------- | --------------- | --------------------------------------------------------------- |
| Feature Tag | `multi-file`    |
| Status      | `DRAFT`         | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED --> |
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

## Motivation

Right now, Jayvee users can only pack their whole Jayvee model into one file.
The challenge is two-fold:

1. Larger projects will become unmaintainable quite quickly, as the elements cannot be organized into multiple files.
2. Without distribution to multiple files, there is no possibility to reuse models of other projects.

For example, we might be enable to build libraries of valuetypes that can be reused across multiple projects instead of copying the code.

## Explanation

### Exporting elements

For exporting elements, I propose introducing a new concept called `libraries` instead of explicitly modeling an import or export per element.
A `library` can inhibit `Valuetype`s, `Block`s, `BlockType`s, `Constraint`s, and `Transform`s.

**Example library**

```
library MyDomainLibrary {
  valuetype MyDomainSpecificValuetype {
    // ... details of valuetype
  }

  // ... possibly more elements
}
```

Libraries are always "exported" and can be "imported" into other files.

### Visibility of elements in a file

By introducing the concept of `libraries`, most elements can be defined on three levels in a Jayvee file:

1. On the root level of the file
2. Within a pipeline
3. (new) Within a library

The name of an element is given by its definition.
The **qualified name** is constructed by prepending container structures in this pattern: `<container name>.<element name>`, e.g., `MyDomainLibraryMyDomainLibrary.MyDomainSpecificValuetype`.

**Access paths:**

- root level elements can access
  - root level elements by their name
  - and elements of libraries by their qualified name
- elements within a library can access
  - elements within the same library by their name
  - and elements of other libraries by their qualified name
- elements within a pipeline can access
  - root level elements by their name
  - elements within the same pipeline by their name
  - and elements of libraries by their qualified name

**No-access paths:**

- elements within a pipeline cannot be referenced by outside elements
- elements within a library cannot access anything outside a library (the same or a different library)

### Importing elements

Only `libraries` and their elements can be imported into other files.
Elements on the root level of a file or within a pipeline cannot be imported.

```
from './path/to/location.jv' use { MyDomainLibrary }; // only imports the named library, access via qualified name
from './path/to/location.jv' use { MyDomainLibrary1, MyDomainLibrary1 }; // only imports the named libraries, access via qualified name
from './path/to/location.jv' use { MyDomainLibrary called MyLibraryAlias} // only imports the named library, access via qualified name using the alias
```

References to these imported elements is by their qualified name (unless altered by an alias).

## Drawbacks

- Implicit knowledge required: elements in libraries are exported
- Elements of a pipeline cannot be reused, leading to potentially more slim pipelines and a parallel library
- The elements of a library within a file always need the qualified name (alternative: allow access via sole name within file?)
- We do not allow re-exporting (only by putting elements into a containing library)
- Langium might not support this scoping mechanism out-of-the-box (more complex implementation)

## Alternatives

- Make exports explicit instead of introducing the concept of libraries
- Make exports explicit besides introducing the concept of libraries
- "use" syntax without braces, etc., `from './path/to/file.jv' use MyDomainLibrary1, MyDomainLibrary2`

## Possible Future Changes/Enhancements

- build out to use libraries of other projects via a package-manager mechanism, e.g., by using an URL as location of a "use" statement
- allow "using" single elements of a library instead of "using" the whole library

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
We introduce two concepts in this RFC:

- File imports, and
- Libraries

## Motivation

Right now, Jayvee users can only pack their whole Jayvee model into one file.
The challenge is two-fold:

1. Larger projects will become unmaintainable quite quickly, as the elements cannot be organized into multiple files.
2. Without distribution to multiple files, there is no possibility to reuse models of other projects.

For example, we might be enable to build libraries of valuetypes that can be reused across multiple projects instead of copying the code.

## Explanation

### Exporting elements for later import

For exporting single elements, I propose to introduce a new keyword `export`.
All elements within a file are not exportable per default.
Explicitly declaring an element as exportable allows for later import.

**Example export**

```
export valuetype MyValueType {
  // ... details
}
```

### Bundling elements to a library for later import

For bundling and exporting elements, I propose introducing a new concept called `libraries`.
A `library` can inhibit `Valuetype`s, `Block`s, `BlockType`s, `Constraint`s, and `Transform`s.
A library has to define a version in semver syntax.
A library has to be exported.
They serve as entry point to a collection of files (local or remote), similarly to JavaScript's `index.js` mechanism.

**Example library**

```
export library MyDomainLibrary version 1.2.3 {
  // definition of a new valuetype as part of the library
  valuetype MyDomainSpecificValuetype1 {
    // ... details of valuetype
  }

  // reference to an existing valuetype to make it part of the library
  include MyDomainSpecificValuetype2;

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

**Imported elements are handled as if they were defined at the root level.**

### Importing elements

Only `export`ed elements can be imported into other files.

#### Importing exported elements of a file

```
from './path/to/location.jv' use { MyDomainSpecificValuetype1 }; // only imports the defined elements from the file, access via qualified name as if it would be defined at the root level
from './path/to/location.jv' use { MyDomainSpecificValuetype1 called Vt1} // only imports the defined elements from the file, access via qualified name using the alias
```

References to these imported elements is by their qualified name (unless altered by an alias).

#### Importing a library

Each import explicitly defines the version of the imported library.
On version mismatch, an error is raised.
Libraries can only be imported as a whole.

```
from './path/to/location.jv' use { MyDomainLibrary version 1.2.3 }; // only imports the named library, access via qualified name
from './path/to/location.jv' use {
  MyDomainLibrary1 version 1.2.3,
  MyDomainLibrary1 version 1.2.3
}; // only imports the named libraries, access via qualified name
from './path/to/location.jv' use { MyDomainLibrary version 1.2.3 called MyLibraryAlias} // only imports the named library, access via qualified name using the alias
```

References to these imported elements is by their qualified name (unless altered by an alias).

## Drawbacks

- Two different sharing mechanisms (export keyword, library)
- Elements of a pipeline cannot be reused, leading to potentially more slim pipelines and a parallel library
- The elements of a library within a file always need the qualified name (alternative: allow access via sole name within file?)
- We do not allow re-exporting (only by putting elements into a containing library)
- Langium might not support this scoping mechanism out-of-the-box (more complex implementation)

## Alternatives

- "use" syntax without braces, etc., `from './path/to/file.jv' use MyDomainLibrary1, MyDomainLibrary2`
- different syntax for importing files and libraries
- Rather call it `module` instead of `library`

## Possible Future Changes/Enhancements

- build out to use libraries of other projects via a package-manager mechanism, e.g., by using an URL as location of a "use" statement
- allow "using" single elements of a library instead of "using" the whole library

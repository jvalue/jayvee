<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0015: Multi-file Jayvee

|             |                 |
| ----------- | --------------- | --------------------------------------------------------------- |
| Feature Tag | `multi-file`    |
| Status      | `ACCEPTED`      | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED --> |
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
- Packages

## Motivation

Right now, Jayvee users can only pack their whole Jayvee model into one file.
The challenge is two-fold:

1. Larger projects will become unmaintainable quite quickly, as the elements cannot be organized into multiple files.
2. Without distribution to multiple files, there is no possibility to later reuse models of other projects.

## Explanation

### Element visibility

We distinguish different kinds of visibilities of elements:

- `file-private`: usable only within the same file
- `file-published`: usable also in other files of same project
- `package-private`: usable only within the package
- `package-published`: usable also in other locations (since `package` is always `file-published`)

By introducing the concept of `packages`, most elements can be defined on three scope levels in a Jayvee file:

1. file-scope (not contained in a further structure, like a pipeline or a package)
2. pipeline-scope (contained in a pipeline)
3. (new) package-scope (contained in a package)

The name of an element is given by its definition.
The **qualified name** is constructed by prepending container structures in this pattern: `<container name>.<element name>`, e.g., `MyDomainPackage.MyDomainSpecificValuetype`.

**Access paths:**

- _file-scope_ elements can access
  - &#9989; _file-scope_ elements by their name
  - &#9989; _package-scope_ elements by their qualified name (`packageName.elementName`)
  - &#10060; no _pipeline-scope_ elements
- _package-scope_ elements can access
  - &#9989; _file-scope_ elements by their name
  - &#9989; elements of the same _package-scope_ by their name
  - &#9989; elements of another _package-scope_ by their qualified name
  - &#10060; no _pipeline-scope_ elements
- _pipeline-scope_ elements can access
  - &#9989; _file-scope_ elements by their name
  - &#9989; elements within the same _pipeline-scope_ by their name
  - &#10060; no elements of another _pipeline-scope_
  - &#9989; _package-scope_ elements by their qualified name

**Used elements** of different files are handled **as if they were defined at file scope level**.

### Publishing elements for usage elsewhere (within the project)

For publishing single elements, the RFC introduces the keyword `publish` to indicate the visibility `file-published`.
All elements within a file are not published per default, visibility `file-private`.
Explicitly declaring an element as published allows for usage elsewhere.

**Example publish**

```
// define and publish in one syntax
publish valuetype MyValueType1 {
  // ... details
}

// define first
valuetype MyValueType2 {
  // ... details
}

// publish later
publish MyValueType2;

// publish later under a different name
publish MyValueType2 as MyValueType3;
```

### Packages: bundling elements to a package for decoupled usage

For bundling and publishing elements, the RFC introduces a new concept called `packages`.
A `package` can include `Valuetype`s, `Block`s, `BlockType`s, `Constraint`s, `Transform`s, and further `Package`s.
A package must be of visibility `file-published` and, thus, requires the keyword `publish`.
Elements within a package can be of visibility `package-published` by using the `publish` keyword, or are `package-private` per default.
`package`s within `package`s must be `publish`ed as a consequence.

**Example package**

```
publish package MyDomainPackage {
  // definition of a new valuetype as part of the package
  publish valuetype MyDomainSpecificValuetype1 {
    // ... details of valuetype
  }

  // reference to an existing valuetype to make it part of the package
  publish MyDomainSpecificValuetype2;

  // ... possibly more elements
}
```

The advantage of bundling elements into a `package` is the decoupling from the internal file system structure and logically grouping related elements into one namespace.
Rather than accessing files directly (and needing knowledge what is element is located in which files) users can simply use a whole package with all its elements (and don't need to know in which file the element is originally defined).

### Using elements

Only `file-published` (with keyword `publish`) elements can be `use`d in other files.

#### Usage paths

When using elements of a file or a package, we have to define where the elements are located.
Jayvee provides the following possibilities:

- a relative file path, e.g., `use * from './path/to/file.jv';`

The `use` of elements via a file path decouples from the file system structure by using the element name or a defined alias instead of the file path within the file.

#### Using published elements of a file (within the same project)

```
use * from './path/to/location.jv'; // use all published elements from the file, access via qualified name as if it would be defined at the _file-scope_
use * as MyWrappingNamespace from './path/to/location.jv'; // use all published elements from the file, access via qualified name as if it was defined in an artificial _package-scope_ (adding a prefix to the qualified name)
use { MyDomainSpecificValuetype1 } from './path/to/location.jv'; // only use the published elements from the file, access via qualified name as if it would be defined at the _file-scope_
use { MyDomainSpecificValuetype1 as Vt1} from './path/to/location.jv'; // only use the published elements from the file, access via qualified name using the alias
```

References to these used elements is by their qualified name (unless altered by an alias).

#### Using a package

The `use` syntax is similar to importing an element of a file.
Packages can only be used as a whole.

```
use { MyDomainPackage } from './path/to/location.jv'; // only use the named package, access via qualified name
use {
  MyDomainPackage1,
  MyDomainPackage2
} from './path/to/location.jv'; // only use the named packages, access via qualified name
use { MyDomainPackage as MyPackageAlias} from './path/to/location.jv'; // only use the named package, access via qualified name using the alias
```

References to these used elements is by their qualified name (unless altered by an alias).

## Decision rationale

- keywords `publish` and `use` over `export` and `import` since they are less technical and better understandable for subject-matter experts
- concept of "namespaces" is separate from publishing them for reuse in other projects (this RFC only introduces the concept of "namespaces" by the keyword `package`)

## Drawbacks

- Two different sharing mechanisms (`publish` keyword, `package` concept`)
- Elements of a pipeline cannot be reused, leading to potentially more slim pipelines and a parallel package
- Langium might not support this scoping mechanism out-of-the-box (more complex implementation)

## Alternatives

- "use" syntax without braces, etc., `use MyDomainPackage1, MyDomainPackage2 from './path/to/file.jv';`
- switch around `use` and `from`: `from 'location' use { Element };`
- different keyword for publishing files and packages (e.g., `export`)
- different keyword for using files and packages (e.g., `import`)
- different keyword for renaming published / used elements (e.g., `called`)
- Rather call it `module` or `component` instead of `package`

## Possible Future Changes/Enhancements

- build out to use packages of other projects via a package-manager mechanism, e.g., by using an URL as location of a "use" statement
  - alternative: introduce new concept `library`
- allow "using" single elements of a package instead of "using" the whole package
- allow additional usage paths, like
  - absolute file paths, and
  - org/repo combination at a central package registry, e.g., `use * from 'jv:my-org/my-repo';`

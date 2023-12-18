<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0016: Instances vs Types

| | |
|---|---|
| Feature Tag | `instances-vs-types` |
| Status | `DISCUSSION` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `@rhazn` |
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary
Following the [Design Principles](https://jvalue.github.io/jayvee/docs/dev/design-principles), Jayvee focuses on describing a goal state instead of how to get there. That can lead to confusion about what is an object (instance of) vs. what is a type (definition of). 

This RFC introduces a structure change that separates definitions from instantiation by moving definitions out of pipelines.

## Motivation
It is unclear what is an object (instance of) vs. what is a type (definition of) in Jayvee right now. With a small structure change, this confusion can be reduced while also providing positive side effects.

## Explanation
The following explanations use blocks as an example but map directly to **Constraints** and **Valuetypes**. That is, constraints and valuetypes can also only be **defined** outside of pipelines and are valuetypes are **instantiated** inside of pipelines (constraints are only instantiated as part of valuetypes).

### Current state
Pipelines can contain nearly any code (minimal cars example):
```
pipeline CarsPipeline {
	CarsCSVExtractor 
    -> CarsTableInterpreter
		-> CarsLoader;

	block CarsCSVExtractor oftype CSVExtractor {
		url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
    enclosing: '"';
	}
	block CarsTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"mpg" oftype decimal,
			"cyl" oftype integer,
			"disp" oftype decimal,
		];
	}
	block CarsLoader oftype SQLiteLoader {
		table: "Cars";
		file: "./cars.sqlite";
	}
}
```

All block definitions (`block ... oftype ...`) are **definitions** of e.g., datasources or transformations (e.g. the `block CarsCSVExtractor oftype CSVExtractor` with all defined properties is a definition of the CSV file as a datasource).

Instantiation happens only implicitly when a block reference is used in a pipeline, e.g. `CarsCSVExtractor -> CarsTableInterpreter` **instantiates** one instance of the `CarsCSVExtractor` during runtime. One block **definition** can be **instantiated** this way mutliple times in one pipeline.

### Proposed change

Allow **definitions** only outside of pipelines, allow block **instantiations** only inside of pipelines.

Because pipelines get executed implicitly when executing a Jayvee model (and therefore pipelines get **instantiated** during runtime), it makes sense to bundle all other instantiations in them as well. This means everything outside of a pipeline is a **definition** (**type**), everything inside a pipeline is an **instance**.

New syntax (minimal cars example):
```
// Pipeline containing block instantiations
pipeline CarsPipeline {
	CarsCSVExtractor 
    -> CarsTableInterpreter
		-> CarsLoader;
}

// Block definitions outside of pipeline
block CarsCSVExtractor oftype CSVExtractor {
  url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
  enclosing: '"';
}
block CarsTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "mpg" oftype decimal,
    "cyl" oftype integer,
    "disp" oftype decimal,
  ];
}
block CarsLoader oftype SQLiteLoader {
  table: "Cars";
  file: "./cars.sqlite";
}
```

Composite blocks are a special case that use pipeline sytnax to chain blocks but are not implicitly instantiated like pipelines if a model is executed. For the scope of this RFC, chaining pipeline syntax should **stay possible in pipelines and composite blocks** while **composite blocks are also be able to contain block definitions**. In a future enhancement (see Possible Future Changes/Enhancements), this should be split up with the introduction of packages (ref [RFC0015](../0015-multi-file-jayvee/0015-multi-file-jayvee.md)).

### Additional upsides
Defining blocks only outside a pipeline also means we can reuse them across many pipelines. This has a positive side effect on blocks of types without non-default properties, such as the `TextFileInterpreter`. Before, any pipeline needed to define these blocks before it could instantiate them, leading to very verbose code.

With this change, one definition of a generic `TextFileInterpreter` (e.g., `block StandardTextFileInterpreter oftype TextFileInterpreter { }`) outside of a pipeline can be reused in multiple pipelines. 

The standard library can include standard definitions of these blocks that can be used in pipelines without requiring users to define them beforehand.

As part of this RFC, we add the following blocks to the standard library:

```
block StandardTextFileInterpreter oftype TextFileInterpreter { }
block StandardCSVInterpreter oftype CSVInterpreter { }
block StandardXLSXInterpreter oftype XLSXInterpreter { }
```

## Drawbacks
- This change introduces more structure for blocks but pipelines are still confusing, see Alternatives
- With additional enforced structure, users loose flexibility to define things where they want

## Alternatives
- Introduce explicit execution calls like `pipeline.execute();` or `instantiate <pipeline name>;`/`run <pipeline name>;` instead of implicitly executing pipelines
  - Decided against because Jayvee is purely descriptive right now outside of expressions
- Change the `block` keyword to `blockdefinition` or `blocktype` (and change `blocktype` to `blocktypetype`)
  - Decided against because `block` is more intuitive for actual language users (especially compared to `blocktype` with `blocktypetype`)
- Only document that the pipe syntax means instantiation and everything else is a definition
  - decided against to follow "Explicit modeling over hidden magic" principle

## Possible Future Changes/Enhancements
- After implementing [RFC0015](../0015-multi-file-jayvee/0015-multi-file-jayvee.md), reconsider disallowing block definitions in composite blocks and instead enforce only chained pipelines in composite blocks and distribute them and their block definitions using packages instead.

# RFC 0005: Syntactic sugar for pipes

|             |                         |
| ----------- | ----------------------- |
| Feature Tag | `pipes-syntactic-sugar` |
| Status      | `DRAFT`                 |
| Responsible | @rhazn                  |

# Summary
Two different forms of syntactic sugar to express pipes are suggested.
First, to support an overview of the whole pipeline, a shortened form of the current approach (`Block1 -> Block2`).
Second, to support describing pipes as part of a block:
```jayvee
block Block1 {
  inputs: [Block2];
  outputs: [Block3];
}
```


# Motivation
Pipes are modelled explicitly and separately of blocks. This theoretically allows the definition of a data pipeline in one place, by connecting previously desribed blocks. Shortened syntax would allow this overview to be more intuitively readable.

Additionally, it is natural to think about the concrete inputs and outputs of blocks while describing them as part of a data pipeline model. By allowing pipes to be defined with the blocks that they connect this model of thinking is supported.

# Explanation
To illustrate the syntactic sugar changes, the current cars data pipeline model will be used as running example. Some irrelevant column definitions have been removed to reduce the number of lines.

## Running example: Current Cars Pipeline
```jayvee
pipeline CarsPipeline {
  block CarsExtractor oftype CSVFileExtractor {
    url: "https://gist.githubusercontent.com/noamross/e5e10b/raw/b9/cars.csv";
  }

  pipe {
    from: CarsExtractor;
    to: CarColumnNameWriter;
  }

  block CarColumnNameWriter oftype CellWriter {
    at: cell A1;
    write: "name";
  }

  pipe {
      from: CarColumnNameWriter;
      to: CarsValidator;
  }

  layout CarsLayout {
    header row 1: text;

    column A: text;
    column B: decimal;
    column C: integer;
  }

  block CarsValidator oftype LayoutValidator {
    validationLayout: CarsLayout;
  }

  pipe {
    from: CarsValidator;
    to: CarsLoader;
  }

  block CarsLoader oftype SQLiteLoader {
    table: "Cars";
    file: "./cars.db";
  }
}
```

## Suggestion 1: Arrow syntax
The arrow syntax shortens the definition of a pipe and allows multiple pipes to be chained. It enables users to define the structure of their pipeline from previously defined blocks. The syntax is short and intuitively looks like a pipeline.

In the most basic form, any definition of a pipe is just replaced with an arrow `->` between the `from` and `to` attributes:

```jayvee
pipe {
  from: CarsExtractor;
  to: CarColumnNameWriter;
}
```

is equivalent to

```jayvee
CarsExtractor -> CarColumnNameWriter;
```

Additionally, pipelines defined with the arrow syntax can be chained. Consider any `->` as a pipeline definition, parse the left side of the arrow expression to be the `from` attribute and the right side the `to` attribute.

```jayvee
pipe {
  from: CarsExtractor;
  to: CarColumnNameWriter;
}

pipe {
    from: CarColumnNameWriter;
    to: CarsValidator;
}
```

is equivalent to

```jayvee
CarsExtractor
  -> CarColumnNameWriter
  -> CarsValidator;
```

This syntax shortens the running example to the following, making it much more easy to read how the resulting pipeline will look.

```jayvee
pipeline CarsPipeline {
  block CarsExtractor oftype CSVFileExtractor {
    url: "https://gist.githubusercontent.com/noamross/e5e10b/raw/b9/cars.csv";
  }
  
  block CarColumnNameWriter oftype CellWriter {
    at: cell A1;
    write: "name";
  }

  layout CarsLayout {
    header row 1: text;

    column A: text;
    column B: decimal;
    column C: integer;
  }

  block CarsValidator oftype LayoutValidator {
    validationLayout: CarsLayout;
  }

  block CarsLoader oftype SQLiteLoader {
    table: "Cars";
    file: "./cars.db";
  }

  CarsExtractor
    -> CarColumnNameWriter
    -> CarsValidator
    -> CarsLoader;
}
```

## Suggestion 2: Declaration in blocks
It is natural to think of the inputs and outputs of blocks while writing a Jayvee model. However, with the current pipeline syntax, the definition of blocks and the definition of the pipeline structure are separated.

We consider blocks to have inputs and outputs (and allow multiple of both). By allowing pipes to be defined as part of a block, users can more naturally write a pipeline "from start to finish" by describing blocks one after the other and referencing previous blocks as inputs.

This suggestion reuses the existing grammer for block attributes and collections instead of introducing new syntax inside of blocks.

```jayvee
pipeline CarsPipeline {
  block CarsExtractor oftype CSVFileExtractor {
    url: "https://gist.githubusercontent.com/noamross/e5e10b/raw/b9/cars.csv";
  }
  
  block CarColumnNameWriter oftype CellWriter {
    inputs: [CarsExtractor];
    at: cell A1;
    write: "name";
  }

  layout CarsLayout {
    header row 1: text;

    column A: text;
    column B: decimal;
    column C: integer;
  }

  block CarsValidator oftype LayoutValidator {
    inputs: [CarColumnNameWriter];
    validationLayout: CarsLayout;
  }

  block CarsLoader oftype SQLiteLoader {
    inputs: [CarsValidator];
    table: "Cars";
    file: "./cars.db";
  }
}
```

# Drawbacks
- Setting inputs/outputs attributes on blocks could be confusing
  - they are technically not attributes of the block but instantiate pipes
  - pipe definitions could be in multiple places (inside of blocks and in a separate location in arrow syntax)

# Alternatives
- do not use inputs/outputs syntax at all
- introduce new syntax for inputs/outputs that does not resemble block attributes
- use different arrow syntax `=>`, `-->` ...
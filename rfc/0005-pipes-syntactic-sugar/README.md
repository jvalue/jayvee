<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0005: Syntactic sugar for pipes

|             |                         |
| ----------- | ----------------------- |
| Feature Tag | `pipes-syntactic-sugar` |
| Status      | `ACCEPTED`              |
| Responsible | @rhazn                  |

# Summary
Syntactic sugar to express pipes is suggested to support an overview of the whole pipeline. The added syntax is a shortened form of the existing approach: (`Block1 -> Block2`).


# Motivation
Pipes are modelled explicitly and separately of blocks. This theoretically allows the definition of a data pipeline in one place, by connecting previously desribed blocks. Shortened syntax would allow this overview to be more intuitively readable.

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

## Suggestion: Arrow syntax
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

# Drawbacks
- Adding syntactic sugar adds new concepts for users to learn

# Alternatives
- Use different arrow syntax `=>`, `-->` ...
- Move pipeline definitions into blocks instead of to a separate part of a jv model
  - Would allow IDEs to offer hints based on inputs, e.g., by suggesting column names that have been defined in an input block for tabular data
  - Instead of having an overview of the pipeline structure in one place, would move more context to the specific block a user is defining which might be more intuitive for simple pipelines

# Possible Future Changes/Enhancements
- Introduce syntax for blocks without a name and allow to use them as `from` and `to` attributes for pipes in arrow syntax
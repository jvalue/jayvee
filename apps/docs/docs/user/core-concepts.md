---
sidebar_position: 2
---

# Core Concepts

The core concepts of Jayvee are `Pipelines`, `Blocks`, and `ValueTypes`.

## Pipelines

A `Pipeline` is a sequence of different computing steps, the `Blocks`. The default output of a block becomes the default input of the next block, building a chain of computing steps. In the scope of a `Pipeline`, you can connect these blocks via the `pipe` syntax:

```javascript
pipeline CarsPipeline {
    // Assumption: blocks "GasReserveHttpExtractor", "GasReserveCSVInterpreter", "GasReserveTableInterpreter", and "GasReserveLoader" are defined

    GasReserveHttpExtractor
		-> GasReserveTextFileInterpreter
		-> GasReserveCSVInterpreter
		-> GasReserveTableInterpreter
		-> GasReserveLoader;
}
```

Alternatively, you can use a slightly longer syntax for pipes:

```javascript
pipeline CarsPipeline {
    // Assumption: blocks "GasReserveHttpExtractor", "GasReserveCSVInterpreter", "GasReserveTableInterpreter", and "GasReserveLoader" are defined

    pipe {
        from: GasReserveHttpExtractor;
        to: GasReserveTextFileInterpreter;

    }

    pipe {
        from: GasReserveTextFileInterpreter;
        to: GasReserveCSVInterpreter;

    }

    // etc.
}
```


## Blocks

A `Block` is a processing step within a `Pipeline`. It can have a default input and a default output. We differentiate the following types of `Blocks`:
- `ExtractorBlocks` do not have a default input but only a default output. They model a **data source**.
- `TransformatorBlocks` have a default input and a default output. They model a **transformation**.
- `LoaderBlocks` do have a default input but nor a default output. They model a **data sink**.

The general structure of a `Pipeline` consisting of different blocks is the following:
```mermaid
flowchart LR
    A[ExtractorBlock] --> B(TransformatorBlock)
    B --> C(TransformatorBlock)
    C --> D(LoaderBlock)
```

The common syntax of blocks is at its core a key-value map to provide configuration to the block. The availability of property keys and their respective `ValueTypes` is determined by the type of the `Block` - indicated by the identifier after the keyword `oftype`:

```javascript
block GasReserveHttpExtractor oftype HttpExtractor {
    // key: value
    url: "https://www.bundesnetzagentur.de/_tools/SVG/js2/_functions/csv_export.html?view=renderCSV&id=1089590";
} 
```


## ValueTypes

A `ValueType` is the definition of a data type of the processed data. Some `Blocks` use `ValueTypes` to define logic (like filtering or assessing the data type in a data sink). We differentiate the following types of `ValueTypes`:
- `Built-in ValueTypes` come with the basic version of Jayvee. Currently `text`, `decimal`, `integer`, and `boolean` are supported.
- `Primitive ValueTypes` can be defined by the user to model domain-specific data types and represent a single value. `Constraints` can be added to the `Primitive ValueType` (see below).
- `Compound ValueTypes`: UPCOMING.


### Constraints

`Constraints` of `ValueTypes` declare the validity criteria that each concrete value is checked against. The syntax of `Constraints` is similar to the syntax of `Blocks`. The availability of property keys and their respective `ValueTypes` is determined by the type of the `Constraint` - indicated by the identifier after the keyword `oftype`:

```javascript
constraint GasFillLevelRange oftype RangeConstraint {
    lowerBound: 0;
    lowerBoundInclusive: true;
    upperBound: 100;
    upperBoundInclusive: true;
}
```

### Primitive ValueTypes

`Primitive ValueTypes` are collections of constraints that are connected via a logical `AND` relation. The syntax of `Constraints` is similar to the syntax of `Blocks`. The availability of `Constraint` types is determine by the base-type of the `ValeType` - indicated by the identifier after the keyword `oftype`:

```javascript
valuetype GasFillLevel oftype integer {
    constraints: [ GasFillLevelRange ];
}
```
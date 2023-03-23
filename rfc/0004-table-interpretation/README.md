<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

- Feature Name: `table-interpretation`
- Status: `ACCEPTED`

# Summary

The interpretation of sheets as tables shall be simplified and also work with sheets that don't contain a header row.
Therefore, a new block type `TableInterpreter`: `Sheet` ➔ `Table` is introduced which is meant to replace the
current `LayoutValidator` block type and the `layout` language concept.

# Motivation

Currently, a user needs to define a `layout` where columns are selected and given a type and a row is marked as header.
Sheets without header rows cannot be handled. The layout needs to be referenced in a `LayoutValidator` where the types
are validated and the resulting table is output.

When assuming that sheets are present in a CSV-like structure (columns with an optional topmost header row), we are able
to simplify the overall table interpretation because it is clear how columns are arranged and where to find the column
names in the sheet. Even if a sheet exceptionally doesn't have such a proper
structure, [sheet transformation blocks](./0001-cell-ranges.md) can be used to restructure it accordingly.

# Explanation

Sheets that serve as input for `TableInterpreter` are expected to have one of two structures (
either [plain columns](#sheet-with-plain-columns) or [columns with header](#sheet-with-header-row-and-columns)). Users
then are able to describe tables by stating whether a topmost header row is present or not and by assigning names and
types to each column.

For specifying whether a header is present, the attribute `header` of `TableInterpreter` can be either set to `true`
or `false`.

The individual columns of a table are specified in an attribute `columns` where column names are mapped to their type.
In case a header is present, the column names are mapped to the column with a corresponding header (
see [this section](#sheet-with-header-row-and-columns) for further details).

The following two sections show examples for using the `TableInterpreter` and further explain the semantics of the block
when used in different settings.

## Sheet with plain columns

One use case are sheets that have individual columns but no header row:

<img src="https://user-images.githubusercontent.com/51856713/215997813-a193e5b2-3f13-4a0a-9fda-2db00b08be93.png" width="500px">

The following code snippet would be able to create a new table out of the sheet:

```jayvee
block MyTableInterpreter oftype TableInterpreter {
  header: false;
  columns: [
    "col1" typed text,
    "col2" typed integer,
    "col3" typed boolean,
    "col4" typed decimal,
  ]
}
```

The attribute `header: false` indicates that the sheet has no topmost header row, so the column names are taken from the
provided names in the `columns` attribute. There, each entry describes a column by defining its name and its type. Note
that the order of columns matters, as the first entry maps to the first column `A`, the second to `B` and so on.

## Sheet with header row and columns

The other use case are sheets with a topmost header row which contains the name for each column:

<img src="https://user-images.githubusercontent.com/51856713/215997925-b7396cd1-6716-42d9-85b4-dae9c9053d9e.png" width="500px">

The code snippet below would be able to interpret that sheet as a table:

```jayvee
block MyTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "col1" typed text,
    "col2" typed integer,
    "col3" typed boolean,
    "col4" typed decimal,
  ]
}
```

The attribute `header: true` indicates that the sheet has a topmost header row, so the provided names in the `columns`
attribute are mapped to the names in the header. In case a provided name is not present in the header, that column is
omitted. Note that, as a consequence, the order of entries in `columns` does not matter in case there is a header.

The following section presents a concrete example of how names in the header are mapped to column names and how missing
columns are handled.

### GTFS example

This example presents how a GTFS file could be processed using `TableInterpreter`. The specialty is that they contain
headers, but the order of columns is arbitrary and that some columns are considered optional and thus might not be
present.

Consider the following sheet which represents a `trips.txt` GTFS
file ([source](https://developers.google.com/transit/gtfs/examples/gtfs-feed#tripstxt), [reference](https://developers.google.com/transit/gtfs/reference#tripstxt)):

| route_id | service_id | trip_id  | trip_headsign | block_id |
|:--------:|:----------:|:--------:|:-------------:|:--------:|
|  **A**   |   **WE**   | **AWE1** | **Downtown**  |  **1**   |
|  **A**   |   **WE**   | **AWE2** | **Downtown**  |  **2**   |

The following Jayvee code converts the sheet into a table. Note that the order of entries in the `columns` attribute can
be arbitrary:

```jayvee
block MyTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "trip_id" typed text,
    "service_id" typed integer,
    "route_id" typed text,

    // Optional columns:
    "trip_headsign" typed text,
    "trip_short_name" typed text,
    "direction_id" typed integer,
    "block_id" typed text,
    "shape_id" typed text,
    "wheelchair_accessible" typed integer,
    "bikes_allowed": typed integer, 
  ]
}
```

Then this is what the resulting table looks like:

| `text` <br> trip_id | `integer` <br> service_id | `text` <br> route_id | `text` <br> trip_headsign | `text` <br> block_id |
|:-------------------:|:-------------------------:|:--------------------:|:-------------------------:|:--------------------:|
|        AWE1         |            WE             |          A           |         Downtown          |          1           |
|        AWE2         |            WE             |          A           |         Downtown          |          2           |

# Future possibilities

- Ability to auto-generate `TableInterpreter` code by inferring columns from a sheet

# Drawbacks

- The `TableInterpreter` presumes a structure that might not be given
- Different semantics for sheets with and without header rows (e.g. order of columns may matter)

# Alternatives

- Split the `TableInterpreter` into two block types for handling sheets with and without header
- Use previous layout concept instead

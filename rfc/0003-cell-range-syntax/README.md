<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

- Feature Name: `cell-range-syntax`
- Status: `ACCEPTED`

# Summary

Syntax for selecting parts of 2-dimensional data. The selection may be a single cell, a 1-dimensional series of cells or a 2-dimensional subset of cells.

The syntax is inspired by sheet software (i.e. Excel and Google Sheets) where columns are denoted by capital letters and rows by integer indices.

# Motivation

Sheet-like data may contain uninteresting sections we wish to omit and other sections we would like to keep and further process. In order to denote such ranges of interest, we need a dedicated syntax that is easy to learn and intuitive to use.

We call such selections cell ranges and hereby propose their syntax.

# Explanation

The syntax of cell ranges follows the pattern `range <from>:<to>` where `<from>` and `<to>` refer to a particular cell. A particular cell is selected via its column and its row in the sheet. The `*` character can be used to denote the last column or row.

There are also syntactic sugar versions for common cell ranges (i.e. selecting an entire row / column or a particular cell) by using the keywords `row`, `column` or `cell` instead of `range`.

The following sections show some examples for different cell ranges:

## Selecting an entire row

```jayvee
// selecting the entire row 1
range A1:*1
```

sugars to

```jayvee
// selecting the entire row 1
row 1
```

## Selecting an entire column

```jayvee
// selecting the entire column A
range A1:A*
```

sugars to

```jayvee
// selecting the entire column A
column A
```

## Selecting a specific cell

```jayvee
// selecting the cell B2
range B2:B2
```

sugars to

```jayvee
// selecting the cell B2
cell B2
```

## Selecting a 2-dimensional cell range

```jayvee
// selecting the cells from A2 to B4
range A2:B4
```

## Selecting an entire table

```jayvee
// selecting the entire table
range A1:**
```

## Selecting multiple adjacent columns / rows

```jayvee
// selecting the two columns B and C
range B1:C*

// selecting the three rows 4, 5 and 6
range A4:*6
```

## Selecting partial columns / rows

```jayvee
// Selecting column B from row 2 onwards
range B2:B*

// Selecting row 3 from column C onwards
range C3:*3
```

# Drawbacks

- Unable to select multiple non-adjacent cells / rows / columns
- Unable to select cells using regular patterns (e.g. selecting every second row)
- Unable to combine multiple cell ranges to form a new cell range
- Unable to conveniently select cells close to the last row / column (e.g. selecting the second last row)

# Alternatives

- Omit `*` when denoting the last row or column
  - E.g. `A2:A` instead of `A2:A*`

Feature Name: `cell-ranges`

# Summary

Enable reshaping messy sheet-like data into a tabular format.

This is done by specifying a `layout` where cell ranges are specified and given a name. Then, a `TableBuilder` block is able to rearrange those cell ranges to form columns of the table, as well as assigning a type to each column.

# Motivation

Some sheet-like open data is badly structured. For example, see this [example from mobilithek.info](https://mobilithek.info/offers/-655945265921899037) which does not follow the usual CSV pattern (topmost row as header, followed by the actual data).

In order to bring such data into a database-conform format, we need to be able to flexibly restructure data and to omit sections we consider uninteresting.

# Explanation

## Layout

A layout is used to select cell ranges by absolute cell positions in sheet-like data and give those ranges a name. The syntax for selecting cells is similar to the one in sheet software (i.e. integers for rows, capital letters for columns, colon to indicate a range).

### Defining a layout

A layout can either be defied outside a pipeline or within a pipeline using the `layout` keyword. For example:

```jayvee
layout MyLayout {
  // cell ranges...
}
```

In the example above, a layout called `MyLayout` is instantiated. In its body, enclosed by `{` and `}`, its cell ranges are defined.

### Cell ranges in layouts

A cell range consists of a cell selector and a name for the range. The syntax of the selector follows the pattern `from:to` where from and to refer to a particular cell. A particular cell is selected via its column and its row in the sheet. The name of a range can later be used for referring to the cells in that cell range.

There are also syntactic sugar versions for common selections (i.e. selecting an entire row / column or a particular cell).

The following sections show examples featuring the syntax for different selections:

#### Selecting an entire row

```jayvee
// selecting the entire row 1
1:1 called Header;
```

sugars to

```jayvee
// selecting the entire row 1
row 1 called Header;
```

#### Selecting an entire column

```jayvee
// selecting the entire column A
A:A called FirstColumn;
```

sugars to

```jayvee
// selecting the entire column A
column A called FirstColumn;
```

#### Selecting a specific cell

```jayvee
// selecting the cell B2
B2:B2 called MyCell;
```

sugars to

```jayvee
// selecting the cell B2
cell B2 called MyCell;
```

#### Selecting a 2-dimensional cell range

```jayvee
// selecting the cells from A2 to B4
A2:B4 called MyRange;
```

#### Selecting multiple adjacent columns / rows

```jayvee
// selecting the two columns B and C
B:C called TwoColumns;

// selecting the three rows 4, 5 and 6
4:6 called ThreeRows;
```

#### Selecting partial columns / rows

```jayvee
// Selecting column B from row 2 onwards
B2:B called PartialColumn;

// Selecting row 3 from column C onwards
C3:3 called PartialColumn;
```

### Handling overlaps of cell ranges

In general, cell ranges in a layout are evaluated from top to bottom. If a particular cell is selected by a cell range, but is already part of a previous cell range, that cell is not included in the current range. As a consequence, in each layout, a particular cell can only be part of at most a single cell range.

#### Example for a common CSV file layout

```jayvee
layout CommonCSVLayout {
  row 1 called Header;
  column A called ColumnA;
  column B called ColumnB;
  column C called ColumnC;
  // more columns if needed...
}
```

Note that, due to the overlap of `Header` with the column ranges, the columns don't contain the topmost header cells.

## TableBuilder

A `TableBuilder` block is used to convert sheet-like data into a database-conform structure. Therefore, it defines separate columns by giving them a name, specifying their contents and assigning a type to them. The data that shall be contained in a particular column is defined by referring to one or more 1-dimensional cell ranges of a layout. In case multiple cell ranges are specified, their cells are concatenated to form the column.

The block validates that the ranges of the layout fit to the dimensions of the sheet data and that each table column contains an equal number of cells. Additionally, the type of a column is checked for each value in that column.

See the following example:

```jayvee
layout MyLayout {
  column A called MyRange;
  B2:B called MyPartialRange;
  cell C1 called MyCell;
}

block MyTableBuilder oftype TableBuilder {
  sheetLayout: MyLayout;
  columns: {
    "column1": MyRange oftype text;
    "column2": MyPartialRange, MyCell oftype integer;
  }
}
```

The example constructs a table with the two columns `column1` with type `text` and `column2` with type `integer`. `sheetLayout` references the layout `MyLayout` which used for defining the content of the columns. `column1` is filled with the cells of column `A` from the input sheet. `column2` is filled with the cells of column `B`, excluding the topmost cell, and subsequently cell `C1`.

Note that the number of cells in `MyRange` is equal to the combined number of cells in `MyPartialRange` and `MyCell`. The user would receive an error if that was not the case.

# Drawbacks

- Header rows can't be used for column names
- Unable to select cells using regular patterns (e.g. selecting every second row)
- 2-dimensional ranges can be defined but currently serve no purpose
- Unable to combine multiple cell ranges to a new cell range within a layout

# Alternatives

- Optionally allow overlapping ranges or use them by default
- Assign types to cell ranges in layouts
- Omit layout and specify cell ranges directly in `TableBuilder`
- Attach layouts to sheets in `CSVFileExtractor` instead of referring to layouts in `TableBuilder`
- Specify the columns outside the `TableBuilder` block using its own language concept, similar to `layout` for cell ranges; then `TableBuilder` demands a reference to it
- Forbid 2-dimensional ranges (for now)
- Ability to linearize 2-dimensional ranges column- or row-wise
- Usage of `*` (or a different symbol) to indicate "selections until the end", e.g. `B2:B*` instead of `B2:B`

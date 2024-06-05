---
sidebar_position: 9
---

# Cell Range

Cell ranges can be used to select a subset of cells in a 2D data structure, such as a `Sheet`. The syntax for cell ranges follows conventions from spreadsheet-software. Rows are referenced by one-based indices and columns by capitalized characters, ordered alphabetically.

<table>
    <tr>
        <td></td>
        <td>A</td>
        <td>B</td>
        <td>C</td>
    </tr>
    <tr>
        <td>1</td>
        <td class="example-table__highlighted">Cell A1</td>
        <td class="example-table__highlighted">Cell B1</td>
        <td class="example-table__highlighted">Cell C1</td>
    </tr>
    <tr>
        <td>2</td>
        <td class="example-table__highlighted">Cell A2</td>
        <td class="example-table__highlighted">Cell B2</td>
        <td class="example-table__highlighted">Cell C2</td>
    </tr>
    <tr>
        <td>3</td>
        <td class="example-table__highlighted">Cell A3</td>
        <td class="example-table__highlighted">Cell B3</td>
        <td class="example-table__highlighted">Cell C3</td>
    </tr>
</table>

Cell ranges can be expressed as whole rows using the **`row`** keyword, whole columns using the **`column`** keyword and custom ranges using the **`range`** keyword.

## Selecting Custom Ranges

Using the **`range`** keyword, custom ranges can be selected. Ranges must define a start cell and end cell with the syntax `range <start-cell>:<end-cell>`. All cells between these cells are part of the range as if a user had selected the start cell in a spreadsheet-software and dragged the mouse until the end cell. For example `range A1:B2` is a range over four cells, from cell `A1` to `B2`.

Instead of a specific character or integer, the placeholder `*` denotes the last available cell in the row or column. For example: `A*` is the last cell in column `A` and `*2` is the last cell in row `2`.

### Examples
The following `CellRangeSelector` block will select the four cells in the top left corner of a `Sheet`:

<div class="side-by-side__container">

```jayvee
 block ExampleDataSelector oftype CellRangeSelector {
   select: range A1:B2;
 }
```

<table>
    <tr>
        <td></td>
        <td>A</td>
        <td>B</td>
        <td>C</td>
    </tr>
    <tr>
        <td>1</td>
        <td class="example-table__highlighted">Cell A1</td>
        <td class="example-table__highlighted">Cell B1</td>
        <td>Cell C1</td>
    </tr>
    <tr>
        <td>2</td>
        <td class="example-table__highlighted">Cell A2</td>
        <td class="example-table__highlighted">Cell B2</td>
        <td>Cell C2</td>
    </tr>
    <tr>
        <td>3</td>
        <td>Cell A3</td>
        <td>Cell B3</td>
        <td>Cell C3</td>
    </tr>
</table>
</div>

The following `CellRangeSelector` block will select cells from the first to the last cell in row 2 in a `Sheet`:

<div class="side-by-side__container">

```jayvee
 block ExampleDataSelector oftype CellRangeSelector {
   select: range A2:*2;
 }
```

<table>
    <tr>
        <td></td>
        <td>A</td>
        <td>B</td>
        <td>C</td>
    </tr>
    <tr>
        <td>1</td>
        <td>Cell A1</td>
        <td>Cell B1</td>
        <td>Cell C1</td>
    </tr>
    <tr>
        <td>2</td>
        <td class="example-table__highlighted">Cell A2</td>
        <td class="example-table__highlighted">Cell B2</td>
        <td class="example-table__highlighted">Cell C2</td>
    </tr>
    <tr>
        <td>3</td>
        <td>Cell A3</td>
        <td>Cell B3</td>
        <td>Cell C3</td>
    </tr>
</table>
</div>

The following `CellRangeSelector` block will select cells from the top-left most cell to the last cell in column B in a `Sheet`:

<div class="side-by-side__container">

```jayvee
 block ExampleDataSelector oftype CellRangeSelector {
   select: range A1:B*;
 }
```

<table>
    <tr>
        <td></td>
        <td>A</td>
        <td>B</td>
        <td>C</td>
    </tr>
    <tr>
        <td>1</td>
        <td class="example-table__highlighted">Cell A1</td>
        <td class="example-table__highlighted">Cell B1</td>
        <td>Cell C1</td>
    </tr>
    <tr>
        <td>2</td>
        <td class="example-table__highlighted">Cell A2</td>
        <td class="example-table__highlighted">Cell B2</td>
        <td>Cell C2</td>
    </tr>
    <tr>
        <td>3</td>
        <td class="example-table__highlighted">Cell A3</td>
        <td class="example-table__highlighted">Cell B3</td>
        <td>Cell C3</td>
    </tr>
</table>
</div>

## Selecting Rows

Using the **`row`** keyword, individual rows can be selected. For example, `row 2` will select the second row in a `Sheet`. By adding multiple rows to a `Collection<CellRange>`, multiple rows can be selected.

### Examples
The following `RowDeleter` block will delete the first two rows of a `Sheet`:

<div class="side-by-side__container">

```jayvee
 block ExampleRowDeleter oftype RowDeleter {
   delete: [row 1, row 2];
 }
```

<table>
    <tr>
        <td></td>
        <td>A</td>
        <td>B</td>
        <td>C</td>
    </tr>
    <tr>
        <td>1</td>
        <td class="example-table__highlighted">Cell A1</td>
        <td class="example-table__highlighted">Cell B1</td>
        <td class="example-table__highlighted">Cell C1</td>
    </tr>
    <tr>
        <td>2</td>
        <td class="example-table__highlighted">Cell A2</td>
        <td class="example-table__highlighted">Cell B2</td>
        <td class="example-table__highlighted">Cell C2</td>
    </tr>
    <tr>
        <td>3</td>
        <td>Cell A3</td>
        <td>Cell B3</td>
        <td>Cell C3</td>
    </tr>
</table>
</div>

## Selecting Columns

Using the **`column`** keyword, individual columns can be selected. For example, `column 2` will select the second column in a `Sheet`. By adding multiple columns to a `Collection<CellRange>`, multiple columns can be selected.

### Examples
The following `ColumnDeleter` block will delete the first two columns of a `Sheet`:

<div class="side-by-side__container">

```jayvee
 block ExampleColumnDeleter oftype ColumnDeleter {
   delete: [column A, column B];
 }
```

<table>
    <tr>
        <td></td>
        <td>A</td>
        <td>B</td>
        <td>C</td>
    </tr>
    <tr>
        <td>1</td>
        <td class="example-table__highlighted">Cell A1</td>
        <td class="example-table__highlighted">Cell B1</td>
        <td>Cell C1</td>
    </tr>
    <tr>
        <td>2</td>
        <td class="example-table__highlighted">Cell A2</td>
        <td class="example-table__highlighted">Cell B2</td>
        <td>Cell C2</td>
    </tr>
    <tr>
        <td>3</td>
        <td class="example-table__highlighted">Cell A3</td>
        <td class="example-table__highlighted">Cell B3</td>
        <td>Cell C3</td>
    </tr>
</table>
</div>
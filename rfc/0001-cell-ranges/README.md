<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

- Feature Name: `cell-ranges`
- Status: `ACCEPTED`

# Summary

Enable reshaping messy 2-dimensional data into a processable structure.

This is done by transforming sheets using different blocks.
[Cell ranges](./0003-cell-range-syntax.md) are used to configure such transformations.
In order to interpret the sheet as a table,
the aim is to form columns and optionally a header row
(similar to the usual structure of CSV files).

Note that the actual conversion from a sheet to a table is part of an upcoming RFC.
This RFC focuses on the transformation of sheets to a desired structure.

# Motivation

Some 2-dimensional open data is badly structured.
For example, see this [CSV file from mobilithek.info](https://mobilithek.info/offers/-655945265921899037)
which does not follow the usual CSV pattern (topmost row as header, followed by the actual data)
but instead has metadata on the top and bottom of the file as well as two header rows
that provide no names for the first three columns.

Excerpt of that example, featuring the top and bottom lines as well as the first line containing actual data:

```
GENESIS-Tabelle: 46251-0021
Personenkraftwagen: Kreise, Stichtag, Kraftstoffarten,;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Emissionsgruppen;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Statistik des Kraftfahrzeug- und Anhängerbestandes;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Personenkraftwagen (Anzahl);;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;Benzin;Benzin;Benzin;Benzin;Benzin;Benzin;Benzin;Benzin;Benzin;Benzin;Diesel;Diesel;Diesel;Diesel;Diesel;Diesel;Diesel;Diesel;Diesel;Diesel;Gas;Gas;Gas;Gas;Gas;Gas;Gas;Gas;Gas;Gas;Elektro;Elektro;Elektro;Elektro;Elektro;Elektro;Elektro;Elektro;Elektro;Elektro;Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Hybrid (ohne Plug-in);Plug-in-Hybrid;Plug-in-Hybrid;Plug-in-Hybrid;Plug-in-Hybrid;Plug-in-Hybrid;Plug-in-Hybrid;Plug-in-Hybrid;Plug-in-Hybrid;Plug-in-Hybrid;Plug-in-Hybrid;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Sonstige Kraftstoffarten;Insgesamt;Insgesamt;Insgesamt;Insgesamt;Insgesamt;Insgesamt;Insgesamt;Insgesamt;Insgesamt;Insgesamt
;;;Euro 1;Euro 2;Euro 3;Euro 4;Euro 5;Euro 6 (ohne 6d und 6d-temp);Euro 6d-temp;Euro 6d;Sonstige;Insgesamt;Euro 1;Euro 2;Euro 3;Euro 4;Euro 5;Euro 6 (ohne 6d und 6d-temp);Euro 6d-temp;Euro 6d;Sonstige;Insgesamt;Euro 1;Euro 2;Euro 3;Euro 4;Euro 5;Euro 6 (ohne 6d und 6d-temp);Euro 6d-temp;Euro 6d;Sonstige;Insgesamt;Euro 1;Euro 2;Euro 3;Euro 4;Euro 5;Euro 6 (ohne 6d und 6d-temp);Euro 6d-temp;Euro 6d;Sonstige;Insgesamt;Euro 1;Euro 2;Euro 3;Euro 4;Euro 5;Euro 6 (ohne 6d und 6d-temp);Euro 6d-temp;Euro 6d;Sonstige;Insgesamt;Euro 1;Euro 2;Euro 3;Euro 4;Euro 5;Euro 6 (ohne 6d und 6d-temp);Euro 6d-temp;Euro 6d;Sonstige;Insgesamt;Euro 1;Euro 2;Euro 3;Euro 4;Euro 5;Euro 6 (ohne 6d und 6d-temp);Euro 6d-temp;Euro 6d;Sonstige;Insgesamt;Euro 1;Euro 2;Euro 3;Euro 4;Euro 5;Euro 6 (ohne 6d und 6d-temp);Euro 6d-temp;Euro 6d;Sonstige;Insgesamt
01.01.2022;01001;Flensburg, kreisfreie Stadt;259;1190;1208;7640;5700;6173;3098;1001;540;26809;86;583;1280;2308;4858;4305;1961;631;218;16230;1;36;37;115;31;20;11;8;3;262;-;-;-;-;-;-;-;-;741;741;-;-;-;17;64;128;300;394;-;903;-;-;-;-;8;41;120;357;-;526;-;-;-;8;6;-;-;-;3;17;346;1809;2525;10088;10667;10667;5490;2391;1505;45488
__________
Quelle: Kraftfahrt-Bundesamt, Flensburg
© Statistisches Bundesamt (Destatis), 2023
Stand: 03.01.2023 / 22:01:12
```

In order to bring such data into a better structure,
we need to be able to flexibly reshape such data and to omit parts we consider uninteresting.

# Explanation

## Desired structures

For a conversion of sheets into database-conform tables,
sheets shall be transformed into one of the following two structures before interpreting them as a table:

### Plain columns

<img src="https://user-images.githubusercontent.com/51856713/215997813-a193e5b2-3f13-4a0a-9fda-2db00b08be93.png" width="500px">

Each column in the sheet represents a column in the database table,
and each row represents a record in the database table.
Note that the columns have no names so far.

### Columns with topmost header row

<img src="https://user-images.githubusercontent.com/51856713/215997925-b7396cd1-6716-42d9-85b4-dae9c9053d9e.png" width="500px">

The topmost row contains the names of the columns (e.g. `A1` contains the name for the first column).
After excluding the topmost row, each column in the sheet represents a column in the database table,
and each row represents a record in the database table.

## Sheet transformation blocks

The following sections present block types that are used to flexibly restructure sheets.
The goal is to enable transforming sheets into a desired structure
(see the corresponding [section above](#desired-structures)).

Each of the following block types takes a `Sheet` as input and produces a `Sheet` as output.

### `ColumnDeleter` / `RowDeleter`

Can be used to delete entire columns or rows of a sheet.
The attribute `delete` specifies the columns / rows that shall be deleted.
Only cell ranges that select entire columns / rows are allowed.

#### Example

##### Delete the single column B

```jayvee
block MyColumnDeleter oftype ColumnDeleter {
  delete: [column B];
}
```

![image](https://user-images.githubusercontent.com/51856713/216016548-5172d609-e31f-416a-969d-3469d1b3fbae.png)

##### Delete the columns A and C

```jayvee
block MyColumnDeleter oftype ColumnDeleter {
  delete: [column A, column C];
}
```

![image](https://user-images.githubusercontent.com/51856713/216016612-226a07a2-aa7e-4b95-982b-fcf36cb25c00.png)

##### Delete the single row 2

```jayvee
block MyRowDeleter oftype RowDeleter {
  delete: [row 2];
}
```

![image](https://user-images.githubusercontent.com/51856713/216016668-5806e7c4-5eb0-4aac-93aa-b6c820ef10fc.png)

##### Delete the rows 1 and 3

```jayvee
block MyRowDeleter oftype RowDeleter {
  delete: [row 1, row 3];
}
```

![image](https://user-images.githubusercontent.com/51856713/216016728-134057d6-f934-4918-a4b9-71f1bbed91cb.png)

### `CellRangeSelector`

Enables extracting a sub-sheet from a given sheet.
The desired sub-sheet is selected via the attribute `select` using an arbitrary cell range.

Note that this can be considered a convenience block type
because the same transformation can be achieved by multiple instances of `ColumnDeleter` / `RowDeleter`.

#### Example

```jayvee
block MyCellRangeSelector oftype CellRangeSelector {
  select: range B1:C2;
}
```

![image](https://user-images.githubusercontent.com/51856713/216016857-023c9d04-7d9c-4f25-8252-3a0c81fc58a5.png)

### `CellWriter`

Used for overriding the textual content of a particular cell.
The attribute `at` specifies the affected cell and `write` specifies the new content for the cell.

#### Example

Writing `some text` into cell `A2`:

```jayvee
block MyCellWriter oftype CellWriter {
  at: cell A2;
  write: "some text";
}
```

## Exemplary restructuring of the [mobilithek example](#motivation) from above

```jayvee
block DataSelector oftype CellRangeSelector {
  select: range A8:*483;
}

pipe {
  from: DataSelector;
  to: IdColumnDeleter;
}

block IdColumnDeleter oftype ColumnDeleter {
  delete: [column B];
}
```

Note that there is currently no way to merge the two header rows into one.
Thus, in the example code above, the header rows are entirely deleted.
The resulting sheet has the [column structure without a header row](plain-columns).

# Future possibilities

- A graphical sheet editor where each action in the editor generates an according transformation block

# Drawbacks

- Sheets may require multiple subsequent transformations, possibly making the pipeline hard to understand
  - Esp. many cell writes require as many subsequent `CellWriter` blocks
- Altering indexes of rows / columns may be confusing for users
  - E.g. when deleting column `A`, the previous column `B` becomes the new column `A`
  - Could be diminished by having a graphical preview of the transformed sheet

# Alternatives

- Introduce different sheet transformation blocks
- Don't transform sheets, use previously proposed layout concept instead: https://github.com/jvalue/jayvee/pull/114

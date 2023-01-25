- Feature Name: `cell-ranges`
- Status: `DRAFT`

# Summary

Enable reshaping messy 2-dimensional data into a tabular format.

This is done by optionally specifying a `layout` where cell ranges are specified and given a name.
Then, a `TableBuilder` block is able to rearrange such cell ranges to form columns of the table,
as well as assigning a type to each column.

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

In order to bring such data into a database-conform format,
we need to be able to flexibly restructure data and to omit sections we consider uninteresting.

# Explanation

## Layout

A layout is used to select cell ranges by absolute cell positions in 2-dimensional data and give those ranges a name.
The syntax for cell ranges was already agreed upon, see #112.

### Defining a layout

A layout can either be defied outside a pipeline or within a pipeline using the `layout` keyword.
For the mobilithek example above it could look like this:

```jayvee
layout PersonenkraftwagenLayout {
  range A1:*5 called MetadataTop;
  row 6 called UpperHeader;
  row 7 called LowerHeader;
  range A484:** called MetadataBottom;

  column A called Stichtag;
  // column B contains irrelevant data
  column C called Kreis;
  column D called BenzinEuro1;
  column E called BenzinEuro2;
  // ...
  column L called BenzinSonstige;
  // column M contains redundant data
  column N called DieselEuro1;
  // ...
  column BT called SonstigeKraftstoffartenSonstige;
  // remaining columns contain redundant data
}
```

Here, a layout called `PersonenkraftwagenLayout` is instantiated.
In its body, enclosed by `{` and `}`, named cell ranges are defined.
The general syntax for named cell ranges is the following: `<cell-range> called <name>;`.

### Handling overlaps of cell ranges

In general, cell ranges in a layout are evaluated from top to bottom. 
If a particular cell is selected by a cell range, 
but is already part of a previous cell range, that cell is not included in the current range.
As a consequence, in each layout, a particular cell can only be part of at most a single cell range.

In the example layout above, this principle is used to exclude metadata and headers from the column ranges,
so they only contain the actual data.

## TableBuilder

A `TableBuilder` block is used to convert 2-dimensional data into a database-conform structure (i.e. a table).
Therefore, it defines separate columns by giving them a name, 
specifying their contents using cell ranges and assigning a type to each of them. 
The data that shall be contained in a particular column is defined 
by referring to one or more 1-dimensional cell ranges or individual cells of a layout or by inline cell ranges.
In case multiple cell ranges are specified, their cells are concatenated to form the column 
(see [this section](#concatenation-of-cell-ranges) for details).

The block validates that the cell ranges fit to the dimensions of the input data
and that each table column contains an equal number of cells.
Additionally, the type of a column is checked for each value in that column.

See the following `TableBuilder` for the mobilithek example:

```jayvee
block PersonenkraftwagenTableBuilder oftype TableBuilder {
  layout: PersonenkraftwagenLayout;
  columns: {
    "stichtag": Stichtag oftype text;
    "kreis": Kreis oftype text;
    "benzin-eur-1": BenzinEuro1 oftype integer;
    // ...
  }
}
```

The example constructs a table with the columns `stichtag` of type `text`,
`kreis` of type `text` and `benzin-eur-1` of type `integer`.
The `layout` attribute references the previously defined layout
`PersonenkraftwagenLayout` which used for specifying the contents of the columns.
is filled with the data from column `A` of the input data, `kreis`
is filled with data from column `C` and `benzin-eur-1` is filled with data from column `D`.
Column `B` will not be part of the resulting table.

### Defining a table without a separate layout

In some simple scenarios, defining a layout may be overkill.
Thus, a user can use inline cell ranges instead of referring to an existing layout.

For example:

```jayvee
block PersonenkraftwagenTableBuilder oftype TableBuilder {
  columns: {
    "stichtag": range A8:A483 oftype text;
    "kreis": range C8:C483 oftype text;
    "benzin-eur-1": range D8:D483 oftype integer;
    // ...
  }
}
```

In such a case, overlapping cell ranges are detected and reported as a warning to the user.

### Concatenation of cell ranges

It is possible to define a table column consisting of multiple cell ranges.
This can be done by concatenating them in the `TableBuilder` block using `,`.
Note that only 1-dimensional cell ranges and individual cells can be concatenated.

For example:

```jayvee
layout MyLayout {
  range B2:B* called MyPartialRange;
  cell C1 called MyCell;
}

block MyTableBuilder oftype TableBuilder {
  sheetLayout: MyLayout;
  columns: {
    "my-column": MyPartialRange, MyCell oftype text;
  }
}
```

In the example, the specified table column `my-column` consists of the cells in column `B`,
excluding the topmost cell, and lastly cell `C1`.

### Inferring column names from a header

A common use case is the processing of CSV files that contain a single header row.
Thus, it is desirable to use header values as column names of the table.

In order to do that,
a user can specify a `header` attribute where a cell range needs to be provided which selects the header.
Then, in the `columns` attribute, the column names can be omitted because they are inferred from the provided header.

Example:

```jayvee
layout CsvLayout {
  row 1 called Header;
  column A called ColumnA;
  column B called ColumnB;
  // maybe more columns...
}

block MyTableBuilder oftype TableBuilder {
  layout: CsvLayout;
  header: Header;
  columns: {
    ColumnA oftype text;
    ColumnB oftype integer;
    // ...
  }
}
```

In such a case, Jayvee tries to find the header value that corresponds to a given table column using an algorithm.
In case, no corresponding header value could be derived for a table column or if the result is ambiguous,
the user gets an error and instead needs to specify the column names explicitly.
This may happen if the header or columns consist of concatenated cell ranges
or if the header cells are not orthogonal to the cells that form the table column.

# Drawbacks

- An algorithm for deriving column names from a header could be non-transparent for users
- 2-dimensional cell ranges are currently useless

# Alternatives

- Optionally allow overlapping ranges in layouts or use them by default
- Ability to mark cells as ignored
- Assign types to named cell ranges in layouts
- Abolish layouts and only allow in-line cell ranges
- Abolish in-line cell ranges and only allow layouts
- Attach layouts to sheets in `CSVFileExtractor` instead of referring to layouts in `TableBuilder`
- Specify table columns outside the `TableBuilder` block using its own language concept, similar to `layout` for cell ranges; then `TableBuilder` also needs a reference to it
- Forbid 2-dimensional cell ranges (for now)
- Ability to linearize 2-dimensional cell ranges (column- or row-wise) to make use of them

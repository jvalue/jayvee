<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# RFC 0012: Invalid Values
| | |
|---|---|
| Feature Tag | `invalid values` |
| Status | `DRAFT` | <!-- Possible values: DRAFT, DISCUSSION, ACCEPTED, REJECTED -->
| Responsible | `georg-schwarz` | 
<!-- 
  Status Overview:
  - DRAFT: The RFC is not ready for a review and currently under change. Feel free to already ask for feedback on the structure and contents at this stage.
  - DISCUSSION: The RFC is open for discussion. Usually, we open a PR to trigger discussions.
  - ACCEPTED: The RFC was accepted. Create issues to prepare implementation of the RFC.
  - REJECTED: The RFC was rejected. If another revision emerges, switch to status DRAFT.
-->

## Summary
This RFC introduces the concept of invalid values as first-class citizen to Jayvee. We will allow more fine-grained handling of invalid values so that users can decide how to proceed with them.


## Motivation
Right now, we just drop invalid rows when transforming to a table and log a warning. Users, however, might instead want to preserve the valid parts of the rows or curate the invalid fields (e.g., by using default values).


## Explanation
We introduce another primitive value type called `INVALID`.

Values that fail complying with their intended value type are assigned to this `INVALID` value type. The value that this value type stores 
* a text description on how the invalid value emerged (like a log message)
* a last valid value before turning invalid.

Any kind of transformation via expressions including an `INVALID` value produces an `INVALID` value again. 

### INVALID value handling blocks

#### Block-Type `InvalidTableRowFilter`
This block-type implements the current default behavior: dropping all rows that have invalid values in them. No configuration parameters are available.
```
block MyInvalidRowFilter oftype InvalidTableRowFilter {}
```

#### Block-Type `InvalidTableCellReplacer`
This block-type allows replacing all invalid values of a column with a valid value.
```
block MyInvalidTemperatureReplacer oftype InvalidTableCellReplacer {
  column: "Temperature";  // refers to table column
  value: 21;              // expression producing valid value
}
```

### Sink Behavior
In the sinks, we have to reflect the presence of the `INVALID` value type as well. Each sink should bring a default behavior in this regard and allow further configuration modes. The following is an example on how the SQLiteLoader might work.

```
block CarsLoader oftype SQLiteLoader {
  table: "Cars";
  file: "./cars.sqlite";
  invalidValueStrategy: "meta-column-invalid"
}
```

The newly introduced field `invalidValueStrategy` can have the values `"meta-table-mirrored"`, `"meta-table-linked"`, or `"ignore-row"`.


#### Meta Table Mirrored
An additional table is created with the naming convention `<value table name>_META`. In this table, there are columns that mirror the structure of the original table. For each column in the value table, we introduce three meta columns:
- `<value column name>_isValid`, flag whether the value in the value column is valid or not, 
- `<value column name>_details`, text for describing how the invalid value emerged,
- `<value column name>_lastValidValue`, the last valid value before turning invalid. 

Invalid values in the value table are assigned to `null`. As an implication, all value columns must be `nullable`.

In the future, we might add more meta columns in this manner to the meta table.

#### Meta Table Linked
There is an additional global table `VALUES_META`. In this table, there are columns describing meta information of values. 
- `id`, used for linking in the value tables,
- `isValid`, flag whether the value in the value column is valid or not, 
- `details`, text for describing how the invalid value emerged,
- `lastValidValue`, the last valid value before turning invalid. 

The actual tables have an additional column per value column with the naming scheme `>value column name>_META` that uses the `id` of the `VALUES_META` table as foreign key.

Invalid values in the value table are assigned to `null`. As an implication, all value columns must be `nullable`.

In the future, we might add more meta columns in this manner to the meta table.

#### Ignore Row
This configuration ignores rows with invalid values. They are not written into the database. Ignored values are logged on the info level (not warning since actively configured).

This resembles the current configuration.


## Drawbacks
- The `"meta-column"` configuration of the `SQLiteLoader` is not really extensible for further meta data.

## Alternatives
- Don't introduce a concept for invalid values at all.
- Move handling of invalid values to value type concept instead of using blocks.
- Replace `InvalidTableRowFilter` and `InvalidTableCellReplacer` by a transformation using expressions (expressions would have to extended for this).
- Only offer one standard sink behavior instead of many.

## Possible Future Changes/Enhancements
- Allowing to calculate the mean of a column or its median would allow using those values in the `InvalidTableCellReplacer` blocks.
- Add an "invalid value safety" feature to the type system (similar to "null safety"). E.g., introduce a `?` operator that turns a type into one that can hold `INVALID` or the other way around a `!` operator that enforces valid values.
- Offer client libraries that offer convenience functionality on the table structures (e.g., an isValid method).

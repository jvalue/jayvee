---
title: test
---

```jayvee
/*
Interprets an input file as a csv-file containing string-values delimited by `delimiter` and outputs a `Sheet`.

@example Interprets an input file as a csv-file containing string-values delimited by `;` and outputs `Sheet`.
block AgencyCSVInterpreter oftype CSVInterpreter {  
    delimiter: ";";
  }
*/
builtin blocktype CSVInterpreter {
	input default oftype TextFile;
	output default oftype Sheet;
	
	// The delimiter for values in the CSV file.
	property delimiter oftype text: ',';
	// The enclosing character that may be used for values in the CSV file.
	property enclosing oftype text: '';
	// The character to escape enclosing characters in values.
	property enclosingEscape oftype text: '';
}
```
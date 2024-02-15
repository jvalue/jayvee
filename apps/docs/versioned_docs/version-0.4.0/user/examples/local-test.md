---
title: local-test
---

```jayvee
pipeline CarsPipeline {

	transform BeeTransform {
		from inputName oftype text;
		to outputName oftype text;

		outputName: inputName replace /Hornet/ with 'Bee';
	}

	CarsExtractor -> CarsTextFileInterpreter;

	CarsTextFileInterpreter
		-> CarsCSVInterpreter 
		-> NameHeaderWriter
	   	-> CarsTableInterpreter
	   	-> BeeTransformer
		-> CarsLoader;

	block CarsExtractor oftype HttpExtractor {
		url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
	}

	block CarsTextFileInterpreter oftype TextFileInterpreter { }

	block CarsCSVInterpreter oftype CSVInterpreter {
		enclosing: '"';
	}

	block NameHeaderWriter oftype CellWriter {
		at: cell A1;

		write: ["name"];
	}

	block CarsTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"name" oftype text,
			"mpg" oftype decimal,
			"cyl" oftype integer,
			"disp" oftype decimal,
			"hp" oftype integer,
			"drat" oftype decimal,
			"wt" oftype decimal,
			"qsec" oftype decimal,
			"vs" oftype integer,
			"am" oftype integer,
			"gear" oftype integer,
			"carb" oftype integer
		];
	}


	block BeeTransformer oftype TableTransformer {
		inputColumns: ['name'];
		outputColumn: 'name';
		use: BeeTransform;
	}

	block CarsLoader oftype SQLiteLoader {
		table: "Cars";
		file: "./cars.sqlite";
	}
}
```
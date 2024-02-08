---
title: composite-block
---

```jayvee
composite blocktype TextFileExtractor {
    property url oftype text;

    input inputName oftype None;
    output outputName oftype File;

    block FileExtractor oftype HttpExtractor { url: url; }

	block FileTextInterpreter oftype TextFileInterpreter {}

    inputName
        ->FileExtractor
        ->FileTextInterpreter
        ->outputName;
}

composite blocktype CSVExtractor {
    property url oftype text;
    property delimiter oftype text: ',';
    property enclosing oftype text: '';
    property enclosingEscape oftype text: '';

    input inputName oftype None;
    output outputName oftype Sheet;

    block TextFileExtractor oftype TextFileExtractor { url: url; }

	block FileCSVInterpreter oftype CSVInterpreter {
		delimiter: delimiter;
		enclosing: enclosing;
		enclosingEscape: enclosingEscape;
	}

    inputName
        ->TextFileExtractor
        ->FileCSVInterpreter
        ->outputName;
}

composite blocktype CarsTableInterpreterForTesting {
	input inputName oftype Sheet;
    output outputName oftype Table;

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

	inputName->CarsTableInterpreter->outputName;
}

composite blocktype SinkTester {
	input inputName oftype Table;
    output outputName oftype None;

	block CarsLoader oftype SQLiteLoader {
		table: "Cars";
		file: "./compositeblockstest.sqlite";
	}

	inputName->CarsLoader->outputName;
}

pipeline CarsPipeline {
	CarsCSVExtractor 
	   	-> TestCompositeWithInput
		-> CarsLoader;

    block CarsCSVExtractor oftype CSVExtractor {
        url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
		enclosing: '"';
    }

	block TestCompositeWithInput oftype CarsTableInterpreterForTesting {
	}

	block CarsLoader oftype SinkTester {
	}
}
```
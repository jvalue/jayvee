---
title: electric-vehicles
---

```jayvee
// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// Example 2: Electric Vehicles
// Learning goals:
// - Understand further core concepts transforms and valuetypes
// - Understand how to construct a pipeline with multiple sinks
// - Understand the use of runtime parameters

// 1. This Jayvee model describes a pipeline 
// from a CSV file in the web 
// to a SQLite file and a PostgreSQL db sink.
pipeline ElectricVehiclesPipeline {
	// See here for meta-data of the data source
	// https://catalog.data.gov/dataset/electric-vehicle-population-data/resource/fa51be35-691f-45d2-9f3e-535877965e69

	// 2. At the top of a pipeline, we describe the
	// structure of the pipeline. The first part until 
	// the ElectricRangeTransformer is a linear sequence
	// of blocks. From there we can see a split into two
	// parallel sequences that load the data in to two
	// different sinks.
    ElectricVehiclesHttpExtractor
		-> ElectricVehiclesTextFileInterpreter
		-> ElectricVehiclesCSVInterpreter
		-> ElectricVehiclesTableInterpreter
		-> ElectricRangeTransformer;
	
	ElectricRangeTransformer
		-> ElectricVehiclesSQLiteLoader;
	
	ElectricRangeTransformer
		-> ElectricVehiclesPostgresLoader;

	// 3. After the pipeline structure, we define the blocks used.
	block ElectricVehiclesHttpExtractor oftype HttpExtractor {
		url: "https://data.wa.gov/api/views/f6w7-q2d2/rows.csv?accessType=DOWNLOAD";
	}

	block ElectricVehiclesTextFileInterpreter oftype TextFileInterpreter { }

	block ElectricVehiclesCSVInterpreter oftype CSVInterpreter { }

	block ElectricVehiclesTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			// 4. Here, a user-deifned valuetype is used to describe this column.
			// The capital letter indicates that the valuetype is not builtin
			// by convention. The valuetype itself is defined further below. 
    		"VIN (1-10)" oftype VehicleIdentificationNumber10,
			"County" oftype text,
			"City" oftype text,
			"State" oftype UsStateCode,
			"Postal Code" oftype text,
			"Model Year" oftype integer,
			"Make" oftype text,
			"Model" oftype text,
			"Electric Vehicle Type" oftype text,
			"Clean Alternative Fuel Vehicle (CAFV) Eligibility" oftype text,
			"Electric Range" oftype integer,
			"Base MSRP" oftype integer,
			"Legislative District" oftype text,
			"DOL Vehicle ID" oftype integer,
			"Vehicle Location" oftype text,
			"Electric Utility" oftype text,
			"2020 Census Tract" oftype text,
    	];
	}

	// 5. This block describes the application of a transform function
	// taking a column as input and adding another computed column.
	// The applied transform function is defined below and referenced 
	// by the "use" property.
	block ElectricRangeTransformer oftype TableTransformer {
		inputColumns: ["Electric Range"];
		outputColumn: "Electric Range (km)";
		use: MilesToKilometers;
	}

	// 6. Here, we define a transform function, taking parameters
	// as input ("from" keyword), and producing an output ("to" keyword).
	// Inputs and outputs have to be further described by a valuetype.
	transform MilesToKilometers {
		from miles oftype decimal;
		to kilometers oftype integer;

		// 7. In order to express what the transform function does, 
		// we assign an expression to the output. Values from the input and output of the transform can be referred to by name.
		kilometers: round (miles * 1.609344);
	}

	block ElectricVehiclesSQLiteLoader oftype SQLiteLoader {
		table: "ElectricVehiclePopulationData";
		file: "./electric-vehicles.sqlite";
	}

	block ElectricVehiclesPostgresLoader oftype PostgresLoader {
		// 8. The requires keyword allows us to define runtime parameters.
		// These values have to be provided as environment variables when interpreting the Jayvee model.
		host: requires DB_HOST;
		port: requires DB_PORT;
		username: requires DB_USERNAME;
		password: requires DB_PASSWORD;
		database: requires DB_DATABASE;
		table: "ElectricVehiclePopulationData";
	}
}

// 9. Below the pipeline, we model user-define valuetypes.
// We give them a speaking name and provide a base valuetype
// that this valuetype builts on. User-defined valuetypes always place additional constraints on existing valuetypes.
valuetype VehicleIdentificationNumber10 oftype text {
	// 10. Valuetypes can be further refined by providing constraints.
	constraints: [
		OnlyCapitalLettersAndDigits,
		ExactlyTenCharacters,
	];
}

// 11. This constraint works on text valuetypes and requires values 
// to match a given regular expression in order to be valid.
constraint OnlyCapitalLettersAndDigits on text:
	value matches /^[A-Z0-9]*$/;

constraint ExactlyTenCharacters on text:
	value.length == 10;

valuetype UsStateCode oftype text {
	constraints: [
		UsStateCodeAllowlist,
	];
}

constraint UsStateCodeAllowlist on text:
	value in [
		"AL", "AK", "AZ", "AR", "AS", "CA", "CO", "CT", "DE", "DC",
		"FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
		"LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE",
		"NV", "NH", "NJ", "NM", "NY", "NC", "ND", "MP", "OH", "OK",
		"OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "TT", "UT",
		"VT", "VA", "VI", "WA", "WV", "WI", "WY",
	];

```
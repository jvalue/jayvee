---
title: workbooks-xlsx
---

```jayvee
// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// Example 1: LightTrapping
// Learning goals:
// - Understand how to work with XLSX files and workbooks

// 1. This Jayvee model describes a pipeline 
// from a XLSX file with multiple Sheets in the web 
// to a SQLite file sink.
pipeline LightTrappingSiliconSolarCellsPipeline {
	// 2. We directly get the xlsx file from the web via the HttpExtractor
	// The data is provided under CC BY-SA 4.0
	// Saive, Rebecca (2023). Data supporting the publication:
	// Light trapping in thin silicon solar cells: a review on fundamentals and technologies.
	// 4TU.ResearchData. Dataset. https://doi.org/10.4121/14554815.v1
	block LightTrappingSiliconSolarCellsExtractor oftype HttpExtractor {
		url: "https://figshare.com/ndownloader/files/27923598";
	}

	// 3. The incoming file is interpreted as a XLSX file and transformed into a Workbook
	// Workbooks contain at least 1 Sheet. Every sheet has a unique name. 
	block LightTrappingSiliconSolarCellsTextXLSXInterpreter oftype XLSXInterpreter {

	}

	// 4.1 Here, we pick one sheet with the name 'RefractiveIndexSi GaAs' from the Workbook to use within our pipeline. 
	// The output type from SheetPicker is Sheet, which was already introduced in the cars example
	block LightTrappingSiliconSolarCellsSheetpicker oftype SheetPicker {
		sheetName: 'RefractiveIndexSi GaAs';
	}

	block NameHeaderWriter oftype CellWriter {
		at: range F1:L1;
		write: ["F","G","nm","wl","n2", "k2", "alpha (cm-1)2"];
	}

	block LightTrappingSiliconSolarCellsTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"Wavelength" oftype integer,
			"Wavelength (µm)" oftype decimal,
			"n" oftype decimal,
			"k" oftype text,
			"alpha (cm-1)" oftype text,
			"nm" oftype decimal,
			"n2" oftype text,
			"k2" oftype decimal,
			"alpha (cm-1)2" oftype decimal
		];
	}

	block LightTrappingSiliconSolarCellsLoader oftype SQLiteLoader {
		table: "LightTrappingSiliconSolarCells";
		file: "./LightTrappingSiliconSolarCells.sqlite";
	}

	// 4.2 Here, we pick another sheet named 'Wavelength thickness trapping' from the Workbook
	block SecondLightTrappingSiliconSolarCellsSheetpicker oftype SheetPicker {
		sheetName: 'Wavelength thickness trapping';
	}

	block SecondLightTrappingSiliconSolarCellsTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"n" oftype decimal,
			"Wavelength (µm)" oftype decimal,
		];
	}

	block SecondLightTrappingSiliconSolarCellsLoader oftype SQLiteLoader {

		table: "SecondLightTrappingSiliconSolarCells";
		file: "./LightTrappingSiliconSolarCells.sqlite";
	}

	LightTrappingSiliconSolarCellsExtractor
		-> LightTrappingSiliconSolarCellsTextXLSXInterpreter
		-> LightTrappingSiliconSolarCellsSheetpicker
		-> NameHeaderWriter
		-> LightTrappingSiliconSolarCellsTableInterpreter
		-> LightTrappingSiliconSolarCellsLoader;
	
	// 5. Once the XLSX file is interpreted, we can split the pipeline and 
	// work separately on the different sheets from our input file
	LightTrappingSiliconSolarCellsTextXLSXInterpreter
		-> SecondLightTrappingSiliconSolarCellsSheetpicker
		-> SecondLightTrappingSiliconSolarCellsTableInterpreter
		-> SecondLightTrappingSiliconSolarCellsLoader;
}
```
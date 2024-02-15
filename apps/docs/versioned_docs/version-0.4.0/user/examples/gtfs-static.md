---
title: gtfs-static
---

```jayvee
// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// Example 4: GTFS Static Data
// Learning goals:
// - Understand how to work with file systems

// 1. This Jayvee model describes a pipeline 
// from a zip file in the GTFS format in the web 
// to a joint SQLite file with multiple tables.
pipeline GtfsPipeline {

	// 2. The origin for multiple pipe sequences is a zip
	// file. Each csv file in this zip is further processed 
	// by its own sequence of blocks and pipes.

	GTFSSampleFeedExtractor
		-> AgencyFilePicker
		-> AgencyTextFileInterpreter
		-> AgencyCSVInterpreter
		-> AgencyTableInterpreter
		-> AgencyLoader;

	GTFSSampleFeedExtractor	
		-> CalendarDatesFilePicker
		-> CalendarDatesTextFileInterpreter
		-> CalendarDatesCSVInterpreter
		-> CalendarDatesTableInterpreter
		-> CalendarDatesLoader;

	GTFSSampleFeedExtractor	
		-> CalendarFilePicker
		-> CalendarTextFileInterpreter
		-> CalendarCSVInterpreter
		-> CalendarTableInterpreter
		-> CalendarLoader;

	GTFSSampleFeedExtractor	
		-> FareAttributesFilePicker
		-> FareAttributesTextFileInterpreter
		-> FareAttributesCSVInterpreter
		-> FareAttributesTableInterpreter
		-> FareAttributesLoader;

	GTFSSampleFeedExtractor	
		-> FareRulesFilePicker
		-> FareRulesTextFileInterpreter
		-> FareRulesCSVInterpreter
		-> FareRulesTableInterpreter
		-> FareRulesLoader;

	GTFSSampleFeedExtractor	
		-> FrequenciesFilePicker
		-> FrequenciesTextFileInterpreter
		-> FrequenciesCSVInterpreter
		-> FrequenciesTableInterpreter
		-> FrequenciesLoader;

	GTFSSampleFeedExtractor			
		-> RoutesFilePicker
		-> RoutesTextFileInterpreter
		-> RoutesCSVInterpreter 
		-> RoutesTableInterpreter 
		-> RoutesLoader;

	GTFSSampleFeedExtractor			
		-> ShapesFilePicker
		-> ShapesTextFileInterpreter
		-> ShapesCSVInterpreter 
		-> ShapesTableInterpreter 
		-> ShapesLoader;

	GTFSSampleFeedExtractor	
		-> StopTimesFilePicker
		-> StopTimesTextFileInterpreter
		-> StopTimesCSVInterpreter
		-> StopTimesTableInterpreter 
		-> StopTimesLoader;

	GTFSSampleFeedExtractor
		-> StopsFilePicker 
		-> StopsTextFileInterpreter
		-> StopsCSVInterpreter 
		-> StopsTableInterpreter 
		-> StopsLoader;

	GTFSSampleFeedExtractor	
		-> TripsFilePicker 
		-> TripsTextFileInterpreter
		-> TripsCSVInterpreter 
		-> TripsTableInterpreter 
		-> TripsLoader;

	// 3. As a first step, we download the zip file and interpret it.
	block GTFSSampleFeedExtractor oftype GTFSExtractor {
		url: "https://developers.google.com/static/transit/gtfs/examples/sample-feed.zip";
	}

	// 4. Next, we pick several csv files (with the file extension ".txt") 
	// for further processing .
	block AgencyFilePicker oftype FilePicker {
		path: "/agency.txt";
	}

	block CalendarDatesFilePicker oftype FilePicker {
		path: "/calendar_dates.txt";
	}

	block CalendarFilePicker oftype FilePicker {
		path: "/calendar.txt";
	}

	block FareAttributesFilePicker oftype FilePicker {
		path: "/fare_attributes.txt";
	}

	block FareRulesFilePicker oftype FilePicker {
		path: "/fare_rules.txt";
	}

	block FrequenciesFilePicker oftype FilePicker {
		path: "/frequencies.txt";
	}

	block RoutesFilePicker oftype FilePicker {
		path: "/routes.txt";
	}

	block ShapesFilePicker oftype FilePicker {
		path: "/shapes.txt";
	}

	block StopTimesFilePicker oftype FilePicker {
		path: "/stop_times.txt";
	}

	block StopsFilePicker oftype FilePicker {
		path: "/stops.txt";
	}

	block TripsFilePicker oftype FilePicker {
		path: "/trips.txt";
	}

	// 5. The rest of the pipeline follows the usual pattern.
	block AgencyTextFileInterpreter oftype TextFileInterpreter { }
	block CalendarDatesTextFileInterpreter oftype TextFileInterpreter {	}
	block CalendarTextFileInterpreter oftype TextFileInterpreter { }
	block FareAttributesTextFileInterpreter oftype TextFileInterpreter { }
	block FareRulesTextFileInterpreter oftype TextFileInterpreter {	}
	block FrequenciesTextFileInterpreter oftype TextFileInterpreter { }
	block RoutesTextFileInterpreter oftype TextFileInterpreter { }
	block ShapesTextFileInterpreter oftype TextFileInterpreter { }
	block StopTimesTextFileInterpreter oftype TextFileInterpreter { }
	block StopsTextFileInterpreter oftype TextFileInterpreter { }
	block TripsTextFileInterpreter oftype TextFileInterpreter {	}
	block AgencyCSVInterpreter oftype CSVInterpreter { }
	block CalendarDatesCSVInterpreter oftype CSVInterpreter { }
	block CalendarCSVInterpreter oftype CSVInterpreter { }
	block FareAttributesCSVInterpreter oftype CSVInterpreter { }
	block FareRulesCSVInterpreter oftype CSVInterpreter { }
	block FrequenciesCSVInterpreter oftype CSVInterpreter {	}
	block RoutesCSVInterpreter oftype CSVInterpreter { }
	block ShapesCSVInterpreter oftype CSVInterpreter { }
	block StopTimesCSVInterpreter oftype CSVInterpreter { }
	block StopsCSVInterpreter oftype CSVInterpreter { }
	block TripsCSVInterpreter oftype CSVInterpreter { }

	block AgencyTableInterpreter oftype TableInterpreter {
		header: true;
		columns:[
			"agency_id" oftype text, //Conditional columns are considered as required
			"agency_name" oftype text,
			"agency_url" oftype text,
			"agency_timezone" oftype text
		];
	}

	block CalendarDatesTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"service_id" oftype text,
			"date" oftype text,
			"exception_type" oftype text
		];
	}

	block CalendarTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"service_id" oftype text,
			"monday" oftype text,
			"tuesday" oftype text,
			"wednesday" oftype text,
			"thursday" oftype text,
			"friday" oftype text,
			"saturday" oftype text,
			"sunday" oftype text,
			"start_date" oftype text,
			"end_date" oftype text
		];
	}

	block FareAttributesTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"fare_id" oftype text,
			"price" oftype text,
			"currency_type" oftype text,
			"payment_method" oftype text,
			"transfers" oftype text,
			"transfer_duration" oftype text
		];
	}

	block FareRulesTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"fare_id" oftype text,
			"route_id" oftype text,
			"origin_id" oftype text,
			"destination_id" oftype text,
			"contains_id" oftype text
		];
	}

	block FrequenciesTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"trip_id" oftype text,
			"start_time" oftype text,
			"end_time" oftype text,
			"headway_secs" oftype text
		];
	}

	block RoutesTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"route_id" oftype text,
			"agency_id" oftype text,
			"route_short_name" oftype text,
			"route_long_name" oftype text,
			"route_desc" oftype text,
			"route_type" oftype text,
			"route_url" oftype text,
			"route_color" oftype text,
			"route_text_color" oftype text
		];
	}

	block ShapesTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"shape_id" oftype text,
			"shape_pt_lat" oftype text,
			"shape_pt_lon" oftype text,
			"shape_pt_sequence" oftype text,
			"shape_dist_traveled" oftype text
		];
	}

	block StopTimesTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"trip_id" oftype text,
			"arrival_time" oftype text,
			"departure_time" oftype text,
			"stop_id" oftype text,
			"stop_sequence" oftype text,
			"stop_headsign" oftype text,
			"pickup_type" oftype text,
			"drop_off_time" oftype text,
			"shape_dist_traveled" oftype text
		];
	}

	block StopsTableInterpreter oftype TableInterpreter {
		header: true;
		columns:[
			"stop_id" oftype text,
			"stop_name" oftype text,
			"stop_desc" oftype text,
			"stop_lat" oftype text,
			"stop_lon" oftype text,
			"zone_id" oftype text,
			"stop_url" oftype text
		];
	}

	block TripsTableInterpreter oftype TableInterpreter {
		header: true;
		columns: [
			"route_id" oftype text,
			"service_id" oftype text,
			"trip_id" oftype text,
			"trip_headsign" oftype text,
			"direction_id" oftype text,
			"block_id" oftype text,
			"shape_id" oftype text
		];
	}

	block AgencyLoader oftype SQLiteLoader {
		table: "agency";
		file: "./gtfs.sqlite";
	}

	block CalendarDatesLoader oftype SQLiteLoader {
		table: "calendar_dates";
		file: "./gtfs.sqlite";
	}

	block CalendarLoader oftype SQLiteLoader {
		table: "calendar";
		file: "./gtfs.sqlite";
	}

	block FareAttributesLoader oftype SQLiteLoader {
		table: "fare_attributes";
		file: "./gtfs.sqlite";
	}

	block FareRulesLoader oftype SQLiteLoader {
		table: "fare_rules";
		file: "./gtfs.sqlite";
	}

	block FrequenciesLoader oftype SQLiteLoader {
		table: "frequencies";
		file: "./gtfs.sqlite";
	}

	block RoutesLoader oftype SQLiteLoader {
		table: "routes";
		file: "./gtfs.sqlite";
	}

	block ShapesLoader oftype SQLiteLoader {
		table: "shapes";
		file: "./gtfs.sqlite";
	}

	block StopTimesLoader oftype SQLiteLoader {
		table: "stop_times";
		file: "./gtfs.sqlite";
	}

	block StopsLoader oftype SQLiteLoader {
		table: "stops";
		file: "./gtfs.sqlite";
	}

	block TripsLoader oftype SQLiteLoader {
		table: "trips";
		file: "./gtfs.sqlite";
	}
}
```
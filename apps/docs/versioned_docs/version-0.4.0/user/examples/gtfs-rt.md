---
title: gtfs-rt
---

```jayvee
// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// Example 3: GTFS Realtime Data
// Learning goals:
// - Understand the construction of a csv file with multiple tables
// - Understand how to work with live data

// 1. This Jayvee model describes a pipeline 
// from a GTFS RT data source in the web 
// to a SQLite file with multiple tables.
pipeline GtfsRTSimplePipeline {

    // 2. As you can see here, we have three independent
    // sequences of pipes in this pipeline.
    GTFSRTTripUpdateFeedExtractor
        ->GtfsRTTripUpdateInterpreter
        ->TripUpdateTableInterpreter
        ->TripUpdateLoader;
    
    GTFSRTVehiclePositionFeedExtractor
        ->GtfsRTVehiclePositionInterpreter
        ->VehiclePositionTableInterpreter
        ->VehicleLoader;
    
    GTFSRTAlertFeedExtractor
        ->GtfsRTAlertInterpreter    
        ->AlertTableInterpreter
        ->AlertLoader;

    // 3. We define a series of HttpExtractors that each pull data
    // from an HTTP endpoint
	block GTFSRTTripUpdateFeedExtractor oftype HttpExtractor {
		url: "https://proxy.transport.data.gouv.fr/resource/bibus-brest-gtfs-rt-trip-update";
	}

    block GTFSRTVehiclePositionFeedExtractor oftype HttpExtractor {
		url: "https://proxy.transport.data.gouv.fr/resource/bibus-brest-gtfs-rt-vehicle-position";
	}

    block GTFSRTAlertFeedExtractor oftype HttpExtractor {
		url: "https://proxy.transport.data.gouv.fr/resource/bibus-brest-gtfs-rt-alerts";
	}

    // 4. In the next step, we use the domain-specific GtfsRTInterpreter
    // to interpret the fetched files as sheets
    block GtfsRTTripUpdateInterpreter oftype GtfsRTInterpreter {
        entity: "trip_update";
    }

    block GtfsRTAlertInterpreter oftype GtfsRTInterpreter {
        entity: "alert";
    }

    block GtfsRTVehiclePositionInterpreter oftype GtfsRTInterpreter {
        entity: "vehicle";
    }

    // 5. Next, we interpret the sheets as tables
    block TripUpdateTableInterpreter oftype TableInterpreter {
		header: true;
		columns:[
			"header.gtfs_realtime_version" oftype text, 
			"header.timestamp" oftype text, 
            "header.incrementality" oftype text, 
            "entity.id" oftype text, 
            "entity.trip_update.trip.trip_id" oftype text, 
            "entity.trip_update.trip.route_id" oftype text,
            "entity.trip_update.stop_time_update.stop_sequence" oftype text, 
            "entity.trip_update.stop_time_update.stop_id" oftype text,
            "entity.trip_update.stop_time_update.arrival.time" oftype text, 
            "entity.trip_update.stop_time_update.departure.time" oftype text,
		];
	}

    block VehiclePositionTableInterpreter oftype TableInterpreter {
		header: true;
		columns:[  
            "header.gtfs_realtime_version" oftype text,  
            "header.timestamp" oftype text,  
            "header.incrementality" oftype text,  
            "entity.id" oftype text,  
            "entity.vehicle_position.vehicle_descriptor.id" oftype text,  
            "entity.vehicle_position.trip.trip_id" oftype text,  
            "entity.vehicle_position.trip.route_id" oftype text,  
            "entity.vehicle_position.position.latitude" oftype text, 
            "entity.vehicle_position.position.longitude" oftype text, 
            "entity.vehicle_position.timestamp" oftype text
        ];
	}

    block AlertTableInterpreter oftype TableInterpreter {
		header: true;
		columns:[  
            'header.gtfs_realtime_version' oftype text,
            'header.timestamp' oftype text,
            'header.incrementality'  oftype text,
            'entity.id' oftype text,
            'entity.alert.informed_entity.route_id' oftype text,
            'entity.alert.header_text' oftype text,
            'entity.alert.description_text' oftype text,
        ];
	}

    // 6. Last, we load the tables into the same SQLite file.
    // Each loader has to define a different table name.
    // For working with live data, we use the property "dropTable: false"
    // to append data instead of deleting the previous data.
    block TripUpdateLoader oftype SQLiteLoader {
		table: "gtfs-rt-trip_update";
		file: "./gtfs.sqlite";
        dropTable: false;
	}

    block VehicleLoader oftype SQLiteLoader {
		table: "gtfs-rt-vehicle_position";
		file: "./gtfs.sqlite";
        dropTable: false;
	}

    block AlertLoader oftype SQLiteLoader {
		table: "gtfs-rt-alert";
		file: "./gtfs.sqlite";
        dropTable: false;
	}
}
```
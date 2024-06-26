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
  // file. Each file in this zip is further processed 
  // by its own sequence of blocks and pipes.
  GTFSSampleFeedExtractor
    -> AgencyInterpreter
    -> AgencyLoader;

  GTFSSampleFeedExtractor
    -> CalendarDatesInterpreter
    -> CalendarDatesLoader;

  GTFSSampleFeedExtractor
    -> CalendarInterpreter
    -> CalendarLoader;

  GTFSSampleFeedExtractor
    -> FareAttributesInterpreter
    -> FareAttributesLoader;

  GTFSSampleFeedExtractor
    -> FareRulesInterpreter
    -> FareRulesLoader;

  GTFSSampleFeedExtractor
    -> FrequenciesInterpreter
    -> FrequenciesLoader;

  GTFSSampleFeedExtractor
    -> RoutesInterpreter
    -> RoutesLoader;

  GTFSSampleFeedExtractor
    -> ShapesInterpreter
    -> ShapesLoader;

  GTFSSampleFeedExtractor
    -> StopTimesInterpreter
    -> StopTimesLoader;

  GTFSSampleFeedExtractor
    -> StopsInterpreter
    -> StopsLoader;

  GTFSSampleFeedExtractor
    -> TripsInterpreter
    -> TripsLoader;

  // 3. As a first step, we download the zip file and interpret it.
  block GTFSSampleFeedExtractor oftype GTFSExtractor {
    url: "https://developers.google.com/static/transit/gtfs/examples/sample-feed.zip";
  }

  // 4. Next, interpret the zip files contents according to the different elements
  // from the GTFS standard.
  block AgencyInterpreter oftype GTFSAgencyInterpreter { }
  block CalendarDatesInterpreter oftype GTFSCalendarDatesInterpreter { }
  block CalendarInterpreter oftype GTFSCalendarInterpreter { }
  block FareAttributesInterpreter oftype GTFSFareAttributesInterpreter { }
  block FareRulesInterpreter oftype GTFSFareRulesInterpreter { }
  block FrequenciesInterpreter oftype GTFSFrequenciesInterpreter { }
  block RoutesInterpreter oftype GTFSRoutesInterpreter { }
  block ShapesInterpreter oftype GTFSShapesInterpreter { }
  block StopTimesInterpreter oftype GTFSStopTimesInterpreter { }
  block StopsInterpreter oftype GTFSStopsInterpreter { }
  block TripsInterpreter oftype GTFSTripsInterpreter { }

  // 5. Finally, write the interpreted tables into a SQLite database
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
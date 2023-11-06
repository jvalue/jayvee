---
title: GtfsRTInterpreter
---

<!-- Do NOT change this document as it is auto-generated from the language server -->

Input type: `File`

Output type: `Sheet`

## Description

Interprets an protobuf file (binary) of type `File` by decoding the file according to `gtfs-realtime.proto`. Outputs the extracted entity defined by `entity` as a `Sheet`

## Example 1

```jayvee
block GtfsRTTripUpdateInterpreter oftype GtfsRTInterpreter{
  entity: "trip_update";
}
```

A file is interpretet as an GTFS-RT file, which contains TripUpdate.

## Properties

### `entity`

Type `text`

#### Description

Entity to process from GTFS-RT-feed (`trip_update`, `alert` or `vehicle`).
            We currently support following Output-Sheets, each are an equivalent to the flattened Element Index defined in <https://developers.google.com/transit/gtfs-realtime/reference#element-index> (just required fields are included)):

            Entity TripUpdate:
            ```
            [
              'header.gtfs_realtime_version',
              'header.timestamp',
              'header.incrementality',
              'entity.id',
              'entity.trip_update.trip.trip_id',
              'entity.trip_update.trip.route_id',
              'entity.trip_update.stop_time_update.stop_sequence',
              'entity.trip_update.stop_time_update.stop_id',
              'entity.trip_update.stop_time_update.arrival.time',
              'entity.trip_update.stop_time_update.departure.time',
            ];

            ```
            Entity VehiclePosition:
            ```
            [
              'header.gtfs_realtime_version',
              'header.timestamp',
              'header.incrementality',
              'entity.id',
              'entity.vehicle_position.vehicle_descriptor.id',
              'entity.vehicle_position.trip.trip_id',
              'entity.vehicle_position.trip.route_id',
              'entity.vehicle_position.position.latitude',
              'entity.vehicle_position.position.longitude',
              'entity.vehicle_position.timestamp',
            ];
            ```

            Entity Alert:
            ```
            [
              'header.gtfs_realtime_version',
              'header.timestamp',
              'header.incrementality',
              'entity.id',
              'entity.alert.informed_entity.route_id',
              'entity.alert.header_text',
              'entity.alert.description_text',
            ];
            ```

            

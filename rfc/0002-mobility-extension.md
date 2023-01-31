* Feature Name: mobility-extension
* Status: `DISCUSSION`

Disclaimer: This RFC is part of my master-thesis "Archiving open transport data using the JValue tooling ecosystem" supervised by @rhazn.

# Summary
This RFC enables a pipeline extracting, validating and loading GTFS-data (part of domain mobility-data) by providing an GTFS-endpoint under consideration of the [GTFS-specification](https://developers.google.com/transit/gtfs/reference). For that reason some changes and extensions of Jayvee have to be made. The overall goal of this RFC is processing GTFS-data with a minimum of changes/extensions in Jayvee. 

# Motivation
GTFS has gained widespread popularity over the past decade as an open-source industry standard for describing and publishing fixed- and dynamic route transit operations. It is a data standard that defines how public transit agencies can provide schedule information to developers. It is used by agencies around the world to publish their transit data in a common format, allowing developers to create applications that can access and use this data. GTFS data includes information about stops, routes, and schedules for buses, trains, and other forms of public transportation. GTFS-data is provided by an endpoint, which publishes a zip-file, consisting of a collection of comma-separated-values in plain text files. A example of a gtfs-zip-file could result in this datamodel (this visualization just includes required dimensions).
![Visualization of a Gtfs data model](./0002-visualization-gtfs-datamodel.png)

# Explanation
The following picture is a visualization of the corresponding [mobility.jv](0002-mobility.jv)-file. A GTFS-pipeline follows the overall pipeline pattern, consisting of an Extractor, some Interpreters, some Validators and finally a Loader to a sink (in our case all gtfs-csv-files are loaded into a SQLite database, each csv-file into its corresponding table). The individual GTFS files are picked out using their filename and further processed independently in parallel using block types that already exist (or at least in a similar form). In the image, there are three such parallel processing steps as an example. In practice, there would be one for each GTFS file in the ZIP archive. In case a file are not present, the further processing of that file is aborted and hence no table is created from that file. At the end, each successfully created table is loaded into the same SQLiteSink.

![Concept of a Gtfs Pipeline](./0002-visualization-gtfs-pipeline-filepicker.png)

The red block types need to be created from scratch whereas the blue block types are either already present or only require minor changes (this classification is also reflected in the following chapter titles). 

Jayvee needs to be extented by following parts to be able to process GTFS-data:
* New `io-datatypes` called `File` and `FileSystem`
* New blocktypes `HTTPExtractor`, `ArchiveInterpreter` and `FilePicker`
* The  `io-datatype` `Table` needs to store its name to be able to handle multiple tables as input
* An abort-mechanism must be implemented, when a block gets empty/null/undefined input (in our case FilePicker)
* Blocks must be able to process multiple parallel inputs (in our case SQLiteSink), resulting in multiple executions of the same block.

Each of the following subchapters explains the idea behind.

## New io-datatypes
### io-datatype File *(Requires implementation from scratch)*
A File datatype could look like this and should be added to `io-datatypes.ts`.
```
export interface File {
  name: string // The name of the file, excluding its file extension
  
  extension: string //The file extension
  
  filetype: string //The MIME type of the file taken from the Content-Type header (for HTTP requests only) Otherwise inferred from the file extension, Could default to text/plain or application/octet-stream for unknown or missing file extensions
  
  content: string | ArrayBuffer //The content of the file as a string Or maybe a byte array instead
}
```
### io-datatype FileSystem *(Requires implementation from scratch)*
A FileSystem could look like this and should be added to `io-datatypes.ts`. Provides generic methods for navigating in the file system using paths and for accessing files. 
```
export interface FileSystem {
  tbd
}
```

Not sure, how to *implement* methods in an interface in `io-datatype.ts` or is this realized in the Block `FilePicker` @felix-oq?


### io-datatype Table *(Requires minor change)*
The io-datatype `Table` should be adapted, to store its name to be able to handle multiple tables as input later in an DB-Loader.
```
export interface Table {
  tableName: string;
  columnNames: string[];
  columnTypes: Array<AbstractDataType | undefined>;
  data: string[][];
}
```

### datatype Undefined *(Requires implementation from scratch)*
For an implementation of an optional-mechanism for eg. columns, we need a new datatype ´undefined´(Attention: Not talking about io-datatype, i mean datatype). Optional column's datatype would then be `text or undefined`. So we also need a grammar feature for an OR-represenation in Jayvee


## New Block Types
### 1) HttpExtractor *(Requires implementation from scratch)*
Input: void, Output: File

A HttpExtractors gets an Url, sends an HTTP-GET-REQUEST to that URL and outputs the response as `File`. This block can be used for getting any kind of data via a HTTP-Endpoint. It should be implemented in the std-extension.
```
block MyHttpExtractor oftype HttpExtractor {
    url: "https://www.data.gouv.fr/fr/datasets/r/c4d9326f-9f41-4dfb-9746-31bc97a31fc6";
    content-type: string //the expected content-type of the http-call
}
```

### 2) ArchiveInterpreter *(Requires implementation from scratch)*
Input: File, Output: FileSystem

A ArchiveInterpreter gets a File, and initializes an FileSystem ontop of the file (open filestream etc.). Provides generic methods for navigating in the file system using paths and for accessing files. As it is not clear, what the file contains. It should be implemented in the std-extension.
```
block ZipArchiveInterpreter oftype ArchiveInterpreter{
    tbd
}
```

### 3) FilePicker *(Requires implementation from scratch)*
Input: FileSystem, Output: File

A FilePicker gets an FileSystem, navigates to the file, and initializes an file via the path.
```
block MyFilePicker oftype FilePicker{
    path: string // Absolute path to file (from the root folder) eg. /agency.txt
}
```

### 4) CSVInterpreter *(Requires minor change)*
Input: File, Output: Sheet

In the package `tabular` a `CSVFileExtractor` is already implemented, which loads a CSV from an URL and outputs a Sheet. How to implement the CSVInterpreter here (Can i introduce a new Blocktype or should I rewrite the existing `CSVFileExtractor`? If we go with the second proposition, how should i handle multiple incoming io-type as the existing Extractor has void as input, and the new Interpreter wants a file? I would suggest, to rewrite the existing example  pipelines (gas and cars), to use the new `HTTPExtractor` as well, then we just need one `CSVFileInterpreter` and now longer an `CSVFileExtractor`.

### 5) LayoutValidator and Layouts *(Requires minor change)*
Some columns in GTFS-csv-files are optional and conditional optional. For an implementation of an optional mechanism, we present the optional columns with their datatype, e.g. saying their datatype is text or undefined. For that, we'd need an undefined datatype in Jayvee and a way to combine these types using an or-expression (see chapter datatypes). For a first draft, we consider conditionally required columns as required.

```
layout agencyLayout {
		header row 1: text;
		column agency_id: text; //Conditional columns are considered as required
		column agency_name: text;
		column agency_url: text;
		column agency_timezone: text;
		column agency_lang: text or undefined; //Optional column marked with or
		column agency_phone: text or undefined; //Optional column marked with or
		column agency_fare_url: text or undefined; //Optional column marked with or
		column agency_email: text or undefined; //Optional column marked with or
	}
```

A vision is, that the GTFS-pipeline later on processes a list of GTFS-Endpoints. Because every endpoint has at least the required-columns, we need to have the optional-mechanism in our layout.

In a GTFS-Validator, some conditional (aka logical) checks could possibly be applied during the validation (not just a static header/datatype validaton). This could be done by checking required columns. If in future an conditional required is not longer considered as required, we could also implement conditional logical validation. An example for that is the columns agency_id in table agencies. The specification states, that the agency_id is optional, when the whole dataset just contains data from one agency.

**IMPORTANT:** In the GTFS specifiation, the order of the columns is not defined, so we need to access the columns by their names, not their index as every GTFS-endpoint could possibly have a different order!!

### 6) SQLiteSink *(Requires minor change)*
Input: Table, Output: void
This Block needs to be adapted, to handle multiple Inputs. As the parallel processing of the differnt files does not depend on each other, we potentially could use for every file an own SQLiteSink? We change the SQLiteSink receive the table name via the io-datatype `Table` itself. 
```
block GtfsLoader oftype SQLiteTablesLoader {
		file: "./gtfs.db";
	}
```


Not sure, how to *implement* multiple input/output of blocks (for SQLiteSink and ArchiveInterpreter)?




---
title: CSVFileExtractor
---

<!-- Do NOT change this document as it is auto-generated from the language server -->


# BlockType `CSVFileExtractor`


## Description


Fetches a CSV file from the web and interprets it as a `Sheet`.


## Attributes


- `url`: The URL to the CSV file in the web to extract.
- `delimiter`: The delimiter for values in the CSV file.


## Example 1


```
block CarsExtractor oftype CSVFileExtractor {  
  url: "tinyurl.com/4ub9spwz";
}
```
Fetches a CSV file about cars from given URL and interprets it as a `Sheet`.


## Attribute Details


### Attribute `url`


#### Description


The URL to the CSV file in the web to extract.


#### Example 1


```
url: "tinyurl.com/4ub9spwz"
```
Specifies the URL to fetch the data from.


### Attribute `delimiter`


#### Description


The delimiter for values in the CSV file.


#### Example 1


```
delimiter: ","
```
Commas are used to separate values in the CSV file.


# City names, coordinates and time zones

The location search uses GeoNames data, licensed under [Creative Commons
Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Commercial use is
permitted. Attribution: [GeoNames](https://www.geonames.org/).

## Bundled snapshot

- `server/data/locations-geonames.json.gz`: 25,286 GeoNames city records, including
  alternate names, latitude, longitude, population, country, administrative code
  and IANA time-zone identifier.
- Source: [geonamescache 1.3.0](https://github.com/yaph/geonamescache/tree/1.3.0),
  `geonamescache/cities.json`, Git blob
  `e36a92745ba8113bae7d2fe800aea97fad7bffef`.
- Source data update commit: `b8b85c38036cbecbf8dbbc6bd3db6c80845e5101`,
  2021-11-02. The source is a `cities15000` extract, covering cities with a
  population above 15,000 and capitals. It is not a complete list of every
  village, hospital or administrative area.
- Transformation: the retained fields were converted to compact JSON arrays in
  the order `id, name, country, admin1Code, latitude, longitude, timezone,
  population, alternateNames`, then gzip-compressed. No coordinates or time
  zones were inferred.
- `server/data/locations-admin1.json`: administrative area names from
  [cities.json](https://github.com/lutangar/cities.json), `admin1.json`, Git blob
  `7d22cb01ef377e9fb8fd065b837238f5be8b9b64`, retrieved 2026-09-22.
  This is also GeoNames data. Transformed from records to a code-to-name map.
- Existing curated city aliases and saved city IDs are retained by MARÉVYS.

The API returns GeoNames attribution and the city snapshot date. Its frontend
must retain a visible GeoNames link beside the city search. The dataset is
served only by the server-side functions, not downloaded by every browser.

## Operation and limits

Search works locally without an external geocoding request, API key or paid
service. It matches multilingual alternate names, accents, prefixes and
city-plus-country or city-plus-region queries, and returns at most 20 matches.
Country labels use the runtime's locale data. Some cities lack a localized
alternate name and retain the source spelling. Administrative names remain in
the source language.

Coordinates are city centres, and the source data can contain errors or stale
names. Refresh the snapshot before claiming up-to-date administrative coverage.
Historical birth-date UTC conversion uses the runtime's IANA time-zone rules;
it never derives an offset from longitude or the current date. An empty match
and a deployment asset failure are separate API states.

For source records using `Asia/Urumqi`, search offers two explicitly labelled
clock conventions for the same location: the original `geonames:<id>` uses
`Asia/Urumqi` (Xinjiang local time), and `geonames:<id>:beijing` uses
`Asia/Shanghai` (Beijing time). Users choose the convention on their birth
record. Each ID resolves its trusted coordinates and IANA zone on the server;
posted coordinates or time zones cannot silently change the selected option.
The existing curated `urumqi` ID remains Beijing time. The API's `total` counts
selectable records, including these clock-convention variants.

The public Open-Meteo service is deliberately not used: its free hosted API is
limited to non-commercial use. See [Open-Meteo terms](https://open-meteo.com/en/terms).
GeoNames' [data terms](https://www.geonames.org/export/) and
[extract format](https://download.geonames.org/export/dump/readme.txt) document
the source licence and fields.

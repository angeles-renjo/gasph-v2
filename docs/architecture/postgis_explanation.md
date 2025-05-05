# PostGIS

PostGIS is a spatial database extender for PostgreSQL. It adds support for geographic objects, allowing you to store, query, and manipulate spatial data within your database.

In the context of the `get_stations_sorted_by_distance` Supabase function, PostGIS is crucial for accurately calculating the distance between the user's location and each gas station.

Specifically, the function uses these PostGIS features:

1.  **`::geography` cast:** This converts the standard `point` data type (which represents points on a flat Cartesian plane) to the `geography` data type. The `geography` type understands that the Earth is a sphere (or spheroid) and performs calculations on the curved surface, providing much more accurate distance measurements for locations on the Earth's surface compared to simple Euclidean distance calculations on a flat plane.

2.  **`ST_MakePoint(longitude, latitude)` function:** This function creates a PostGIS point object from longitude and latitude coordinates. We use this to create point representations for both the user's location and each station's location.

3.  **`ST_Distance(geography1, geography2)` function:** This is the core function that calculates the shortest distance between two geographic objects (in our case, the user's location point and a station's location point) along the surface of the Earth. By default, it returns the distance in meters.

In simple terms, PostGIS allows our Supabase function to accurately calculate the "as the crow flies" distance between the user and each gas station, which is essential for sorting the stations by how close they are to the user. Without PostGIS, calculating accurate distances on a sphere in SQL would be significantly more complex and less efficient.

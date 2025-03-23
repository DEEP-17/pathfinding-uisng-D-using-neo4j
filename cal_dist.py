import csv
from geopy.distance import geodesic

# Load cities from CSV
cities = []
with open("india_city.csv", "r", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    for row in reader:
        cities.append((row["city_ascii"], float(row["lat"]), float(row["lng"])))

# Compute distances
with open("city_distances.csv", "w", newline="", encoding="utf-8") as file:
      writer = csv.writer(file)
      writer.writerow(["from_city", "to_city", "distance"])
      for i in range(len(cities)):
         for j in range(len(cities)):
            if(i!=j):
               city1, lat1, lon1 = cities[i]
               city2, lat2, lon2 = cities[j]
               distance = geodesic((lat1, lon1), (lat2, lon2)).meters
               if(distance<100000):
                  writer.writerow([city1,lat1,lon1, city2,lat2,lon2, distance])

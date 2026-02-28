-- Non-destructive seed data for demo locations
-- Re-running this file will not create duplicates.

INSERT INTO locations (name, description, coordinates)
SELECT
    'Ken Bahnsen Gym (MGYM)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15364203636364, 33.20996316363637), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Ken Bahnsen Gym (MGYM)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15364203636364, 33.20996316363637), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Building P (MGVP)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.16197742727273, 33.20118957272728), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Building P (MGVP)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.16197742727273, 33.20118957272728), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Waranch Tennis Complex (TENN)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.16034979230768, 33.19927106923077), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Waranch Tennis Complex (TENN)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.16034979230768, 33.19927106923077), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Environmental Education, Science & Technology (ENV SCI)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15140975322583, 33.21424553225806), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Environmental Education, Science & Technology (ENV SCI)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15140975322583, 33.21424553225806), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Chevron',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15526946, 33.21107752), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Chevron'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15526946, 33.21107752), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    '3 Aguilas Taqueria',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15552372857144, 33.21104785714285), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = '3 Aguilas Taqueria'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15552372857144, 33.21104785714285), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Murchison Performing Arts Center (PAC)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.1550760451613, 33.206380216129034), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Murchison Performing Arts Center (PAC)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.1550760451613, 33.206380216129034), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Traditions Hall (TRAD)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15577820000003, 33.210538562295085), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Traditions Hall (TRAD)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15577820000003, 33.210538562295085), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Hickory Tree Apartments',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15102547142858, 33.2150731), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Hickory Tree Apartments'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15102547142858, 33.2150731), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Support and Services Building (SSB)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.1515107, 33.20539002), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Support and Services Building (SSB)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.1515107, 33.20539002), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Pohl Recreation Center (RECS)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15399516842103, 33.21208007631579), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Pohl Recreation Center (RECS)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15399516842103, 33.21208007631579), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Sycamore Hall (SYMR)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14802914313726, 33.21215551960785), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Sycamore Hall (SYMR)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14802914313726, 33.21215551960785), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Willis Library (LIBR)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14897585599998, 33.210112052), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Willis Library (LIBR)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14897585599998, 33.210112052), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Eagle Student Services Center (ESSC)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.148096515625, 33.210265575), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Eagle Student Services Center (ESSC)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.148096515625, 33.210265575), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Hurley Administration Building (ADMN)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14850550370369, 33.211195981481474), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Hurley Administration Building (ADMN)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14850550370369, 33.211195981481474), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Business Leadership Building (BLB)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14776077916666, 33.20880338333334), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Business Leadership Building (BLB)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14776077916666, 33.20880338333334), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Highland Street Parking Garage (TS)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.145899215, 33.20889504), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Highland Street Parking Garage (TS)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.145899215, 33.20889504), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Maple Hall (MAPL)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14989997352939, 33.20782143235293), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Maple Hall (MAPL)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14989997352939, 33.20782143235293), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Clark Hall (CLAR)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15145095357143, 33.20785103214286), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Clark Hall (CLAR)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15145095357143, 33.20785103214286), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Mean Greens',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15020267777776, 33.20744426666667), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Mean Greens'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15020267777776, 33.20744426666667), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Kerr Hall (KERR)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14750513157895, 33.20774482631579), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Kerr Hall (KERR)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14750513157895, 33.20774482631579), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Life Sciences Complex (LIFE)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14892350800001, 33.212179708), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Life Sciences Complex (LIFE)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14892350800001, 33.212179708), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'General Academic Building (GAB)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.1481572285714, 33.213206514285716), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'General Academic Building (GAB)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.1481572285714, 33.213206514285716), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Sage Hall (SAGE)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14674833142857, 33.21211798857143), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Sage Hall (SAGE)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14674833142857, 33.21211798857143), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Crumley Hall (CRUM)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14944511363633, 33.209024663636356), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Crumley Hall (CRUM)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14944511363633, 33.209024663636356), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Bruce Hall (BRUC)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15009606562502, 33.2120864625), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Bruce Hall (BRUC)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15009606562502, 33.2120864625), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'McConnell Hall (MCON)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.1515613689655, 33.21230444137931), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'McConnell Hall (MCON)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.1515613689655, 33.21230444137931), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Chemistry Building (CHEM)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15016671999999, 33.21402330500001), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Chemistry Building (CHEM)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15016671999999, 33.21402330500001), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Music Practice North (MPN)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15119062380953, 33.21014712857143), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Music Practice North (MPN)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15119062380953, 33.21014712857143), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Music Practice South (MPS)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15117594210527, 33.209690168421055), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Music Practice South (MPS)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15117594210527, 33.209690168421055), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Matthews Hall (MATT)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14663239545456, 33.20988496363637), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Matthews Hall (MATT)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14663239545456, 33.20988496363637), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Wooten Hall (WH)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14567817812501, 33.209869884375), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Wooten Hall (WH)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14567817812501, 33.209869884375), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Chilton Hall (CHIL)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.1513462357143, 33.21106502857143), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Chilton Hall (CHIL)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.1513462357143, 33.21106502857143), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Cool Beans',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14594583076925, 33.214824115384616), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Cool Beans'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14594583076925, 33.214824115384616), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'The Hangar at Crash Pads',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14217822, 33.20731324), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'The Hangar at Crash Pads'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14217822, 33.20731324), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Hickory Hall (HKRY)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14794252564104, 33.21425336923077), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Hickory Hall (HKRY)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14794252564104, 33.21425336923077), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Language Building (LANG)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14665775000002, 33.214053686363634), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Language Building (LANG)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14665775000002, 33.214053686363634), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Auditorium Building (AUDB)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14727108055556, 33.214000255555554), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Auditorium Building (AUDB)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14727108055556, 33.214000255555554), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Curry Hall (CURY)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14665796, 33.21352704666667), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Curry Hall (CURY)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14665796, 33.21352704666667), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Physics Building (PHYS)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14663352666666, 33.213136526666666), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Physics Building (PHYS)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14663352666666, 33.213136526666666), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Radio, TV, Film & Performing Arts Building (RTFP)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.1458471064516, 33.212089106451614), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Radio, TV, Film & Performing Arts Building (RTFP)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.1458471064516, 33.212089106451614), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Chestnut Hall (CHNT)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15255414736843, 33.212147994736846), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Chestnut Hall (CHNT)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15255414736843, 33.212147994736846), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Physical Education Building (PEB)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15292639259258, 33.21096011111111), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Physical Education Building (PEB)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15292639259258, 33.21096011111111), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'College Inn (CINN)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15391592, 33.21373932666666), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'College Inn (CINN)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15391592, 33.21373932666666), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Union Circle Garage',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.1449852111111, 33.21102684444444), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Union Circle Garage'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.1449852111111, 33.21102684444444), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Midway Mart',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.13692562857143, 33.21498941428572), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Midway Mart'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.13692562857143, 33.21498941428572), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Rick''''s Beer Barn',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.16122759999999, 33.2106122), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Rick''''s Beer Barn'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.16122759999999, 33.2106122), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Music Annex (MUSA)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.15002755172414, 33.20970868965517), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Music Annex (MUSA)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.15002755172414, 33.20970868965517), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Terrill Hall (TH)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14959134347824, 33.213150939130436), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Terrill Hall (TH)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14959134347824, 33.213150939130436), 4326))
);

INSERT INTO locations (name, description, coordinates)
SELECT
    'Marquis Hall (MARQ)',
    'Seeded from local OSM extract',
    ST_SetSRID(ST_MakePoint(-97.14892873846154, 33.21318175769231), 4326)
WHERE NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = 'Marquis Hall (MARQ)'
      AND ST_Equals(coordinates, ST_SetSRID(ST_MakePoint(-97.14892873846154, 33.21318175769231), 4326))
);

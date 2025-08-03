-- Insert sample cinema data for testing
INSERT INTO cinemas (name, address, city, country, latitude, longitude, phone, website) VALUES 
('AMC Times Square 42', '234 W 42nd St', 'New York', 'USA', 40.7558, -73.9858, '+1-888-262-4386', 'https://www.amctheatres.com'),
('Regal LA Live', '1000 W Olympic Blvd', 'Los Angeles', 'USA', 34.0430, -118.2673, '+1-844-462-7342', 'https://www.regmovies.com'),
('Vue Leicester Square', '3 Cranbourn St', 'London', 'UK', 51.5108, -0.1299, '+44-871-224-0240', 'https://www.myvue.com'),
('Odeon Oxford Street', '30 Tottenham Ct Rd', 'London', 'UK', 51.5175, -0.1338, '+44-333-014-4501', 'https://www.odeon.co.uk'),
('Cinemark Century City', '10250 Santa Monica Blvd', 'Los Angeles', 'USA', 34.0584, -118.4134, '+1-310-553-8900', 'https://www.cinemark.com'),
('Pathé Gaumont Opéra', '2 Bd des Capucines', 'Paris', 'France', 48.8703, 2.3319, '+33-892-696-696', 'https://www.pathe.fr'),
('Cineworld Leicester Square', '5 Leicester Square', 'London', 'UK', 51.5108, -0.1299, '+44-871-200-2000', 'https://www.cineworld.com'),
('AMC Century City 15', '10250 Santa Monica Blvd', 'Los Angeles', 'USA', 34.0584, -118.4134, '+1-310-553-8900', 'https://www.amctheatres.com'),
('UGC Ciné Cité Bercy', '2 Cour Saint-Émilion', 'Paris', 'France', 48.8329, 2.3851, '+33-892-700-000', 'https://www.ugc.fr'),
('Showcase Cinema de Lux', '21 Bloomberg Pl', 'London', 'UK', 51.5139, -0.0936, '+44-871-220-1000', 'https://www.showcasecinemas.com');

-- Insert sample showtime data for testing
INSERT INTO cinema_showtimes (cinema_id, movie_id, movie_title, showtime, ticket_price, booking_url) 
SELECT 
    c.id,
    1263256,
    'Mufasa: The Lion King',
    (NOW() + INTERVAL '2 hours' + (INTERVAL '3 hours' * generate_series(0, 4))),
    15.50,
    'https://example.com/book'
FROM cinemas c
WHERE c.name LIKE 'AMC%'
LIMIT 1;

INSERT INTO cinema_showtimes (cinema_id, movie_id, movie_title, showtime, ticket_price, booking_url) 
SELECT 
    c.id,
    1100988,
    'Nosferatu',
    (NOW() + INTERVAL '1 hour' + (INTERVAL '4 hours' * generate_series(0, 3))),
    14.50,
    'https://example.com/book'
FROM cinemas c
WHERE c.name LIKE 'Regal%'
LIMIT 1;

INSERT INTO cinema_showtimes (cinema_id, movie_id, movie_title, showtime, ticket_price, booking_url) 
SELECT 
    c.id,
    980477,
    'Sonic the Hedgehog 3',
    (NOW() + INTERVAL '30 minutes' + (INTERVAL '2.5 hours' * generate_series(0, 5))),
    13.50,
    'https://example.com/book'
FROM cinemas c
WHERE c.name LIKE 'Vue%'
LIMIT 1;
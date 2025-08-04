-- Just add the cinema data for better coverage
INSERT INTO cinemas (name, address, city, country, latitude, longitude, phone, website) VALUES 
-- United States - More cities for better coverage
('AMC Empire 25', '234 W 42nd St', 'New York', 'USA', 40.7550, -73.9846, '+1-888-262-4386', 'https://www.amctheatres.com'),
('Regal Union Square', '850 Broadway', 'New York', 'USA', 40.7359, -73.9906, '+1-844-462-7342', 'https://www.regmovies.com'),
('AMC Lincoln Square 13', '1998 Broadway', 'New York', 'USA', 40.7713, -73.9834, '+1-888-262-4386', 'https://www.amctheatres.com'),
('Cinemark Chicago 18', '2600 N Western Ave', 'Chicago', 'USA', 41.9298, -87.6880, '+1-800-326-3264', 'https://www.cinemark.com'),
('AMC River East 21', '322 E Illinois St', 'Chicago', 'USA', 41.8905, -87.6200, '+1-888-262-4386', 'https://www.amctheatres.com'),
('Regal Atlantic Station', '261 19th St NW', 'Atlanta', 'USA', 33.7928, -84.3951, '+1-844-462-7342', 'https://www.regmovies.com'),
('AMC Phipps Plaza 14', '3500 Peachtree Rd NE', 'Atlanta', 'USA', 33.8459, -84.3638, '+1-888-262-4386', 'https://www.amctheatres.com'),
('Cinemark Legacy', '7200 Bishop Rd', 'Plano', 'USA', 33.0758, -96.8237, '+1-800-326-3264', 'https://www.cinemark.com'),
('AMC Northpark 15', '8687 N Central Expy', 'Dallas', 'USA', 32.8684, -96.7685, '+1-888-262-4386', 'https://www.amctheatres.com'),
('Regal Downtown West', '1000 Van Ness Ave', 'San Francisco', 'USA', 37.7877, -122.4205, '+1-844-462-7342', 'https://www.regmovies.com'),
('Cinemark Movies 14', '1334 S 119th St', 'Omaha', 'USA', 41.2364, -96.1169, '+1-800-326-3264', 'https://www.cinemark.com'),
('Regal Pointe Orlando', '9101 International Dr', 'Orlando', 'USA', 28.4430, -81.4721, '+1-844-462-7342', 'https://www.regmovies.com'),
-- Canada
('Cineplex Yonge-Dundas', '10 Dundas St E', 'Toronto', 'Canada', 43.6561, -79.3802, '+1-416-977-9262', 'https://www.cineplex.com'),
('Landmark Cinemas', '4700 Kingsway', 'Vancouver', 'Canada', 49.2321, -123.0093, '+1-604-434-7400', 'https://www.landmarkcinemas.com'),
-- Australia
('Event Cinemas George St', '505 George St', 'Sydney', 'Australia', -33.8758, 151.2065, '+61-1300-300-595', 'https://www.eventcinemas.com.au'),
('Village Cinemas Crown', '8 Whiteman St', 'Melbourne', 'Australia', -37.8263, 144.9587, '+61-1300-555-400', 'https://www.villagecinemas.com.au'),
-- European cities
('Gaumont Opéra', '2 Bd des Capucines', 'Paris', 'France', 48.8703, 2.3319, '+33-892-696-696', 'https://www.gaumont.fr'),
('CineStar IMAX', 'Potsdamer Str 4', 'Berlin', 'Germany', 52.5095, 13.3767, '+49-1805-246-378', 'https://www.cinestar.de'),
('Kinepolis Madrid', 'Calle de Raimundo Fernández', 'Madrid', 'Spain', 40.4530, -3.6845, '+34-914-444-100', 'https://kinepolis.es'),
('The Space Cinema', 'Via del Tritone 61', 'Rome', 'Italy', 41.9049, 12.4853, '+39-892-111', 'https://www.thespacecinema.it');
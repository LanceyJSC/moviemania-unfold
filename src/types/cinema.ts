export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  distance?: number;
}

export interface CinemaShowtime {
  id: string;
  cinema_id: string;
  movie_id: number;
  movie_title: string;
  showtime: string;
  ticket_price?: number;
  booking_url?: string;
}

export interface ScrapedShowtime {
  movie_title: string;
  showtime: string;
  booking_url?: string;
  ticket_price?: string;
}
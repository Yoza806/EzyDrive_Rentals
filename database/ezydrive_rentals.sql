-- ================================================================
-- EzyDrive Rentals - Simple MySQL Database
-- Import this file once using XAMPP phpMyAdmin.
-- Only three tables: users, vehicles and bookings.
-- ================================================================

CREATE DATABASE IF NOT EXISTS ezydrive_rentals
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ezydrive_rentals;

-- 1. User accounts (passwords are hashed by PHP, never plain text).
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Rental vehicles. Names are unique to avoid duplicate seed data.
CREATE TABLE IF NOT EXISTS vehicles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(40) NOT NULL,
    transmission VARCHAR(30) NOT NULL,
    fuel VARCHAR(30) NOT NULL,
    seats TINYINT UNSIGNED NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    image VARCHAR(80) NOT NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- 3. Bookings link one registered user to one vehicle.
--    Cancelling changes status, preserving the booking history.
CREATE TABLE IF NOT EXISTS bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    vehicle_id INT UNSIGNED NOT NULL,
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('Booked', 'Cancelled') NOT NULL DEFAULT 'Booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    INDEX idx_vehicle_dates (vehicle_id, pickup_date, return_date)
) ENGINE=InnoDB;

-- 4. Demo vehicles matching the 12 cards from your frontend.
--    Re-importing this file will not duplicate them.
INSERT INTO vehicles (name, category, transmission, fuel, seats, price_per_day, image) VALUES
('Toyota Corolla', 'Sedan', 'Automatic', 'Petrol', 5, 48.00, 'sedan-silver.png'),
('Nissan X-Trail', 'SUV', 'Automatic', 'Petrol', 7, 74.00, 'suv-white.png'),
('Suzuki Swift', 'Hatchback', 'Automatic', 'Petrol', 4, 39.00, 'hatchback-red.png'),
('BMW 3 Series', 'Luxury', 'Automatic', 'Petrol', 5, 95.00, 'sedan-black.png'),
('Tesla Model 3', 'Electric', 'Automatic', 'Electric', 5, 88.00, 'crossover-blue.png'),
('Toyota Hilux', 'Pickup', 'Automatic', 'Diesel', 5, 82.00, 'pickup-gray.png'),
('Honda Civic', 'Sedan', 'Automatic', 'Petrol', 5, 52.00, 'sedan-silver.png'),
('Hyundai Tucson', 'SUV', 'Automatic', 'Petrol', 5, 70.00, 'suv-white.png'),
('Kia Picanto', 'Economy', 'Automatic', 'Petrol', 4, 34.00, 'hatchback-red.png'),
('Mercedes C-Class', 'Executive', 'Automatic', 'Petrol', 5, 105.00, 'sedan-black.png'),
('Honda Vezel', 'Crossover', 'Automatic', 'Hybrid', 5, 69.00, 'crossover-blue.png'),
('Ford Ranger', 'Utility', 'Automatic', 'Diesel', 5, 86.00, 'pickup-gray.png')
ON DUPLICATE KEY UPDATE name = VALUES(name);

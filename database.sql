-- =====================================================================
-- Heartly Artisanal E-Commerce - MySQL Database Schema
-- Ready for MySQL Workbench / phpMyAdmin / MySQL CLI
-- =====================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS heartly_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE heartly_db;

-- =====================================================================
-- 2. Users Table (Authentication & Accounts)
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    avatar VARCHAR(10) DEFAULT 'H',
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 3. User Addresses Table (Saved Shipping Addresses)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(50) DEFAULT 'Home',
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(30) DEFAULT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 4. Products Table (Artisanal Catalog)
-- =====================================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    category ENUM('chocolates', 'flowers', 'wellness', 'gifts') NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    stock_quantity INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 5. Orders Table (Purchases & Shipments)
-- =====================================================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE, -- e.g. HTLY-99283
    user_id INT DEFAULT NULL,                 -- NULL if guest checkout
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(30) DEFAULT NULL,
    receiver_email VARCHAR(191) DEFAULT NULL,
    gift_message TEXT DEFAULT NULL,
    delivery_street VARCHAR(255) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_zip VARCHAR(20) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 12.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Card',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'paid',
    order_status ENUM('Order Placed', 'AI Safety Review', 'Gift Prepared', 'Out for Delivery', 'Delivered') DEFAULT 'Order Placed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 6. Order Items Table (Items in each order)
-- =====================================================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    product_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 7. Seed Sample Initial Data
-- =====================================================================

-- Demo User (Password is 'password123' - for Node.js use bcrypt.hash)
INSERT IGNORE INTO users (full_name, email, password_hash, phone, avatar) VALUES
('Harish Kumar', 'harish@heartly.gift', '$2b$10$w6GvB5t4PzGkXn9qK4Zf.u2W3H2zR8yX1o4C8l2B7p0V7s5A6F1c2', '+91 98765 43210', 'H');

-- Seed Products (Matches product.json 1-to-1)
INSERT IGNORE INTO products (id, sku, name, slug, category, description, price, image_url) VALUES
(1, 'HTY-CHOC-01', 'Golden Dairy Treat', 'golden-dairy-treat', 'chocolates', 'Rich artisanal milk chocolates with a silky caramel finish.', 28.00, 'image/dairy.jpeg'),
(2, 'HTY-FLOW-01', 'Forest Friendship Bouquet', 'forest-friendship-bouquet', 'flowers', 'A fresh meadow mix with roses, eucalyptus and subtle wildflowers.', 42.00, 'image/fox.jpeg'),
(3, 'HTY-WELL-01', 'Candlelight Calm Kit', 'candlelight-calm-kit', 'wellness', 'A hand-poured candle and calming ritual set for cozy evenings.', 33.00, 'image/lamp.jpeg'),
(4, 'HTY-WELL-02', 'Morning Ritual Tea', 'morning-ritual-tea', 'wellness', 'A bright tea blend designed to awaken the senses and inspire the day.', 24.00, 'image/2cup.jpeg'),
(5, 'HTY-CHOC-02', 'Berry Charm Treat', 'berry-charm-treat', 'chocolates', 'Sweet berry bites with a creamy center and crisp shell.', 26.00, 'image/bcup.jpeg'),
(6, 'HTY-GIFT-01', 'Delightful Keepsake Doll', 'delightful-keepsake-doll', 'gifts', 'A handcrafted plush companion with artisanal details.', 37.00, 'image/doll.jpeg'),
(7, 'HTY-WELL-03', 'Serene Soap Trio', 'serene-soap-trio', 'wellness', 'Three scented botanical soaps made for gentle, luxurious care.', 19.00, 'image/lamp.jpeg'),
(8, 'HTY-CHOC-03', 'Sunset Tea Set', 'sunset-tea-set', 'chocolates', 'An elegant tea set with artisan blends and a gift-ready box.', 49.00, 'image/2cup.jpeg'),
(9, 'HTY-FLOW-02', 'Velvet Rose Arrangement', 'velvet-rose-arrangement', 'flowers', 'Classic roses arranged in a luxurious velvet wrap.', 58.00, 'image/fox.jpeg'),
(10, 'HTY-FLOW-03', 'Morning Bloom Basket', 'morning-bloom-basket', 'flowers', 'A cheerful basket of seasonal flowers with fresh green accents.', 47.00, 'image/dairy.jpeg'),
(11, 'HTY-WELL-04', 'Lavender Rest Set', 'lavender-rest-set', 'wellness', 'A soothing set with lavender balm and botanical mist.', 34.00, 'image/fox.jpeg'),
(12, 'HTY-CHOC-04', 'Sugar & Spice Treat', 'sugar-and-spice-treat', 'chocolates', 'A warm baked-inspired collection for cozy celebrations.', 31.00, 'image/2cup.jpeg');

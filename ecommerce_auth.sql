CREATE DATABASE ecommerce_auth1;

USE ecommerce_auth1;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL,
    otp VARCHAR(6),
    otp_expiry DATETIME
);

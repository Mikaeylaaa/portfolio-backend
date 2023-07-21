// src/db.ts
import mysql, { FieldPacket, RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Create a connection pool to the MySQL database
export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Create the "users" table
export async function createUsersTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(50) NOT NULL
      )
    `;

    await pool.query(createTableQuery);
    console.log('Table "users" created successfully!');
}

// Create the "items" table
export async function createItemsTable() {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      item_price DECIMAL(10, 2) NOT NULL,
      start_bidding_time DATETIME NOT NULL,
      end_bidding_time DATETIME NOT NULL,
      owner_id INT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

    await pool.query(createTableQuery);
    console.log('Table "items" created successfully!');
}

// Create the "bids" table
export async function createBidsTable() {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS bids (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_id INT NOT NULL,
      bidder_id INT NOT NULL,
      bid_amount DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

    await pool.query(createTableQuery);
    console.log('Table "bids" created successfully!');
}

// Create the "deposits" table
export async function createDepositsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS deposits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    await pool.query(createTableQuery);
    console.log('Table "deposits" created successfully!');
}

export async function checkDatabaseConnection() {
    try {
        const connection = await pool.getConnection(); // Get a connection from the pool

        connection.release(); // Release the connection immediately after testing



        console.log('Database connection is successful, and all required tables exist.');
        return true;

    } catch (error) {
        console.error('Error checking the database connection:', error);
    }
}
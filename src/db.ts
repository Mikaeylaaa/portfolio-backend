// src/db.ts
import mysql, {
  FieldPacket,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import dotenv from "dotenv";
import { Users } from "./types";
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

export async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection(); // Get a connection from the pool
    connection.release(); // Release the connection immediately after testing

    console.log(
      "Database connection is successful, and all required tables exist."
    );
    return true;
  } catch (error) {
    console.error("Error checking the database connection:", error);
  }
}

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

export async function createItemsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      itemName VARCHAR(255) NOT NULL,
      itemPrice DECIMAL(10, 2) NOT NULL,
      timeWindowHours INT NOT NULL,
      timeWindowMinutes INT NOT NULL,
      state ENUM('draft', 'published') NOT NULL DEFAULT 'draft'
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
      itemId INT NOT NULL,
      bidderId INT NOT NULL,
      bidAmount DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (bidderId) REFERENCES users(id) ON DELETE CASCADE
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
        userId INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

  await pool.query(createTableQuery);
  console.log('Table "deposits" created successfully!');
}

// GET users
export async function getUsers(
  email: string,
  password: string
): Promise<RowDataPacket[] | null> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );
    if (rows.length === 0) {
      return null; // User not found with provided credentials
    }
    connection.release();
    return rows;
  } catch (error) {
    console.error("Error during login:", error);
    throw new Error("Login failed");
  }
}

export async function findUserByEmail(
  email: string
): Promise<RowDataPacket | null> {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // If no user found with the provided email, return null
    if (!rows || rows.length === 0) {
      return null;
    }

    // Assuming the 'users' table has 'id', 'email', and 'password' columns
    const user = rows[0];
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function findUserById(id: number): Promise<RowDataPacket | null> {
  const connection = await pool.getConnection();
  const [users] = await connection.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  if (users.length === 0) return null;
  return users[0];
}

// POST - Create users
export async function createUser(email: string, password: string) {
  const connection = await pool.getConnection();
  // Perform the insert operation
  try {
    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, password]
    );
    connection.release();
    return result.insertId;
  } catch (error) {
    console.error("Error executing database query:", error);
    connection.release();
    throw error; // Rethrow the error to be caught in the route handler
  }
}

// POST - Create item
export async function createItem(
  itemName: string,
  itemPrice: number,
  timeWindowHours: number,
  timeWindowMinutes: number,
  state: "draft" | "published" // Add the 'state' parameter
) {
  const connection = await pool.getConnection();
  // Perform the insert operation
  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO items (itemName, itemPrice, timeWindowHours, timeWindowMinutes, state) VALUES (?, ?, ?, ?, ?)",
    [itemName, itemPrice, timeWindowHours, timeWindowMinutes, state] // Include the 'state' value in the query
  );
  connection.release();
  return result.insertId;
}

// PUT Update item state to publish
export async function updateItemStateToPublished(
  itemId: number
): Promise<ResultSetHeader> {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      "UPDATE items SET state = 'published' WHERE id = ?",
      [itemId]
    );
    connection.release();
    console.log(`Item with ID ${itemId} updated to 'published' state.`);
    return result;
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
}

// PUT - Update Item details from Draft state
export async function updateItemDetails(
  itemId: number,
  itemName: string,
  itemPrice: number,
  timeWindowHours: number,
  timeWindowMinutes: number
): Promise<ResultSetHeader> {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      "UPDATE items SET itemName = ?, itemPrice = ?, timeWindowHours = ?, timeWindowMinutes = ? WHERE id = ?",
      [itemName, itemPrice, timeWindowHours, timeWindowMinutes, itemId]
    );
    connection.release();
    console.log(`Updated ${result.affectedRows} row(s) in the items table.`);
    return result;
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
}

// PUT - Update item's price by id
export async function updateItemPriceById(itemId: number, itemPrice: number) {
  const connection = await pool.getConnection();
  // Perform the update operation
  const [result] = await connection.query<ResultSetHeader>(
    "UPDATE items SET itemPrice = ? WHERE id = ?",
    [itemPrice, itemId]
  );
  connection.release();
  return result;
}

// DELETE item from Draft state

export async function deleteItem(itemId: number): Promise<ResultSetHeader> {
  try {
    const connection = await pool.getConnection();

    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM items WHERE id = ?",
      [itemId]
    );
    console.log(`Deleted ${result.affectedRows} row(s) from the items table.`);
    return result;
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
}

export async function getExistingItems(
  itemName: string,
  itemPrice: number,
  timeWindowHours: number,
  timeWindowMinutes: number
): Promise<RowDataPacket[] | null> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM items WHERE itemName = ? AND itemPrice = ? AND timeWindowHours = ? AND timeWindowMinutes = ?",
      [itemName, itemPrice, timeWindowHours, timeWindowMinutes]
    );
    if (rows.length === 0) {
      return null; // User not found with provided credentials
    }
    connection.release();
    return rows;
  } catch (error) {
    console.error("Error in fetching existing bid items:", error);
    throw new Error("Fetching of current bid items failed");
  }
}

// SELECT - Fetch 'published' items from the database
export async function getPublishedtems() {
  const connection = await pool.getConnection();
  const [rows] = await connection.query(
    "SELECT * FROM items WHERE state = 'published'"
  );
  connection.release();
  return rows;
}

// GET all items
export async function getAllItems() {
  const connection = await pool.getConnection();
  const [rows] = await connection.query("SELECT * FROM items");
  connection.release();
  return rows;
}

// POST - Create bid
export async function createBid(
  itemId: number,
  bidderId: number,
  bidAmount: number
) {
  const connection = await pool.getConnection();
  // Perform the insert operation
  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO bids (itemId, bidderId, bidAmount) VALUES (?, ?, ?)",
    [itemId, bidderId, bidAmount]
  );
  connection.release();
  return result.insertId;
}

// PUT - Update bid amount higher than the current price
export async function updateBid(
  bidId: number,
  newBidAmount: number
): Promise<ResultSetHeader> {
  try {
    // Get the current bid details from the database
    const [bidRows]: [RowDataPacket[], FieldPacket[]] = await pool.query(
      "SELECT itemId, bidAmount FROM bids WHERE id = ?",
      [bidId]
    );
    if (bidRows.length === 0) {
      throw new Error("Bid not found");
    }
    const currentItemId = bidRows[0].item_id;
    const currentBidAmount = bidRows[0].bid_amount;

    // Get the item details from the database
    const [itemRows]: [RowDataPacket[], FieldPacket[]] = await pool.query(
      "SELECT itemPrice FROM items WHERE id = ?",
      [currentItemId]
    );
    if (itemRows.length === 0) {
      throw new Error("Item not found");
    }
    const startingPrice = itemRows[0].starting_price;

    // Get the current highest bid amount from the database
    const [highestBidRows]: [RowDataPacket[], FieldPacket[]] = await pool.query(
      "SELECT MAX(bidAmount) as highestBidAmount FROM bids WHERE itemId = ?",
      [currentItemId]
    );
    const currentHighestBidAmount = highestBidRows[0].highest_bid_amount;

    if (
      newBidAmount > startingPrice &&
      newBidAmount > currentHighestBidAmount
    ) {
      // Perform the update operation
      const [result] = await pool.query<ResultSetHeader>(
        "UPDATE bids SET bidAmount = ? WHERE id = ?",
        [newBidAmount, bidId]
      );
      console.log(`Updated ${result.affectedRows} row(s) in the bids table.`);
      return result;
    } else {
      throw new Error(
        "New bid amount must be higher than the item's starting price and the current highest bid amount."
      );
    }
  } catch (error) {
    console.error("Error updating bid:", error);
    throw error;
  }
}

//GET all bids
export async function getAllBids() {
  const connection = await pool.getConnection();
  const [rows] = await connection.query("SELECT * FROM bids");
  connection.release();
  return rows;
}

// GET - Fetch users data from database
export async function getUsersData(userId: number) {
  try {
    const connection = await pool.getConnection();
    // Check if the user exists
    const [user] = await connection.query<ResultSetHeader[]>(
      "SELECT id FROM users WHERE id = ?",
      [userId]
    );

    if (user.length === 0) {
      return null;
    } else {
      return user[0];
    }
  } catch (error) {
    console.error("Error fetching users data:", error);
    throw error;
  }
}

// POST - Create deposit
export async function createDeposit(userId: number, amount: number) {
  const connection = await pool.getConnection();
  // Perform the insert operation
  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO deposits (userId, amount) VALUES (?, ?)",
    [userId, amount]
  );
  connection.release();
  return result.insertId;
}

//GET all deposits
export async function getAllDeposits() {
  const connection = await pool.getConnection();
  const [rows] = await connection.query("SELECT * FROM deposits");
  connection.release();
  return rows;
}

// src/db.ts
import mysql, {
  FieldPacket,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import dotenv from "dotenv";
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

// Create the "items" table
export async function createItemsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      item_price DECIMAL(10, 2) NOT NULL,
      time_window DATETIME NOT NULL,
      item_status VARCHAR(100) NOT NULL,
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

// POST - Create users
export async function createUser(email: string, password: string) {
  const connection = await pool.getConnection();
  // Perform the insert operation
  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, password]
  );
  connection.release();
  return result.insertId;
}

// POST - Create item
export async function createItem(
  itemName: string,
  itemPrice: number,
  timeWindow: number,
  itemStatus: string
) {
  const connection = await pool.getConnection();
  // Perform the insert operation
  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO items (item_name, item_price, time_window, item_status) VALUES (?, ?, ?)",
    [itemName, itemPrice, timeWindow, itemStatus]
  );
  connection.release();
  return result.insertId;
}

// PUT - Update Item details from Draft state

export async function updateItemDetails(
  itemId: number,
  itemName: string,
  itemPrice: number,
  timeWindow: string,
  itemStatus: string
): Promise<ResultSetHeader> {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      "UPDATE items SET item_name = ?, item_price = ?, time_window = ?, item_status = ? WHERE id = ?",
      [itemName, itemPrice, timeWindow, itemStatus, itemId]
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
    "UPDATE items SET item_price = ? WHERE id = ?",
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

// GET items by item status (Ongoing or Completed)

export async function getItemsByStatus(
  itemStatus: string
): Promise<RowDataPacket[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM items WHERE item_status = ?",
      [itemStatus]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching items:", error);
    throw error;
  }
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
    "INSERT INTO bids (item_id, bidder_id, bid_amount) VALUES (?, ?, ?)",
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
      "SELECT item_id, bid_amount FROM bids WHERE id = ?",
      [bidId]
    );
    if (bidRows.length === 0) {
      throw new Error("Bid not found");
    }
    const currentItemId = bidRows[0].item_id;
    const currentBidAmount = bidRows[0].bid_amount;

    // Get the item details from the database
    const [itemRows]: [RowDataPacket[], FieldPacket[]] = await pool.query(
      "SELECT item_price FROM items WHERE id = ?",
      [currentItemId]
    );
    if (itemRows.length === 0) {
      throw new Error("Item not found");
    }
    const startingPrice = itemRows[0].starting_price;

    // Get the current highest bid amount from the database
    const [highestBidRows]: [RowDataPacket[], FieldPacket[]] = await pool.query(
      "SELECT MAX(bid_amount) as highest_bid_amount FROM bids WHERE item_id = ?",
      [currentItemId]
    );
    const currentHighestBidAmount = highestBidRows[0].highest_bid_amount;

    if (
      newBidAmount > startingPrice &&
      newBidAmount > currentHighestBidAmount
    ) {
      // Perform the update operation
      const [result] = await pool.query<ResultSetHeader>(
        "UPDATE bids SET bid_amount = ? WHERE id = ?",
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

// POST - Create deposit
export async function createDeposit(userId: number, amount: number) {
  const connection = await pool.getConnection();
  // Perform the insert operation
  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO deposits (user_id, amount) VALUES (?, ?)",
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

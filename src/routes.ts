import express, { Router, Request, Response, NextFunction } from "express";
import {
  Connection,
  FieldPacket,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import {
  createBid,
  createDeposit,
  createItem,
  createUser,
  deleteItem,
  findUserByEmail,
  findUserById,
  getAllBids,
  getAllDeposits,
  getAllItems,
  getExistingItems,
  getPublishedtems,
  getUsers,
  getUsersData,
  pool,
  updateBid,
  updateItemDetails,
  updateItemPriceById,
  updateItemStateToPublished,
} from "./db";
import { BiddingItem, Users } from "./types";

const router = express.Router();

// USERS table
// Create a new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // Check if the username already exists in the database
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // If the email is unique, insert the new user into the database
    const userId = await createUser(email, password);

    res.status(201).json({ message: "Successfully registered!", userId });
  } catch (error) {
    console.error("Error during registration:", error);
    res
      .status(500)
      .json({ error: "Registration failed. Internal Server Error" });
  }
});

// Get all users
router.get("/login", async (req: Request, res: Response) => {
  const { email, password } = req.query;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const rows = await getUsers(email as string, password as string);

    if (!rows) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Return the user data or a success message if needed
    res.status(200).json({ message: "Login successful", user: rows[0] });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// ITEMS table

// Create item to bid
router.post("/items", async (req: Request, res: Response) => {
  try {
    const newBiddingItem: BiddingItem = req.body;
    const { itemName, itemPrice, timeWindowHours, timeWindowMinutes, state } =
      newBiddingItem;
    const itemId = await createItem(
      itemName,
      itemPrice,
      timeWindowHours,
      timeWindowMinutes,
      state
    );

    res.status(201).json({ message: "Item added successfully!", itemId });
  } catch (error) {
    console.error("Error in adding items to bid:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update item state to 'published'
router.put(
  "/bidding-items/:itemId/publish",
  async (req: Request, res: Response) => {
    try {
      const itemId = Number(req.params.itemId); // Extract the itemId from the URL parameter

      // Update the state of the item to 'published'
      await updateItemStateToPublished(itemId);

      res.status(200).json({ message: "Item published successfully" });
    } catch (error) {
      console.error("Error publishing item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route to update an item's price by id
router.put("/items/:itemId", async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.itemId);
  const newItemPrice = parseFloat(req.body.itemPrice); // Assuming you receive the new item price in the request body

  try {
    const result = await updateItemPriceById(itemId, newItemPrice);
    res.json({ message: "Item updated successfully." });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to update item details by id
router.put("/items/:itemId", async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.itemId);
  const { itemName, itemPrice, timeWindowHours, timeWindowMinutes } = req.body;

  try {
    const result = await updateItemDetails(
      itemId,
      itemName,
      itemPrice,
      timeWindowHours,
      timeWindowMinutes
    );
    res.json({ message: "Item updated successfully." });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to delete an item
router.delete("/items/:itemId", async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.itemId);

  try {
    const result = await deleteItem(itemId);
    res.json({ message: "Item deleted successfully." });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get published items for bidding

router.get("/published-items", async (req: Request, res: Response) => {
  try {
    const items = await getPublishedtems();
    console.log("Success in fetching published items!");

    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching 'published' items:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get existing items available for bidding
router.get("/existing-items", async (req: Request, res: Response) => {
  const {
    itemName,
    itemPrice,
    timeWindowHours,
    timeWindowMinutes,
    state = "draft",
  } = req.query;

  // Check if all the required parameters are provided in the query string
  if (
    !itemName ||
    !itemPrice ||
    !timeWindowHours ||
    !timeWindowMinutes ||
    state
  ) {
    return res
      .status(400)
      .json({ error: "Please provide all the required parameters." });
  }

  try {
    const rows = await getExistingItems(
      itemName as string,
      Number(itemPrice),
      Number(timeWindowHours),
      Number(timeWindowMinutes)
    );

    if (!rows) {
      return res
        .status(404)
        .json({ error: "No matching bidding items found." });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error in fetching existing bid items:", error);
    res.status(500).json({ error: "Fetching of current bid items failed." });
  }
});

// Route to get all items available for bidding
router.get("/items", async (req: Request, res: Response) => {
  try {
    const items = await getAllItems();
    console.log("Success in fetching all items!");

    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to place a bid on an item
router.post("/bid", async (req: Request, res: Response) => {
  try {
    const { itemId, bidderId, bidAmount } = req.body;
    const bidId = await createBid(itemId, bidderId, bidAmount);

    res.status(201).json({ message: "Bid placed successfully!", bidId });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to update a bid
router.put("/bids/:bidId", async (req: Request, res: Response) => {
  const bidId = parseInt(req.params.bidId);
  const newBidAmount = parseFloat(req.body.bidAmount); // Assuming you receive the new bid amount in the request body

  try {
    const result = await updateBid(bidId, newBidAmount);
    res.status(200).json({ message: "Bid updated successfully." });
  } catch (error) {
    console.error("Error updating bid:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get all bids
router.get("/bid", async (req: Request, res: Response) => {
  try {
    const bids = await getAllBids();

    console.log("Success in fetching all bids!");

    res.status(200).json(bids);
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/user", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }

    const connection = await pool.getConnection();
    const [user] = await connection.query(
      "SELECT id, email FROM users WHERE email = ?",
      [email]
    );
    connection.release();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to deposit of money
router.post("/deposits", async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    const user = await getUsersData(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const depositId = await createDeposit(userId, amount);

    res
      .status(201)
      .json({ message: "Deposit money placed successfully!", depositId });
  } catch (error) {
    console.error("Error placing deposit money:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get all deposit money
router.get("/deposit", async (req: Request, res: Response) => {
  try {
    const deposits = await getAllDeposits();
    console.log("Success in fetching all deposits!");

    res.status(200).json(deposits);
  } catch (error) {
    console.error("Error fetching deposits:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

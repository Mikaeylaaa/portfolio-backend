import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2/promise";
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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Create a new user responsible for User Registration
 *     tags: [Users]
 *     requestBody:
 *       description: Creates a new user by accepting the email and password in the request body. Checks if the email is unique and registers the user accordingly.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: number
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
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

/**
 * @swagger
 * /login:
 *   get:
 *     summary: Get users information responsible for User Login
 *     description: Handles user login by verifying the provided email and password. Returns the user data upon successful login.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: User's email address.
 *       - in: query
 *         name: password
 *         schema:
 *           type: string
 *         required: true
 *         description: User's password.
 *     responses:
 *       200:
 *         description: Success. Returns an array of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad Request. Missing email or password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized. Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
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

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create an item to bid
 *     description: Creates a new bidding item by accepting the item details such as name, price, time window, and state.
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BiddingItem'
 *     responses:
 *       201:
 *         description: Success. Returns the ID of the newly created item.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 itemId:
 *                   type: number
 *       500:
 *         description: Internal Server Error. Something went wrong while adding the item.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /bidding-items/:itemId/publish:
 *   put:
 *     summary: Update an item's state to 'published'
 *     description: Updates the state of a bidding item to 'published', enabling it for bidding.
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the item to be published.
 *     responses:
 *       200:
 *         description: Success. Item state updated to 'published'.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal Server Error. Something went wrong while publishing the item.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
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

/**
 * @swagger
 * /items/:itemId:
 *   put:
 *     summary: Update an item's price by ID
 *     description: Updates the price of a specific item identified by its ID.
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the item to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemPrice:
 *                 type: number
 *             required:
 *               - itemPrice
 *     responses:
 *       200:
 *         description: Success. Item price updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal Server Error. Something went wrong while updating the item's price.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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
/**
 * @swagger
 * /items/:itemId:
 *   put:
 *     summary: Update item details by ID
 *     description: Updates the details of a specific item identified by its ID.
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the item to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BiddingItem'
 *     responses:
 *       200:
 *         description: Success. Item details updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal Server Error. Something went wrong while updating the item details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /items/:itemId:
 *   delete:
 *     summary: Delete an item by ID
 *     description: Deletes an item with the specified ID.
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the item to be deleted.
 *     responses:
 *       200:
 *         description: Success. Item deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal Server Error. Something went wrong while deleting the item.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /published-items:
 *   get:
 *     summary: Get published items for bidding
 *     description: Fetches all items that are in the 'published' state, available for bidding.
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Success. Published items fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BiddingItem'
 *       500:
 *         description: Internal Server Error. Something went wrong while fetching published items.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /existing-items:
 *   get:
 *     summary: Get existing items available for bidding
 *     description: Retrieves existing items available for bidding based on item name, item price, time window, and state.
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: itemName
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the item to search for.
 *       - in: query
 *         name: itemPrice
 *         schema:
 *           type: number
 *         required: true
 *         description: Price of the item to search for.
 *       - in: query
 *         name: timeWindowHours
 *         schema:
 *           type: number
 *         required: true
 *         description: Time window hours of the item to search for.
 *       - in: query
 *         name: timeWindowMinutes
 *         schema:
 *           type: number
 *         required: true
 *         description: Time window minutes of the item to search for.
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: false
 *         description: State of the item to search for (default: 'draft').
 *     responses:
 *       200:
 *         description: Success. Existing items fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BiddingItem'
 *       400:
 *         description: Bad Request. Please provide all the required parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Not Found. No matching bidding items found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal Server Error. Something went wrong while fetching existing bid items.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items available for bidding
 *     description: Fetch all items available for bidding.
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Success. All items fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BiddingItem'
 *       500:
 *         description: Internal Server Error. Something went wrong while fetching items.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /bid:
 *   post:
 *     summary: Place a bid on an item
 *     description: Places a bid on an item by accepting the item ID, bidder ID, and bid amount.
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: integer
 *               bidderId:
 *                 type: integer
 *               bidAmount:
 *                 type: number
 *             required:
 *               - itemId
 *               - bidderId
 *               - bidAmount
 *     responses:
 *       201:
 *         description: Success. Bid placed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 bidId:
 *                   type: integer
 *       500:
 *         description: Internal Server Error. Something went wrong while placing the bid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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
/**
 * @swagger
 * /bids/{bidId}:
 *   put:
 *     summary: Update a bid's amount
 *     description: Updates the bid amount of a specific bid identified by its ID.
 *     tags: [Bids]
 *     parameters:
 *       - in: path
 *         name: bidId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the bid to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bidAmount:
 *                 type: number
 *             required:
 *               - bidAmount
 *     responses:
 *       200:
 *         description: Success. Bid updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal Server Error. Something went wrong while updating the bid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /bid:
 *   get:
 *     summary: Get all bids
 *     description: Retrieves all bids placed on items.
 *     tags: [Bids]
 *     responses:
 *       200:
 *         description: Success. All bids fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bid'
 *       500:
 *         description: Internal Server Error. Something went wrong while fetching bids.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get user's data by email
 *     description: Fetches user data by accepting the email parameter in the query.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email address of the user to fetch.
 *     responses:
 *       200:
 *         description: Success. User fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *       400:
 *         description: Bad Request. Email parameter is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Not Found. User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal Server Error. Something went wrong while fetching the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

/**
 * @swagger
 * /deposits:
 *   post:
 *     summary: Deposit money
 *     description: Deposits money for a user by accepting the user ID and amount in the request body.
 *     tags: [Deposits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               amount:
 *                 type: number
 *             required:
 *               - userId
 *               - amount
 *     responses:
 *       201:
 *         description: Success. Deposit money placed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 depositId:
 *                   type: integer
 *       500:
 *         description: Internal Server Error. Something went wrong while placing the deposit money.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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
/**
 * @swagger
 * /deposit:
 *   get:
 *     summary: Get all deposit money
 *     description: Retrieves all deposit transactions.
 *     tags: [Deposits]
 *     responses:
 *       200:
 *         description: Success. All deposit money details fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deposit'
 *       500:
 *         description: Internal Server Error. Something went wrong while fetching deposit money details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

import express, { Router, Request, Response, NextFunction } from 'express';
import { Connection, FieldPacket, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';

const router = express.Router();

//USERS table
// Create a new user
router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const connection = await pool.getConnection();

        // Perform the insert operation
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, password]
        );
        connection.release();
        // Access the insertId from the first element of the result array
        const userId = result?.insertId;

        res.status(201).json({ message: 'User created successfully!', userId });
    } catch (error) {
        next(error);
    }
});

// Get all users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const connection = await pool.getConnection();
        // Perform the select operation
        const [users] = await connection.query<ResultSetHeader>('SELECT * FROM users');
        connection.release();

        console.log('Success in fetching all users!');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ITEMS table
// Route to get all items available for bidding
router.get('/items', async (req: Request, res: Response) => {
    try {
        const connection = await pool.getConnection();
        const [items] = await connection.query<ResultSetHeader>('SELECT * FROM items');

        console.log('Success in fetching all items!');

        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to place a bid on an item
router.post('/bid', async (req: Request, res: Response) => {
  const { itemId, bidderId, bidAmount } = req.body;
  try {
    const connection = await pool.getConnection();

    await connection.execute('INSERT INTO bids (item_id, bidder_id, bid_amount) VALUES (?, ?, ?)', [
      itemId,
      bidderId,
      bidAmount,
    ]);
    res.json({ message: 'Bid placed successfully' });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to get all bids
router.get('/bid', async (req: Request, res: Response) => {
    try {
        const connection = await pool.getConnection();
        const [bids] = await connection.query<ResultSetHeader>('SELECT * FROM bids');

        console.log('Success in fetching all bids!');
        
        res.status(200).json(bids);
    } catch (error) {
        
        console.error('Error fetching bids:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to deposit of money
router.post('/deposit', async (req: Request, res: Response) => {
    const { userId, amount} = req.body;
    try {
      const connection = await pool.getConnection();
  
      await connection.execute('INSERT INTO deposits (user_id, amount) VALUES (?, ?)', [
        userId,
        amount
      ]);
      res.json({ message: 'Deposit money placed successfully' });
    } catch (error) {
      console.error('Error placing deposit money:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Route to get all bids
  router.get('/deposit', async (req: Request, res: Response) => {
      try {
          const connection = await pool.getConnection();
          const [deposits] = await connection.query<ResultSetHeader>('SELECT * FROM deposits');

          console.log('Success in fetching all deposits!');

          res.status(200).json(deposits);
      } catch (error) {
          
          console.error('Error fetching deposits:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });

export default router;

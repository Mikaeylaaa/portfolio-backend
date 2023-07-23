// src/app.ts
import express, { Application, Request, Response } from "express";
import {
  checkDatabaseConnection,
  createBidsTable,
  createDepositsTable,
  createItemsTable,
  createUsersTable,
} from "./db";
import router from "./routes";
import cors from 'cors';

const app: Application = express();
const PORT: number = 8082;

app.use(express.json());
app.use(cors()); // Enable CORS for all origins

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Bidding System API");
});

app.use("/api", router);

// Start the Express.js server
(async () => {
  try {
    // Check the database connection and table existence
    const isConnected = await checkDatabaseConnection();

    if (!isConnected) {
      console.error(
        "Failed to connect to the database or missing required tables. Exiting..."
      );
      process.exit(1);
    }

    //Create the required tables
    await createUsersTable();
    await createItemsTable();
    await createBidsTable();
    await createDepositsTable();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error initializing the application:", error);
    process.exit(1);
  }
})();

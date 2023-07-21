// src/app.ts
import express, { Application, Request, Response } from 'express';
import { checkDatabaseConnection, createBidsTable, createDepositsTable, createItemsTable, createUsersTable } from './db';
import router from './routes';

const app: Application = express();
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(cors());

// const port = process.env.PORT || 3000;
const PORT: number = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Bidding System API');
});

app.use(router);

// Start the Express.js server
(async () => {
    try {
        // Check the database connection and table existence
        const isConnected = await checkDatabaseConnection();

        if (!isConnected) {
            console.error('Failed to connect to the database or missing required tables. Exiting...');
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
        console.error('Error initializing the application:', error);
        process.exit(1);
    }
})();
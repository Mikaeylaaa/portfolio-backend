# Online Auction System (Back end)

This project acts as the back end of Online Auction System built in Express JS, MySQL Database Server and mysql2 Node.js Driver.

## Back-end Tech stack used:

To integrate this project with back-end framework, it is built with the following:

- **Express.js with TypeScript**: Express.js is a popular Node.js web application framework, and in this project, it is used with TypeScript to provide a type-safe and structured approach to server-side development.

- **MySQL Database**: MySQL is used as the relational database management system (RDBMS) to store and manage application data.

- **mysql2**: `mysql2` is a Node.js driver for MySQL that provides fast and efficient access to the MySQL database server.

- **Swagger**: `Swagger` is a tool and a specification for describing and documenting APIs (Application Programming Interfaces). It uses the OpenAPI Specification (OAS) format, which provides a standardized way to define RESTful APIs.

# Pre requisites

Below is the sample content for `.env` file:

```bash
DB_HOST=localhost

DB_USER=<your-username>

DB_PASSWORD=<your-password>

DB_NAME=bidding_system_db

PORT=8082

```

Since this project is using `MySQL` as its relational database management system (RDBMS), you can install `MYSQL server` on a terminal or download from: (https://dev.mysql.com/downloads/mysql/).

**To download/install `MYSQL server` in terminal:**

## Using Mac terminal:

First, you can do **`Homebrew installation'** by running the command below:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Then, install `MySQL` by running the command below:**

```bash
brew install mysql
```
**Once the installation is done, you can now start running MySQL server through the terminal command below:**

```bash
brew services start mysql
```
**Secure MySQL Installation (Optional but Recommended):**

By default, MySQL installation is not secured. To enhance security, you should run the following command and follow the prompts to set a root password and remove some unnecessary user accounts:

```bash
mysql_secure_installation
```

**Finally, you can access 'MySQL'. Make sure to set up your desired username and password. It will prompt you to enter the root password you set during the secure installation step.**

```bash
mysql -u root -p
```

## Using Windows Terminal

**Download MySQL Installer** by accessing their official website:(https://dev.mysql.com/downloads/installer/) and download the MySQL Installer for Windows.

**Run the MySQL Installer**
Once the download is complete, run the MySQL Installer executable (.exe) file. It will open the MySQL Installer Wizard.

**Choose Setup Type:**
In the MySQL Installer Wizard, you'll be presented with different setup types. Select "Developer Default" or "Server only" depending on your needs. The "Developer Default" option includes MySQL Server and various development components, while the "Server only" option installs just the MySQL Server.

**Select Products and Features:**
If you chose "Developer Default," the installer will provide a list of available products and features to install. You can customize the installation by selecting or deselecting specific components. For most cases, the default selections should be sufficient.

**MySQL Server Configuration:**
Next, the installer will prompt you to configure the MySQL Server. You can choose a port number, set the root password, and configure other options as needed.

**Start the Installation:**
Once you have chosen your configurations, click on the "Execute" button to start the installation process.

**Complete the Installation:**
The installer will now download and install the selected components. Once the installation is complete, click on the "Finish" button.

**Add MySQL to the System PATH (Optional):**
By default, the MySQL executable files might not be added to the system PATH, which means you need to provide the full path to the MySQL commands each time you want to use them. If you want to avoid this, you can add MySQL to the system PATH. To do this, find the MySQL bin directory (e.g., C:\Program Files\MySQL\MySQL Server X.X\bin) and add it to the PATH environment variable.

**Verify the Installation:**
Open the Windows Command Prompt or PowerShell and run the following command to check if MySQL is properly installed:

```bash
mysql --version
```
This command should display the MySQL version number, indicating that MySQL is successfully installed.

**To run in either command prompt or powershell, simply run the command `mysql`.**

## Running the API endpoints via `Postman' application

Download the `Postman` application by accessing their official website at [https://www.postman.com/downloads/](https://www.postman.com/downloads/).

## Installation

Clone the repository:

```bash
git clone https://github.com/Mikaeylaaa/full-stack-coding-assignment-backend.git
```
## Project Structure

```bash
project-root/
├── src/
│   ├── app.ts
│   ├── routes.ts
│   └── db.ts
├── node_modules/
├── package.json
├── tsconfig.json
└── .env
```

Below is the directory/folder structure for this project:

 - **`node_modules/`**: Stores all the project dependencies installed via npm or yarn.
 - **`src`**: The source code directory where all the TypeScript files are located.
 - **`src/app.ts`**: The entry point of the application where the Express app is initialized and configured.
 - **`src/db.ts`**:  The database configuration file that establishes the connection to the MySQL server using mysql2 and contains the SQL Query function calls.
 - **`src/routes.ts`**: Defines the API endpoints and their methods.
 - **`package.json`**: The npm package configuration file that includes project details, dependencies, and scripts.
 - **`tsconfig.json`**: The TypeScript compiler configuration file that specifies the TypeScript compilation options and project settings.
 - **`.env`**: The environment variables file containing sensitive or configurable settings, such as database credentials.

## Requirements

- [NodeJS >= 10](https://nodejs.org/en/download/)
- [Yarn >= 1.21](https://yarnpkg.com/en/docs/install)

## Running the App

### Install dependencies

Before launching the application or running any tests, you must run `yarn install` to install all application dependencies.

### Launch App in Development Mode

To run the application by development server:

- **`yarn dev`**: Launches the Express.js backend in development mode with TypeScript

After running the `yarn dev` command, the server will run at [http://localhost:8082](http://localhost:8082).

## Testing with Postman

Once the server is up and running, open the Postman app and enter the API routes to test various functionalities.

To help in checking the detailed information of all API endpoints including their methods, request payloads and responses, please check access this URL: [http://localhost:8082/api-docs/](http://localhost:8082/api-docs/) - an API documentation generator named as `Swagger` that helps developers and stakeholders understand the Online Auction System back end flow or process.

*API endpoints and their methods:*

 - **`User Registration`**: POST http://localhost:8082/register

 - **`User Login`**: GET http://localhost:8082/login

 - **`Create Bidding Item`**: POST http://localhost:8082/items

 - **`Publish Bidding Item`**: PUT http://localhost:8082/bidding-items/:itemId/publish

 - **`Update Item Details`**: PUT http://localhost:8082/items/:itemId

 - **`Delete Item`**: DELETE http://localhost:8082/items/:itemId

 - **`Fetch Published Items`**: GET http://localhost:8082/published-items

 - **`Fetch Existing Items`**: GET http://localhost:8082/existing-items

 - **`Fetch All Items`**: GET http://localhost:8082/items

 - **`Place a Bid`**: POST http://localhost:8082/bid

 - **`Update Bid`**: PUT http://localhost:8082/bids/:bidId

 - **`Fetch All Bids`**: GET http://localhost:8082/bid

 - **`Fetch User Data`**: GET http://localhost:8082/user

 - **`Deposit Money`**: POST http://localhost:8082/deposits

 - **`Fetch All Deposits`**: GET http://localhost:8082/deposit

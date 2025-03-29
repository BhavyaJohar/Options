# Black-Scholes Option Pricing with P&L Heatmaps

This project is a web-based fullstack application that calculates the price of call and put options using the Black-Scholes pricing model. It generates heatmaps to visualize the profit and loss (P&L) based on varying spot prices and volatilities. Users can adjust the volatility and spot price ranges to analyze different scenarios. The project includes a MySQL database to store option data and an API to interact with the data.

## Take a Look!
[https://black-scholes-options-pricer.onrender.com/](https://black-scholes-options-pricer.vercel.app/)

## Features

- Calculate call and put option prices using the Black-Scholes model.
- Generate heatmaps to visualize P&L for different spot prices and realized volatilities.
- Interactive form to update volatility and spot price ranges.
- Store and retrieve option data from a MySQL database.
- Secure configuration using environment variables with .env file.
- Display percentage-based P&L on the heatmap with hover functionality.


## Technologies Used

- Frontend: React.js, Chart.js
- Backend: Node.js, Express.js
- Database: MySQL (Deployed on AWS RDS)
- Deployment: Render (for the fullstack app)
- Environment Configuration: dotenv
- Styling: Bootstrap
- Others: cors, mysql2, dotenv

## Prerequisites

Make sure you have the following installed on your machine:

- Node.js (version 14.x or later)
- MySQL
- Git

## Setup Instruction

### 1. Clone the Repository

```
git clone https://github.com/BhavyaJohar/Black-Scholes-Options-Pricer.git
cd Black-Scholes-Options-Pricer
```

### 2. Backend Setup (Express.js & MySQL)

#### a. Install Dependencies

```
npm install
```

#### b. Configure .env File

Create a .env file in the root directory with your database credentials and server configuration. For example:
```
DB_HOST=your-aws-rds-endpoint
DB_USER=yourusername
DB_PASSWORD=yourpassword
DB_DATABASE=databasename
DB_PORT=3306
PORT=4000
```

#### c. MySQL Setup

1. Create a Database:
```
CREATE DATABASE options_db;
```

2. Create a Table:
```
USE options_db;

CREATE TABLE options_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_price DECIMAL(10, 2),
    strike_price DECIMAL(10, 2),
    maturity DECIMAL(10, 2),
    volatility DECIMAL(5, 4),
    risk_free_rate DECIMAL(5, 4),
    call_price DECIMAL(10, 2),
    put_price DECIMAL(10, 2)
);
```

#### d. Start the Backend Server
```
npm start --prefix server
```

### 3. Frontend Setup (React.js)

#### a. Navigate to the Client Directory
```
cd client
```

#### b. Install Frontend Dependencies
```
npm install
```

#### c. Start the React App
```
npm start
```

### 4. Using the Application

1. Option Price Calculator:
- Enter the parameters (Asset Price, Strike Price, Maturity, Volatility, Risk-Free Rate).
- Click "Calculate Option Price" to compute call and put prices.
2. Heatmap Visualization:
- Adjust the volatility and spot price ranges using the provided form.
- Click "Update Heatmap" to regenerate the P&L heatmap.
- Hover over each point to see P&L as a percentage, as well as the spot price and volatility.

### 8. API Endpoints

- POST /api/saveOptionsData: Save option data (call/put prices and user input).
- GET /api/getOptionsData: Retrieve all stored option data.
- GET /api/getLatestOptionsData: Retrieve the most recent entry from the database.

### 9. Potential Issues & Debugging

- Error: EADDRINUSE (Address already in use):
  - Make sure the port (e.g., 5001) is not being used by another application.
  - Change the port in your .env file if needed.
- Database Connection Issues:
  - Ensure your MySQL database is running and accessible.
  - Check .env for correct database credentials.

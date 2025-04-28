# Options & Portfolio Analysis Tool

A comprehensive Next.js‑based financial analysis platform that combines real‑time market data with theoretical models for options pricing and portfolio analysis. Built with modern web technologies and designed for both retail and professional investors.

---

## Features

### Options Analysis
- **Options Chain Lookup**  
  Fetch live option chains from Polygon.io by ticker symbol.

- **Black‑Scholes Pricing & Greeks**  
  Calculate theoretical call/put prices and the full suite of Greeks (Delta, Gamma, Theta, Vega, Rho).

- **Binomial Tree Pricing**  
  Price options (including American‑style) via a Cox‑Ross‑Rubinstein binomial tree.

- **Interactive Payoff Diagrams**  
  Static expiration payoff curves with red/green shading for negative/positive P&L, plus reference lines for strike, current, and break‑even prices.

- **Custom "Bento" UI**  
  A modern, responsive grid layout to build positions manually:  
  - Ticker  
  - Strike Price  
  - Option Type (Call/Put)  
  - Position (Long/Short)  
  - Days to Expiration  
  - Premium

### Portfolio Analysis
- **Portfolio Management**  
  - Add and manage multiple positions
  - Track long and short positions
  - Real-time portfolio value calculation
  - Position distribution visualization

- **Advanced Analytics**  
  - Alpha/Beta analysis
  - Sharpe Ratio calculation
  - Total Return metrics
  - Monte Carlo simulations for risk assessment

- **Performance Visualization**  
  - Interactive pie charts for position distribution
  - Monte Carlo simulation histograms
  - Performance metrics dashboard

- **Data Persistence**  
  - Local storage caching for positions
  - Cached analysis results with automatic refresh
  - Persistent form data across sessions

---

## Project Structure

```
quant/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── options/route.ts     # GET /api/options → fetch option chain
│   │   │   ├── price/route.ts       # POST /api/price  → compute price & Greeks
│   │   │   ├── portfolio/route.ts   # POST /api/portfolio → analyze portfolio
│   │   │   └── stocks/route.ts      # GET /api/stocks → fetch stock prices
│   │   ├── portfolio/
│   │   │   └── page.tsx             # Portfolio analysis UI
│   │   └── page.tsx                 # Options pricing UI
│   ├── components/
│   │   ├── PayoffDiagram.tsx        # Reusable payoff chart component
│   │   └── PortfolioMetrics.tsx     # Portfolio metrics display
│   └── lib/
│       └── calculations.ts          # Financial calculations utilities
├── .env                            # Environment variables
└── package.json                    # Dependencies & scripts
```

---

## Installation

1. **Clone the repo**  
   ```bash
   git clone https://github.com/BhavyaJohar/Options.git
   cd Options/quant
   ```

2. **Install dependencies**  
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**  
   Create a `.env` file at the project root:
   ```env
   NEXT_PUBLIC_POLYGON_API_KEY=your_polygon_api_key_here
   ```

---

## Usage

- **Start development server**  
  ```bash
  npm run dev
  # or
  yarn dev
  ```
  The app will be available at `http://localhost:3000`.

- **Build for production**  
  ```bash
  npm run build
  npm start
  # or
  yarn build
  yarn start
  ```

---

## API Endpoints

### `/api/options` (GET)
Fetches the options chain for a given stock ticker.

### `/api/price` (POST)
Computes theoretical option price and Greeks via both Black‑Scholes and a Binomial Tree.

### `/api/portfolio` (POST)
Analyzes portfolio performance and risk metrics.

### `/api/stocks` (GET)
Fetches current stock prices with caching support.

---

## Technical Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data**: Polygon.io API
- **State Management**: React Hooks
- **Caching**: LocalStorage
- **Deployment**: Vercel

---

## Performance Optimizations

- Client-side caching for stock prices and analysis results
- Debounced API calls for stock lookups
- Optimized Monte Carlo simulations
- Responsive design for all device sizes
- Efficient state management with React hooks

---

## Contributing

1. Fork the repository  
2. Create a new branch: `git checkout -b feat/my-feature`  
3. Commit your changes & push: `git push origin feat/my-feature`  
4. Open a Pull Request

---

## License

MIT License

---

## Author

[Bhavya Johar](https://bhavyarjohar.com) - Computer Science & Finance at UVA

---

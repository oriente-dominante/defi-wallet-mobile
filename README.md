# DeFi Wallet Mobile

A production-ready, cross-platform mobile wallet for decentralized finance. Built with React Native and NestJS, featuring multi-chain support, real-time price alerts, and seamless token swapping through Jupiter and 0x Protocol aggregators.

---

## 1. Project Overview

### The Problem

DeFi users juggle multiple wallets, manually track prices, and navigate complex swap interfaces across different blockchains. Existing mobile wallets either lack DeFi features or provide poor user experiences with slow updates and confusing interfaces.

### The Solution

This mobile wallet unifies portfolio management, price monitoring, and token swapping in a single, polished application. Users manage Solana and Ethereum assets, set custom price alerts with push notifications, and execute swaps through optimized aggregators—all from their phone.

### Why It Matters

- **Unified experience**: Manage multiple chains without switching apps
- **Real-time alerts**: Never miss price targets with push notifications
- **Best swap rates**: Jupiter and 0x aggregators find optimal routes
- **Production quality**: Biometric auth, encrypted storage, professional UI
- **Cross-platform**: Single codebase for iOS and Android

---

## 2. Real-World Use Cases

| User Type | Application |
|-----------|-------------|
| **DeFi Traders** | Monitor portfolio, set price alerts, execute swaps on mobile |
| **HODLers** | Track long-term holdings with customizable price targets |
| **Yield Farmers** | Manage positions across Solana and Ethereum protocols |
| **NFT Collectors** | View token balances associated with NFT activities |
| **DeFi Developers** | Test wallet integrations with real mobile environment |
| **Portfolio Managers** | Track multi-chain allocations with real-time valuations |

---

## 3. Core Features

| Feature | Business Value |
|---------|----------------|
| **Multi-Chain Portfolio** | Real-time balance tracking across Solana and Ethereum with USD valuations |
| **Price Alerts** | Custom price targets with above/below conditions and push notifications |
| **Jupiter Swaps** | Best rates across Solana DEXs with route optimization |
| **0x Protocol Swaps** | Optimal Ethereum routing with aggregated liquidity |
| **Transaction History** | Unified view of all transactions across networks |
| **Biometric Security** | Face ID/Touch ID protection with encrypted storage |
| **Custom Tokens** | Add ERC-20 and SPL tokens by contract address |
| **Theme Support** | Dark/light modes with system preference detection |

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DeFi Wallet Mobile                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────┐    ┌───────────────────┐    ┌─────────────┐  │
│  │   React Native    │    │     NestJS        │    │  Blockchain │  │
│  │   Mobile App      │◄──►│     Backend       │◄──►│  Networks   │  │
│  │                   │    │                   │    │             │  │
│  │ • Redux Toolkit   │    │ • REST API        │    │ • Solana    │  │
│  │ • React Navigation│    │ • Price Alerts    │    │ • Ethereum  │  │
│  │ • Firebase FCM    │    │ • Push Service    │    │             │  │
│  │ • Secure Storage  │    │ • Portfolio API   │    │             │  │
│  └───────────────────┘    └───────────────────┘    └─────────────┘  │
│           │                        │                      │          │
│           └────────────────────────┼──────────────────────┘          │
│                                    │                                 │
│  ┌─────────────────────────────────▼─────────────────────────────┐  │
│  │                     External Services                          │  │
│  │  • Jupiter API  • 0x Protocol  • CoinGecko  • Firebase FCM    │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Mobile Framework** | React Native 0.80, TypeScript | Cross-platform iOS/Android |
| **State Management** | Redux Toolkit, RTK Query | Application state and API caching |
| **Navigation** | React Navigation 6 | Screen routing and deep linking |
| **Push Notifications** | React Native Firebase | Cross-platform push alerts |
| **Secure Storage** | React Native Keychain | Encrypted credential storage |
| **Backend** | NestJS 10, TypeScript | REST API and background jobs |
| **Price Data** | CoinGecko API | Real-time cryptocurrency prices |
| **Solana Swaps** | Jupiter Aggregator | DEX aggregation for best rates |
| **Ethereum Swaps** | 0x Protocol | Liquidity aggregation |
| **Blockchain RPC** | Solana/Ethereum nodes | Direct blockchain interaction |

---

## 6. How the System Works

### Portfolio Loading Flow

```
App Launch → Fetch Balances → Get Prices → Calculate USD Values → Display
```

1. **Launch**: App initializes with stored wallet addresses
2. **Balances**: Query Solana and Ethereum RPCs for token balances
3. **Prices**: Fetch current prices from CoinGecko
4. **Calculate**: Multiply balances by prices for USD values
5. **Display**: Render portfolio with 24h change indicators

### Price Alert Flow

```
Create Alert → Backend Stores → Monitor Prices → Trigger → Push Notification
```

1. **Create**: User sets token, condition (above/below), target price
2. **Store**: Backend saves alert with user's FCM token
3. **Monitor**: Cron job checks prices every 30 seconds
4. **Evaluate**: Compare current prices against alert conditions
5. **Trigger**: Send push notification when condition met
6. **Cooldown**: 5-minute cooldown prevents notification spam

### Token Swap Flow

```
Select Tokens → Get Quote → Review Route → Sign Transaction → Confirm
```

1. **Select**: User chooses input/output tokens and amount
2. **Quote**: Fetch optimal route from Jupiter (Solana) or 0x (Ethereum)
3. **Preview**: Display rate, price impact, and fees
4. **Sign**: User approves transaction with wallet
5. **Broadcast**: Submit to blockchain network
6. **Track**: Monitor until confirmation received

---

## 7. Setup & Run

### Prerequisites

- Node.js 18+
- React Native CLI and development environment
- Android Studio or Xcode
- Firebase project (for push notifications)

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/defi-wallet-mobile.git
cd defi-wallet-mobile

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Configure environment
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Start backend
cd backend && npm run start:dev

# Start mobile app
cd frontend && npm start
npm run ios  # or npm run android
```

### Environment Configuration

```bash
# Frontend (.env)
API_BASE_URL=http://localhost:3000/api
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
FIREBASE_API_KEY=your-firebase-api-key

# Backend (.env)
PORT=3000
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
COINGECKO_API_URL=https://api.coingecko.com/api/v3
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | REST API server |
| **API Docs** | http://localhost:3000/api/docs | Swagger documentation |
| **Mobile App** | Device/Simulator | React Native application |

---

## 8. API & Usage

### Create Price Alert

```bash
curl -X POST http://localhost:3000/api/notifications/price-alerts/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "tokenSymbol": "BTC",
    "condition": "above",
    "targetPrice": 50000,
    "network": "ethereum"
  }'
```

### Get Portfolio

```bash
curl http://localhost:3000/api/portfolio/0x123...?network=ethereum
```

**Response**:
```json
{
  "totalValue": 15420.50,
  "totalChange24h": 340.25,
  "tokens": [
    {
      "symbol": "ETH",
      "balance": "2.5",
      "price": 3200.00,
      "value": 8000.00,
      "change24h": 2.5
    }
  ],
  "lastUpdated": "2024-01-15T12:00:00Z"
}
```

### Get Swap Quote

```bash
curl -X POST http://localhost:3000/api/swap/jupiter/quote \
  -H "Content-Type: application/json" \
  -d '{
    "inputMint": "SOL",
    "outputMint": "USDC",
    "amount": "1.0",
    "slippageBps": 50
  }'
```

---

## 9. Scalability & Production Readiness

### Current Architecture Strengths

| Aspect | Implementation |
|--------|----------------|
| **Cross-Platform** | Single React Native codebase for iOS and Android |
| **Real-time Updates** | RTK Query with smart cache invalidation |
| **Security** | Biometric auth, encrypted storage, secure API communication |
| **Multi-Chain** | Modular network adapters for Solana and Ethereum |
| **Push Infrastructure** | Firebase FCM for reliable cross-platform notifications |

### Production Enhancements (Recommended)

| Enhancement | Purpose |
|-------------|---------|
| **Hardware Wallets** | Ledger/Trezor integration for enhanced security |
| **Additional Chains** | Polygon, Arbitrum, Base network support |
| **Advanced Charts** | TradingView-style price charts and technical analysis |
| **Cross-Chain Bridge** | Native bridging between supported networks |
| **NFT Portfolio** | Display and manage NFT holdings |
| **DeFi Integrations** | Direct staking and yield farming access |

---

## 10. Screenshots

<p align="center">
  <img src="assets/screenshots/01-portfolio.png" width="200" alt="Portfolio Dashboard" />
  <img src="assets/screenshots/02-send.png" width="200" alt="Token Send" />
  <img src="assets/screenshots/03-swap.png" width="200" alt="Swap" />
  <img src="assets/screenshots/04-history.png" width="200" alt="Transaction History" />
</p>

| Screen | Description |
|--------|-------------|
| **Portfolio** | Real-time portfolio tracking with SOL, ETH, USDC holdings, 24h changes, and live market data |
| **Send** | Send tokens to any address with fee estimation, address validation, and wallet confirmation |
| **Swap** | Token swaps via Jupiter (Solana) and 0x Protocol (Ethereum) with route optimization |
| **History** | Comprehensive transaction history with status indicators, filtering, and search |

<p align="center">
  <img src="assets/screenshots/05-settings.png" width="200" alt="Settings" />
</p>

| Screen | Description |
|--------|-------------|
| **Settings** | Dark/light theme, currency, language, network preferences, biometric auth, and custom tokens |

---

## Project Structure

```
defi-wallet-mobile/
├── frontend/                 # React Native application
│   ├── src/
│   │   ├── screens/        # Screen components
│   │   ├── components/     # Reusable UI components
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── theme/          # Theme configuration
│   └── package.json
├── backend/                  # NestJS API server
│   ├── src/
│   │   ├── portfolio/      # Portfolio module
│   │   ├── notifications/  # Price alerts and push
│   │   ├── swap/           # Swap aggregation
│   │   └── blockchain/     # RPC interactions
│   └── package.json
└── README.md
```

---

## Testing

```bash
# Backend tests
cd backend && npm run test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## Security Notice

- This software is provided "as is" without warranty
- Users are responsible for their funds and private keys
- Always verify transactions before confirming
- Never share private keys or seed phrases
- Test with small amounts first

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Your gateway to decentralized finance, in your pocket.*

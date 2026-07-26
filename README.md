# Mew3 Hackathon Judging

On-chain hackathon judging and auto-split prize distribution built on Stellar.

## Architecture

```
contract/           → Soroban smart contract (Rust)
client/             → Next.js 16 frontend
client/packages/    → Auto-generated TypeScript bindings
scripts/            → Deployment helpers
```

## Smart Contract

The `HackathonJudging` contract manages:

- **Organizer** — registers judges, adds submissions, funds pool, triggers distribution
- **Judges** — submit scores (0–100) for submissions
- **Observer** — reads leaderboard and pool info

Key functions:

| Function | Who | Description |
|---|---|---|
| `init(organizer, token, top_n, payout_split)` | Deployer | One-time setup |
| `add_judge(judge)` | Organizer | Register a judge |
| `add_submission(name, team_address)` | Organizer | Register a submission |
| `fund_pool(amount)` | Anyone | Fund the prize pool |
| `submit_score(submission_id, score)` | Judge | Score a submission (1x per submission) |
| `distribute_prizes()` | Organizer | Rank and send payouts |
| `get_leaderboard()` | Anyone | View ranked results |

## Quick Start

### 1. Install Dependencies

```bash
cd client && bun install
```

### 2. Set Environment Variables

```bash
cp client/.env.example client/.env.local
```

### 3. Run Development Server

```bash
cd client && bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for Production

```bash
cd client && bun run build
```

## Deploying the Contract

```bash
# Build the contract
cd contract && cargo build --target wasm32v1-none --release

# Generate a funded testnet keypair
stellar keys generate deployer --network testnet --fund

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source-account deployer \
  --network testnet

# Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local with the returned C... address
```

## Wallet Integration

Uses `@stellar/freighter-api` for wallet connection. Install the [Freighter browser extension](https://freighter.app/) to interact with the app.

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust + `soroban-sdk` v25 |
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand (UI) + TanStack Query (server) |
| Wallet | Freighter API v6 |
| Charts | Recharts v2.15 |
| Icons | Lucide React |

## Network

Default: **Stellar Testnet**

- RPC: `https://soroban-testnet.stellar.org`
- Passphrase: `Test SDF Network ; September 2015`
- Explorer: `https://stellar.expert/testnet`

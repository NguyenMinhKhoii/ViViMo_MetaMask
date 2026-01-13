# ViViMo (Ví Vĩ Mô) - AI Coding Agent Instructions

## Project Overview

ViViMo is a Vietnamese-language Web3 microtransaction wallet application that enables users to send/receive ETH through MetaMask integration. This is a client-side single-page application with minimal backend infrastructure.

**Language Context**: All UI text, comments, and user-facing content must be in Vietnamese. Variable names and function names remain in English.

## Architecture

### Project Structure

- **Frontend (Client-only)**:
  - `index.html` - Main application interface (production version)
  - `ViViMo.html` - Alternative/development version with inline styles
  - `js/app.js` - Core application logic (408 lines)
  - `css/style.css` - Styling (currently empty - styles may be inline in HTML)
  - `assets/` - Static resources (logo: vivimo.png)
- **Backend (Placeholder)**:
  - `server/` directory exists but contains empty files (package.json, server.js)
  - **Important**: No active backend - all functionality is client-side via Web3

### Technology Stack

- **ethers.js v5.7.2** (loaded via CDN) - Primary Web3 library for blockchain interactions
- **MetaMask** - Required wallet provider (window.ethereum)
- **Font Awesome 6.4.0** - Icons
- **QR Server API** - External service for QR code generation
- Vanilla JavaScript (ES6+) - No frameworks
- LocalStorage - Transaction history persistence

## Key Implementation Patterns

### Web3 State Management

Global state variables in [js/app.js](js/app.js):

```javascript
let provider = null; // ethers.providers.Web3Provider instance
let signer = null; // ethers Signer for transaction signing
let userAddress = null; // Connected wallet address
let isConnected = false; // Connection status flag
let transactions = []; // Transaction history array
```

**Critical**: Always check `isConnected` and `provider` existence before Web3 operations. Use `window.ethereum` availability checks before MetaMask interactions.

### Wallet Connection Flow

1. User clicks connect → `connectWallet()`
2. Request accounts via `eth_requestAccounts`
3. Initialize provider: `new ethers.providers.Web3Provider(window.ethereum, "any")`
4. Get signer: `provider.getSigner()`
5. Update UI with `updateWalletUI()` → triggers balance refresh, network detection, QR generation

**Auto-reconnection**: On page load, `checkExistingConnection()` checks for existing MetaMask session using `eth_accounts` (non-interactive).

### Transaction Lifecycle

1. **Prepare**: `prepareTransaction()` validates recipient address and amount
2. **Confirm**: Display modal with transaction details
3. **Execute**: `executeTransaction()` calls `signer.sendTransaction()`
4. **Track**: Store in `transactions[]` with status "pending"
5. **Wait**: `await tx.wait()` for confirmation
6. **Update**: Change status to "confirmed", save to localStorage, refresh balance

**Storage Pattern**: Transaction history persisted in localStorage as JSON:

```javascript
localStorage.setItem("vivimoTransactions", JSON.stringify(transactions));
```

### Network Handling

Supported networks (chainId mapping in `getNetworkName()`):

- Ethereum Mainnet (1)
- Goerli (5)
- Sepolia (11155111) - Default testnet for `switchNetwork()`
- Polygon (137)
- BSC (56)

**Network switching**: `switchNetwork()` attempts to switch to Sepolia. On error 4902 (network not added), it adds the network via `wallet_addEthereumChain`.

### Event Listeners

MetaMask events registered in DOMContentLoaded:

- `accountsChanged` → Re-initialize or disconnect
- `chainChanged` → Force page reload to reset state

## Critical Development Practices

### Address Validation

Always use `ethers.utils.isAddress(address)` before transaction operations. Invalid addresses will cause transaction failures.

### Amount Formatting

- **Display**: `ethers.utils.formatEther(balance)` - Wei to ETH
- **Transaction**: `ethers.utils.parseEther(amount)` - ETH to Wei
- USD conversion uses hardcoded `ETH_PRICE_USD = 2500` (not dynamic)

### Error Handling Patterns

```javascript
// MetaMask rejection: error.code === 4001
// Pending approval: error.code === -32002
// Network not found: error.code === 4902
```

All user-facing errors shown via `showToast(type, title, message)` with Vietnamese messages.

### UI State Synchronization

When wallet state changes, always call in sequence:

1. `updateWalletUI()` - Updates address, network, calls refreshBalance()
2. `renderTransactions()` - Redraws transaction list
3. `updateStats()` - Updates transaction counters

## Common Tasks

### Adding a New Transaction Type

1. Add type to transaction object structure (currently: "send"/"receive")
2. Update `filterTx()` filter options
3. Modify `renderTransactions()` icon/label mapping
4. Adjust `updateStats()` counters

### Supporting New Networks

1. Add chainId mapping to `getNetworkName()`
2. Update `switchNetwork()` with new network parameters if needed as default

### Modifying Transaction Storage

- All changes to `transactions[]` must call `saveTransactionsToStorage()`
- Transaction format: `{ hash, from, to, amount, note, type, status, timestamp }`

### Styling Updates

- Primary file: `css/style.css` (currently empty - check HTML for inline styles)
- Fallback: `ViViMo.html` may have embedded styles in `<style>` tags
- Font Awesome classes for icons (fa-wallet, fa-paper-plane, fa-qrcode, etc.)

## File-Specific Notes

### index.html vs ViViMo.html

- Both contain the same structure and functionality
- `index.html` references external CSS: `<link rel="stylesheet" href="css/style.css">`
- `ViViMo.html` uses inline path: `<link rel="stylesheet" href="style.css">`
- Choose `index.html` for production changes; `ViViMo.html` appears to be a development variant

### app.js Structure

- Lines 1-31: Global state and initialization
- Lines 32-106: Wallet connection/disconnection
- Lines 108-152: UI updates and balance management
- Lines 186-258: Transaction preparation and execution
- Lines 259-340: Transaction history and display
- Lines 342-408: Utilities (copy, QR, network switching, modals, toasts)

## Testing & Debugging

### Local Development

1. Open `index.html` directly in browser (no build process required)
2. Ensure MetaMask extension is installed
3. Connect to Sepolia testnet for safe testing
4. Use browser DevTools console - all operations log with emoji prefixes (🚀 🔵 ✅ ❌)

### Common Issues

- **"MetaMask chưa được cài đặt"**: Check `typeof window.ethereum === "undefined"`
- **Transaction fails silently**: Check browser console for ethers.js errors
- **Balance not updating**: Verify `provider` is initialized and `userAddress` is set
- **Network mismatch**: MetaMask network must match expected chainId

## Dependencies & External Services

- ethers.js CDN: `https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js`
- Font Awesome CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`
- QR Code API: `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${address}`

No npm dependencies or build tools - pure client-side application.

## Vietnamese Language Guidelines

Maintain consistent Vietnamese terminology:

- Ví: Wallet
- Kết nối: Connect
- Gửi: Send
- Nhận: Receive
- Giao dịch: Transaction
- Số dư: Balance
- Địa chỉ: Address
- Xác nhận: Confirm

When adding features, ensure all UI strings follow existing Vietnamese patterns in [index.html](index.html) and toast messages in [js/app.js](js/app.js).

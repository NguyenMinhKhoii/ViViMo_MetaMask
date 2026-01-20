// ====================
// Global State Variables
// ====================
let provider = null;
let signer = null;
let userAddress = null;
let isConnected = false;
let pendingTx = null;
let transactions = [];
let currentFilter = "all";
let currentCategoryFilter = "all";
const ETH_PRICE_USD = 2500;

// Danh mục giao dịch
const categoryNames = {
  coffee: { name: "Cà phê", icon: "☕" },
  food: { name: "Đồ ăn", icon: "🍜" },
  entertainment: { name: "Giải trí", icon: "🎮" },
  shopping: { name: "Mua sắm", icon: "🛒" },
  transport: { name: "Di chuyển", icon: "🚗" },
  bill: { name: "Hoá đơn", icon: "📄" },
  tip: { name: "Tip/Donate", icon: "💝" },
  transfer: { name: "Chuyển tiền", icon: "💸" },
  other: { name: "Khác", icon: "🔹" },
};

// ====================
// Initialization
// ====================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Ứng dụng ViViMo đang khởi tạo...");
  loadTransactionsFromStorage();
  renderTransactions();
  updateStats();

  // Kiểm tra kết nối MetaMask hiện có
  setTimeout(() => {
    checkExistingConnection();
  }, 500);

  // Đăng ký event listeners cho MetaMask
  if (typeof window.ethereum !== "undefined") {
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => {
      console.log("🔄 Mạng đã thay đổi, đang tải lại...");
      window.location.reload();
    });
    console.log("✅ Đã phát hiện MetaMask");
  } else {
    console.log("⚠️ MetaMask chưa được cài đặt");
  }
});

// ====================
// Wallet Connection
// ====================
async function connectWallet() {
  console.log("🔵 Bắt đầu kết nối ví...");

  // Kiểm tra MetaMask đã cài đặt chưa
  if (typeof window.ethereum === "undefined") {
    showToast("error", "Lỗi", "Vui lòng cài đặt MetaMask để sử dụng ứng dụng!");
    window.open("https://metamask.io/download/", "_blank");
    return;
  }

  try {
    updateConnectButton(true, "Đang kết nối...");

    // Yêu cầu quyền truy cập tài khoản
    console.log("🔵 Đang yêu cầu quyền truy cập tài khoản...");
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      throw new Error("Không có tài khoản nào được chọn");
    }

    // Khởi tạo provider và signer
    console.log("🔵 Đang khởi tạo provider...");
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    signer = provider.getSigner();
    userAddress = accounts[0];
    isConnected = true;

    console.log("✅ Đã kết nối với địa chỉ:", userAddress);

    // Cập nhật giao diện
    await updateWalletUI();
    showToast("success", "Thành công", "Đã kết nối ví MetaMask!");
  } catch (error) {
    console.error("❌ Lỗi kết nối:", error);

    let errorMessage = "Không thể kết nối ví. Vui lòng thử lại.";

    if (error.code === 4001) {
      errorMessage = "Bạn đã từ chối kết nối ví.";
    } else if (error.code === -32002) {
      errorMessage = "Yêu cầu kết nối đang chờ xử lý. Vui lòng mở MetaMask.";
    }

    showToast("error", "Lỗi kết nối", errorMessage);
  } finally {
    updateConnectButton(
      false,
      isConnected
        ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
        : "Kết nối ví",
    );
  }
}

async function checkExistingConnection() {
  if (typeof window.ethereum === "undefined") return;

  try {
    console.log("🔵 Kiểm tra kết nối hiện có...");
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length > 0) {
      console.log("✅ Phát hiện kết nối hiện có:", accounts[0]);
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      signer = provider.getSigner();
      userAddress = accounts[0];
      isConnected = true;
      await updateWalletUI();
    }
  } catch (error) {
    console.error("❌ Lỗi kiểm tra kết nối:", error);
  }
}

function handleAccountsChanged(accounts) {
  console.log("🔄 Tài khoản đã thay đổi:", accounts);

  if (accounts.length === 0) {
    disconnectWallet();
    showToast("warning", "Ngắt kết nối", "Ví đã bị ngắt kết nối.");
  } else {
    userAddress = accounts[0];
    updateWalletUI();
    showToast("info", "Đổi tài khoản", "Đã chuyển sang tài khoản mới.");
  }
}

function disconnectWallet() {
  console.log("🔴 Ngắt kết nối ví...");
  isConnected = false;
  userAddress = null;
  provider = null;
  signer = null;

  document.getElementById("walletNotConnected").style.display = "block";
  document.getElementById("walletConnected").classList.remove("show");
  document.getElementById("headerBtnText").textContent = "Kết nối ví";
  document.getElementById("networkName").textContent = "Chưa kết nối";

  // Cập nhật icon và style nút
  const headerBtn = document.getElementById("headerConnectBtn");
  headerBtn.classList.remove("connected");

  showToast("info", "Ngắt kết nối", "Đã ngắt kết nối ví thành công.");
}

// Toggle kết nối/ngắt kết nối ví
function toggleWalletConnection() {
  if (isConnected) {
    // Hiển thị menu dropdown hoặc trực tiếp ngắt kết nối
    if (confirm("🔗 Bạn có muốn ngắt kết nối ví không?")) {
      disconnectWallet();
    }
  } else {
    connectWallet();
  }
}

// ====================
// UI Updates
// ====================
async function updateWalletUI() {
  if (!isConnected || !userAddress) return;

  console.log("🔵 Đang cập nhật giao diện...");

  // Ẩn/hiện các phần tử
  document.getElementById("walletNotConnected").style.display = "none";
  document.getElementById("walletConnected").classList.add("show");

  // Cập nhật địa chỉ ví
  const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  document.getElementById("walletAddress").textContent = shortAddress;
  document.getElementById("qrAddress").textContent = userAddress;
  document.getElementById("headerBtnText").textContent = shortAddress;

  // Thêm class connected cho nút header
  const headerBtn = document.getElementById("headerConnectBtn");
  headerBtn.classList.add("connected");

  // Cập nhật thông tin mạng
  try {
    const network = await provider.getNetwork();
    const networkName = getNetworkName(network.chainId);
    document.getElementById("networkName").textContent = networkName;
    document.getElementById("currentNetwork").textContent = networkName;
    console.log(
      "✅ Mạng hiện tại:",
      networkName,
      "(chainId:",
      network.chainId,
      ")",
    );
  } catch (error) {
    console.error("❌ Lỗi lấy thông tin mạng:", error);
  }

  // Cập nhật số dư và các thông tin khác
  await refreshBalance();
  renderTransactions();
  updateStats();
  generateQRCode();
}

async function refreshBalance() {
  if (!provider || !userAddress) return;

  try {
    console.log("🔵 Đang lấy số dư...");
    const balance = await provider.getBalance(userAddress);
    const ethBalance = ethers.utils.formatEther(balance);
    const usdBalance = (parseFloat(ethBalance) * ETH_PRICE_USD).toFixed(2);

    document.getElementById("ethBalance").textContent =
      parseFloat(ethBalance).toFixed(4);
    document.getElementById("usdBalance").textContent = usdBalance;

    console.log("✅ Số dư:", ethBalance, "ETH (~$" + usdBalance + ")");
  } catch (error) {
    console.error("❌ Lỗi lấy số dư:", error);
    showToast("error", "Lỗi", "Không thể lấy số dư ví.");
  }
}

function getNetworkName(chainId) {
  const networks = {
    1: "Ethereum Mainnet",
    5: "Goerli Testnet",
    11155111: "Sepolia Testnet",
    137: "Polygon Mainnet",
    80001: "Polygon Mumbai",
    56: "BSC Mainnet",
    97: "BSC Testnet",
    43114: "Avalanche C-Chain",
    250: "Fantom Opera",
  };
  return networks[chainId] || `Unknown (${chainId})`;
}

function updateConnectButton(loading, text) {
  const btn = document.getElementById("headerConnectBtn");
  const btnText = document.getElementById("headerBtnText");

  if (loading) {
    btn.disabled = true;
    btnText.innerHTML = `<span class="loading-spinner"></span> ${text}`;
  } else {
    btn.disabled = false;
    btnText.textContent = text;
  }
}

// ====================
// Tab Navigation
// ====================
function showTab(tab) {
  // Cập nhật active tab
  document.getElementById("tabSend").classList.toggle("active", tab === "send");
  document
    .getElementById("tabReceive")
    .classList.toggle("active", tab === "receive");

  // Hiển thị form tương ứng
  document
    .getElementById("sendForm")
    .classList.toggle("active", tab === "send");
  document
    .getElementById("receiveForm")
    .classList.toggle("active", tab === "receive");
}

function setAmount(amount) {
  document.getElementById("sendAmount").value = amount;
}

// ====================
// Transaction Handling
// ====================
function prepareTransaction() {
  if (!isConnected) {
    showToast("warning", "Chưa kết nối", "Vui lòng kết nối ví trước.");
    return;
  }

  const recipient = document.getElementById("recipientAddress").value.trim();
  const amount = document.getElementById("sendAmount").value;
  const note = document.getElementById("txNote").value.trim();
  const category = document.getElementById("txCategory").value;

  // Validate địa chỉ
  if (!recipient || !ethers.utils.isAddress(recipient)) {
    showToast("error", "Lỗi", "Địa chỉ người nhận không hợp lệ.");
    return;
  }

  // Validate số tiền
  if (!amount || parseFloat(amount) <= 0) {
    showToast("error", "Lỗi", "Vui lòng nhập số tiền hợp lệ.");
    return;
  }

  // Lưu thông tin giao dịch pending
  pendingTx = { recipient, amount, note, category };

  // Hiển thị modal xác nhận
  const categoryInfo = categoryNames[category] || categoryNames.other;
  document.getElementById("confirmTo").textContent = `${recipient.slice(
    0,
    10,
  )}...${recipient.slice(-8)}`;
  document.getElementById("confirmAmount").textContent = `${amount} ETH`;
  document.getElementById("confirmNetwork").textContent =
    document.getElementById("currentNetwork").textContent;
  document.getElementById("confirmCategory").textContent =
    `${categoryInfo.icon} ${categoryInfo.name}`;
  document.getElementById("confirmGas").textContent = "~0.0001 ETH";

  openModal("confirmModal");
}

async function executeTransaction() {
  if (!pendingTx || !signer) {
    showToast("error", "Lỗi", "Không có giao dịch nào để thực hiện.");
    return;
  }

  closeModal("confirmModal");

  try {
    console.log("🔵 Đang gửi giao dịch...");
    showToast("info", "Đang xử lý", "Vui lòng xác nhận trong MetaMask...");

    const tx = await signer.sendTransaction({
      to: pendingTx.recipient,
      value: ethers.utils.parseEther(pendingTx.amount),
    });

    console.log("✅ Giao dịch đã gửi:", tx.hash);

    // Lưu giao dịch với trạng thái pending
    const newTx = {
      hash: tx.hash,
      from: userAddress,
      to: pendingTx.recipient,
      amount: pendingTx.amount,
      note: pendingTx.note || "",
      category: pendingTx.category || "other",
      type: "send",
      status: "pending",
      timestamp: Date.now(),
    };

    transactions.unshift(newTx);
    saveTransactionsToStorage();
    renderTransactions();
    updateStats();

    showToast("success", "Đã gửi", "Giao dịch đang chờ xác nhận...");

    // Chờ xác nhận
    console.log("🔵 Đang chờ xác nhận...");
    const receipt = await tx.wait();

    console.log("✅ Giao dịch đã xác nhận:", receipt);

    // Cập nhật trạng thái
    const txIndex = transactions.findIndex((t) => t.hash === tx.hash);
    if (txIndex !== -1) {
      transactions[txIndex].status = "confirmed";
      saveTransactionsToStorage();
      renderTransactions();
    }

    showToast("success", "Hoàn thành", "Giao dịch đã được xác nhận!");

    // Reset form
    document.getElementById("recipientAddress").value = "";
    document.getElementById("sendAmount").value = "";
    document.getElementById("txNote").value = "";
    document.getElementById("txCategory").value = "other";
    pendingTx = null;

    // Cập nhật số dư
    await refreshBalance();
  } catch (error) {
    console.error("❌ Lỗi giao dịch:", error);

    let errorMessage = "Giao dịch thất bại. Vui lòng thử lại.";

    if (error.code === 4001) {
      errorMessage = "Bạn đã huỷ giao dịch.";
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      errorMessage = "Số dư không đủ để thực hiện giao dịch.";
    }

    // Cập nhật trạng thái failed nếu có
    if (pendingTx) {
      const txIndex = transactions.findIndex((t) => t.status === "pending");
      if (txIndex !== -1) {
        transactions[txIndex].status = "failed";
        saveTransactionsToStorage();
        renderTransactions();
      }
    }

    showToast("error", "Lỗi", errorMessage);
    pendingTx = null;
  }
}

// ====================
// Transaction Storage
// ====================
function saveTransactionsToStorage() {
  try {
    localStorage.setItem("vivimoTransactions", JSON.stringify(transactions));
    console.log("✅ Đã lưu giao dịch vào localStorage");
  } catch (error) {
    console.error("❌ Lỗi lưu giao dịch:", error);
  }
}

function loadTransactionsFromStorage() {
  try {
    const stored = localStorage.getItem("vivimoTransactions");
    if (stored) {
      transactions = JSON.parse(stored);
      console.log(
        "✅ Đã tải",
        transactions.length,
        "giao dịch từ localStorage",
      );
    }
  } catch (error) {
    console.error("❌ Lỗi tải giao dịch:", error);
    transactions = [];
  }
}

// ====================
// Transaction Display
// ====================
function filterTx(filter) {
  currentFilter = filter;

  // Cập nhật active filter button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  renderTransactions();
}

function filterByCategory(category) {
  currentCategoryFilter = category;
  renderTransactions();
}

function renderTransactions() {
  const container = document.getElementById("transactionList");

  // Lọc giao dịch theo loại
  let filteredTx = transactions;
  if (currentFilter !== "all") {
    filteredTx = filteredTx.filter((tx) => tx.type === currentFilter);
  }

  // Lọc theo danh mục
  if (currentCategoryFilter !== "all") {
    filteredTx = filteredTx.filter(
      (tx) => tx.category === currentCategoryFilter,
    );
  }

  // Hiển thị trống nếu không có giao dịch
  if (filteredTx.length === 0) {
    container.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-inbox"></i>
                <p>Chưa có giao dịch nào</p>
            </div>
        `;
    return;
  }

  // Render danh sách giao dịch
  container.innerHTML = filteredTx
    .map((tx) => {
      const isSend = tx.type === "send";
      const icon = isSend ? "fa-arrow-up" : "fa-arrow-down";
      const typeText = isSend ? "Gửi" : "Nhận";
      const address = isSend ? tx.to : tx.from;
      const shortAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "N/A";
      const amountPrefix = isSend ? "-" : "+";

      // Lấy thông tin danh mục
      const categoryInfo = categoryNames[tx.category] || categoryNames.other;
      const categoryDisplay = `${categoryInfo.icon} ${categoryInfo.name}`;

      let statusClass = tx.status;
      let statusText = "";
      switch (tx.status) {
        case "pending":
          statusText = "Đang xử lý";
          break;
        case "confirmed":
          statusText = "Hoàn thành";
          break;
        case "failed":
          statusText = "Thất bại";
          break;
        default:
          statusText = tx.status;
      }

      return `
            <div class="transaction-item" onclick="window.open('https://sepolia.etherscan.io/tx/${
              tx.hash
            }', '_blank')">
                <div class="tx-icon ${tx.type}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="tx-details">
                    <div class="tx-type">${typeText}</div>
                    <div class="tx-address">${shortAddress}</div>
                    <div class="tx-category">${categoryDisplay}</div>
                </div>
                <div class="tx-amount">
                    <div class="tx-value ${tx.type}">${amountPrefix}${
                      tx.amount
                    } ETH</div>
                    <div class="tx-time">${formatTime(tx.timestamp)}</div>
                    <span class="tx-status ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    })
    .join("");
}

function formatTime(timestamp) {
  if (!timestamp) return "N/A";

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Trong vòng 1 phút
  if (diff < 60000) return "Vừa xong";

  // Trong vòng 1 giờ
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;

  // Trong vòng 24 giờ
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;

  // Format ngày tháng
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function updateStats() {
  const sent = transactions.filter((tx) => tx.type === "send").length;
  const received = transactions.filter((tx) => tx.type === "receive").length;
  const total = transactions.length;

  document.getElementById("totalTx").textContent = total;
  document.getElementById("totalSent").textContent = sent;
  document.getElementById("totalReceived").textContent = received;
}

// ====================
// Utilities
// ====================
function copyAddress() {
  if (!userAddress) {
    showToast("warning", "Chưa kết nối", "Vui lòng kết nối ví trước.");
    return;
  }

  navigator.clipboard
    .writeText(userAddress)
    .then(() => {
      showToast("success", "Đã sao chép", "Địa chỉ ví đã được sao chép.");
    })
    .catch(() => {
      showToast("error", "Lỗi", "Không thể sao chép địa chỉ.");
    });
}

function generateQRCode() {
  if (!userAddress) return;

  const qrContainer = document.getElementById("qrCode");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${userAddress}`;

  qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code" />`;
}

async function switchNetwork() {
  if (typeof window.ethereum === "undefined") {
    showToast("error", "Lỗi", "MetaMask chưa được cài đặt.");
    return;
  }

  // Mở modal chọn mạng
  openModal("networkModal");
}

// Danh sách thông tin các mạng
const networkConfigs = {
  "0x1": {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://etherscan.io/"],
  },
  "0xaa36a7": {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.infura.io/v3/"],
    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
  },
  "0x89": {
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com/"],
    blockExplorerUrls: ["https://polygonscan.com/"],
  },
  "0x38": {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"],
  },
};

async function selectNetwork(chainId) {
  closeModal("networkModal");

  if (typeof window.ethereum === "undefined") {
    showToast("error", "Lỗi", "MetaMask chưa được cài đặt.");
    return;
  }

  const networkConfig = networkConfigs[chainId];
  if (!networkConfig) {
    showToast("error", "Lỗi", "Mạng không được hỗ trợ.");
    return;
  }

  try {
    console.log("🔵 Đang chuyển sang", networkConfig.chainName + "...");
    showToast("info", "Đang xử lý", "Vui lòng xác nhận trong MetaMask...");

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainId }],
    });

    showToast("success", "Thành công", `Đã chuyển sang ${networkConfig.chainName}`);
  } catch (error) {
    // Nếu mạng chưa được thêm (error code 4902)
    if (error.code === 4902) {
      try {
        console.log("🔵 Đang thêm mạng", networkConfig.chainName + "...");
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [networkConfig],
        });
        showToast("success", "Thành công", `Đã thêm và chuyển sang ${networkConfig.chainName}`);
      } catch (addError) {
        console.error("❌ Lỗi thêm mạng:", addError);
        showToast("error", "Lỗi", "Không thể thêm mạng. Vui lòng thử lại.");
      }
    } else if (error.code === 4001) {
      showToast("warning", "Đã huỷ", "Bạn đã huỷ chuyển mạng.");
    } else {
      console.error("❌ Lỗi chuyển mạng:", error);
      showToast("error", "Lỗi", "Không thể chuyển mạng. Vui lòng thử lại.");
    }
  }
}

// ====================
// Modal Functions
// ====================
function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

// Đóng modal khi click bên ngoài
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.classList.remove("active");
  }
};

// ====================
// Toast Notifications
// ====================
function showToast(type, title, message) {
  const toast = document.getElementById("toast");
  const icon = toast.querySelector("i");
  const toastTitle = document.getElementById("toastTitle");
  const toastMessage = document.getElementById("toastMessage");

  // Cập nhật nội dung
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  // Cập nhật icon và class
  toast.className = "toast";
  toast.classList.add(type);

  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  icon.className = `fas ${icons[type] || icons.info}`;

  // Hiển thị toast
  toast.classList.add("show");

  // Tự động ẩn sau 4 giây
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

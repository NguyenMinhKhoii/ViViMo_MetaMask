// ===== App State =====
const state = {
    isConnected: false,
    account: null,
    balance: '0',
    chainId: null,
    networkName: 'Không kết nối',
    users: JSON.parse(localStorage.getItem('vivimo_users')) || [],
    currentUser: JSON.parse(localStorage.getItem('vivimo_currentUser')) || null
};

// ===== Network Configuration =====
const networks = {
    '0x1': { name: 'Ethereum Mainnet', symbol: 'ETH' },
    '0x5': { name: 'Goerli Testnet', symbol: 'ETH' },
    '0xaa36a7': { name: 'Sepolia Testnet', symbol: 'ETH' },
    '0x89': { name: 'Polygon Mainnet', symbol: 'MATIC' },
    '0x13881': { name: 'Mumbai Testnet', symbol: 'MATIC' },
    '0x38': { name: 'BNB Smart Chain', symbol: 'BNB' },
    '0x61': { name: 'BSC Testnet', symbol: 'BNB' },
    '0xa86a': { name: 'Avalanche C-Chain', symbol: 'AVAX' }
};

// ===== Page Navigation =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// ===== Toggle Password Visibility =====
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ===== User Menu =====
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        document.getElementById('user-dropdown')?.classList.remove('active');
    }
});

// ===== Toast Notification =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    toast.classList.remove('error');
    
    if (type === 'error') {
        toast.classList.add('error');
        toastIcon.className = 'fas fa-exclamation-circle';
    } else {
        toastIcon.className = 'fas fa-check-circle';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Modal Functions =====
function showSendModal() {
    if (!state.isConnected) {
        showToast('Vui lòng kết nối ví MetaMask trước!', 'error');
        return;
    }
    document.getElementById('send-modal').classList.add('active');
    document.getElementById('available-balance').textContent = `${parseFloat(state.balance).toFixed(4)} ETH`;
}

function showReceiveModal() {
    if (!state.isConnected) {
        showToast('Vui lòng kết nối ví MetaMask trước!', 'error');
        return;
    }
    document.getElementById('receive-modal').classList.add('active');
    document.getElementById('receive-address').textContent = state.account;
    generateQRCode();
}

function showSwapModal() {
    showToast('Tính năng đổi tiền sẽ sớm ra mắt!', 'error');
}

function showBuyModal() {
    showToast('Tính năng mua tiền sẽ sớm ra mắt!', 'error');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ===== QR Code Generation =====
function generateQRCode() {
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = '';
    
    if (state.account && typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: state.account,
            width: 180,
            height: 180,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        qrContainer.innerHTML = '<i class="fas fa-qrcode"></i>';
    }
}

// ===== Copy Functions =====
function copyAddress() {
    if (state.account) {
        navigator.clipboard.writeText(state.account);
        showToast('Đã sao chép địa chỉ ví!');
    }
}

function copyReceiveAddress() {
    if (state.account) {
        navigator.clipboard.writeText(state.account);
        showToast('Đã sao chép địa chỉ ví!');
    }
}

function shareAddress() {
    if (navigator.share && state.account) {
        navigator.share({
            title: 'Địa chỉ ví ViViMo',
            text: `Địa chỉ ví của tôi: ${state.account}`,
            url: window.location.href
        });
    } else {
        copyReceiveAddress();
    }
}

async function pasteFromClipboard(inputId) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(inputId).value = text;
    } catch (err) {
        showToast('Không thể đọc từ clipboard', 'error');
    }
}

// ===== Authentication =====
// Login Form
document.getElementById('login-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Find user
    const user = state.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        state.currentUser = user;
        localStorage.setItem('vivimo_currentUser', JSON.stringify(user));
        showToast('Đăng nhập thành công!');
        showPage('wallet-page');
    } else {
        showToast('Email hoặc mật khẩu không đúng!', 'error');
    }
});

// Register Form
document.getElementById('register-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    // Validation
    if (password !== confirm) {
        showToast('Mật khẩu xác nhận không khớp!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return;
    }
    
    // Check if email exists
    if (state.users.some(u => u.email === email)) {
        showToast('Email đã được sử dụng!', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password,
        createdAt: new Date().toISOString()
    };
    
    state.users.push(newUser);
    localStorage.setItem('vivimo_users', JSON.stringify(state.users));
    
    showToast('Đăng ký thành công! Vui lòng đăng nhập.');
    showPage('login-page');
    
    // Pre-fill login form
    document.getElementById('login-email').value = email;
});

// Logout
function logout() {
    state.currentUser = null;
    state.isConnected = false;
    state.account = null;
    localStorage.removeItem('vivimo_currentUser');
    showToast('Đã đăng xuất!');
    showPage('login-page');
    updateUI();
}

// ===== MetaMask Integration =====
async function connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        showToast('Vui lòng cài đặt MetaMask!', 'error');
        window.open('https://metamask.io/download/', '_blank');
        return false;
    }
    
    try {
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
            state.account = accounts[0];
            state.isConnected = true;
            
            // Get chain ID
            const chainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            state.chainId = chainId;
            state.networkName = networks[chainId]?.name || 'Mạng không xác định';
            
            // Get balance
            await updateBalance();
            
            // Update UI
            updateUI();
            
            showToast('Kết nối MetaMask thành công!');
            return true;
        }
    } catch (error) {
        console.error('MetaMask connection error:', error);
        if (error.code === 4001) {
            showToast('Bạn đã từ chối kết nối!', 'error');
        } else {
            showToast('Lỗi kết nối MetaMask!', 'error');
        }
        return false;
    }
}

// Update Balance
async function updateBalance() {
    if (!state.account) return;
    
    try {
        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [state.account, 'latest']
        });
        
        // Convert from Wei to ETH
        state.balance = (parseInt(balance, 16) / 1e18).toString();
    } catch (error) {
        console.error('Error getting balance:', error);
    }
}

// Update UI
function updateUI() {
    // Update wallet address
    const addressElement = document.getElementById('wallet-address');
    if (addressElement) {
        if (state.account) {
            addressElement.textContent = `${state.account.slice(0, 6)}...${state.account.slice(-4)}`;
        } else {
            addressElement.textContent = 'Chưa kết nối';
        }
    }
    
    // Update balance
    const balanceAmount = document.getElementById('balance-amount');
    const balanceUsd = document.getElementById('balance-usd');
    const ethBalance = document.getElementById('eth-balance');
    const ethUsd = document.getElementById('eth-usd');
    
    if (balanceAmount) {
        const balance = parseFloat(state.balance);
        balanceAmount.textContent = `${balance.toFixed(4)} ETH`;
        
        // Approximate USD value (using a fixed rate for demo)
        const ethPrice = 2500; // Demo price
        const usdValue = balance * ethPrice;
        if (balanceUsd) {
            balanceUsd.textContent = `≈ $${usdValue.toFixed(2)} USD`;
        }
        if (ethBalance) {
            ethBalance.textContent = `${balance.toFixed(4)} ETH`;
        }
        if (ethUsd) {
            ethUsd.textContent = `$${usdValue.toFixed(2)}`;
        }
    }
    
    // Update network status
    const networkName = document.getElementById('network-name');
    if (networkName) {
        networkName.textContent = state.networkName;
    }
}

// MetaMask Event Listeners
if (typeof window.ethereum !== 'undefined') {
    // Account changed
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            state.isConnected = false;
            state.account = null;
            state.balance = '0';
            showToast('Đã ngắt kết nối ví!', 'error');
        } else {
            state.account = accounts[0];
            updateBalance().then(() => updateUI());
            showToast('Đã đổi tài khoản!');
        }
        updateUI();
    });
    
    // Chain changed
    window.ethereum.on('chainChanged', (chainId) => {
        state.chainId = chainId;
        state.networkName = networks[chainId]?.name || 'Mạng không xác định';
        updateBalance().then(() => updateUI());
        showToast(`Đã chuyển sang ${state.networkName}`);
    });
}

// MetaMask Login Button
document.getElementById('metamask-login')?.addEventListener('click', async () => {
    const connected = await connectMetaMask();
    if (connected) {
        // Create or find MetaMask user
        let user = state.users.find(u => u.wallet === state.account);
        if (!user) {
            user = {
                id: Date.now(),
                name: 'MetaMask User',
                email: `${state.account.slice(0, 8)}@metamask.wallet`,
                wallet: state.account,
                createdAt: new Date().toISOString()
            };
            state.users.push(user);
            localStorage.setItem('vivimo_users', JSON.stringify(state.users));
        }
        state.currentUser = user;
        localStorage.setItem('vivimo_currentUser', JSON.stringify(user));
        showPage('wallet-page');
    }
});

// MetaMask Register Button
document.getElementById('metamask-register')?.addEventListener('click', async () => {
    const connected = await connectMetaMask();
    if (connected) {
        // Check if wallet already registered
        let user = state.users.find(u => u.wallet === state.account);
        if (user) {
            showToast('Ví này đã được đăng ký! Đang đăng nhập...');
        } else {
            user = {
                id: Date.now(),
                name: 'MetaMask User',
                email: `${state.account.slice(0, 8)}@metamask.wallet`,
                wallet: state.account,
                createdAt: new Date().toISOString()
            };
            state.users.push(user);
            localStorage.setItem('vivimo_users', JSON.stringify(state.users));
            showToast('Đăng ký thành công!');
        }
        state.currentUser = user;
        localStorage.setItem('vivimo_currentUser', JSON.stringify(user));
        showPage('wallet-page');
    }
});

// ===== Transactions =====
async function sendTransaction() {
    const toAddress = document.getElementById('send-address').value;
    const amount = document.getElementById('send-amount').value;
    
    if (!toAddress || !amount) {
        showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
        return;
    }
    
    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
        showToast('Địa chỉ ví không hợp lệ!', 'error');
        return;
    }
    
    // Check balance
    if (parseFloat(amount) > parseFloat(state.balance)) {
        showToast('Số dư không đủ!', 'error');
        return;
    }
    
    try {
        // Convert amount to Wei
        const amountWei = '0x' + (parseFloat(amount) * 1e18).toString(16);
        
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: state.account,
                to: toAddress,
                value: amountWei
            }]
        });
        
        showToast('Giao dịch đã được gửi!');
        closeModal('send-modal');
        
        // Clear form
        document.getElementById('send-address').value = '';
        document.getElementById('send-amount').value = '';
        
        // Update balance after a delay
        setTimeout(async () => {
            await updateBalance();
            updateUI();
            addTransaction({
                type: 'send',
                to: toAddress,
                amount: amount,
                hash: txHash,
                timestamp: new Date().toISOString()
            });
        }, 2000);
        
    } catch (error) {
        console.error('Transaction error:', error);
        if (error.code === 4001) {
            showToast('Bạn đã hủy giao dịch!', 'error');
        } else {
            showToast('Lỗi gửi giao dịch!', 'error');
        }
    }
}

function addTransaction(tx) {
    const txList = document.getElementById('transactions-list');
    const emptyState = txList.querySelector('.empty-state');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    const txElement = document.createElement('div');
    txElement.className = 'transaction-item';
    txElement.innerHTML = `
        <div class="tx-icon ${tx.type}">
            <i class="fas fa-${tx.type === 'send' ? 'arrow-up' : 'arrow-down'}"></i>
        </div>
        <div class="tx-info">
            <h4>${tx.type === 'send' ? 'Gửi' : 'Nhận'}</h4>
            <p>${tx.to.slice(0, 6)}...${tx.to.slice(-4)}</p>
        </div>
        <div class="tx-amount ${tx.type === 'send' ? 'negative' : 'positive'}">
            <h4>${tx.type === 'send' ? '-' : '+'}${tx.amount} ETH</h4>
            <p>${new Date(tx.timestamp).toLocaleDateString('vi-VN')}</p>
        </div>
    `;
    
    txList.insertBefore(txElement, txList.firstChild);
}

// ===== Utility Functions =====
function refreshAssets() {
    if (state.isConnected) {
        updateBalance().then(() => {
            updateUI();
            showToast('Đã cập nhật số dư!');
        });
    } else {
        showToast('Vui lòng kết nối ví trước!', 'error');
    }
}

function viewAllTransactions() {
    showToast('Tính năng xem tất cả giao dịch sẽ sớm ra mắt!', 'error');
}

function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    if (tab !== 'wallet') {
        showToast(`Tab ${tab} sẽ sớm ra mắt!`, 'error');
    }
}

function showSettings() {
    showToast('Cài đặt sẽ sớm ra mắt!', 'error');
}

function showProfile() {
    showToast('Hồ sơ sẽ sớm ra mắt!', 'error');
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (state.currentUser) {
        showPage('wallet-page');
        
        // Try to reconnect MetaMask if was connected before
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts.length > 0) {
                        state.account = accounts[0];
                        state.isConnected = true;
                        updateBalance().then(() => updateUI());
                        
                        window.ethereum.request({ method: 'eth_chainId' })
                            .then(chainId => {
                                state.chainId = chainId;
                                state.networkName = networks[chainId]?.name || 'Mạng không xác định';
                                updateUI();
                            });
                    }
                });
        }
    } else {
        showPage('login-page');
    }
});

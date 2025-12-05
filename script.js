// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getDatabase, ref, push } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyDDEYzSKZZtg_kmiFDevbZ2V7di2xbMuSo",
    authDomain: "carbon-65b65.firebaseapp.com",
    databaseURL: "https://carbon-65b65-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "carbon-65b65",
    storageBucket: "carbon-65b65.firebasestorage.app",
    messagingSenderId: "772721556227",
    appId: "1:772721556227:web:54be0d99d208602c258736"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 全域變數
let buttonClicked = false;
let pageOpenTime = Date.now();

// 計算碳足跡
function calculateCarbonFootprint(action, data = {}) {
    switch (action) {
        case 'no_click':
            return 5; // 固定 5

        case 'button_2':
            return data.seconds || 0; // 停留秒數

        case 'submit':
            return data.charCount || 0; // 字數

        default:
            return 0;
    }
}

// 儲存碳足跡到 Firebase
async function saveCarbonData(action, footprint, additionalData = {}) {
    const data = {
        action: action,
        footprint: footprint,
        timestamp: Date.now(), // 改成本地 timestamp，避免 Firebase 覆蓋
        ...additionalData
    };

    try {
        const carbonRef = ref(database, 'carbonData');
        await push(carbonRef, data);
        console.log('✅ 碳足跡已記錄到 Firebase:', data);
    } catch (error) {
        console.error('❌ Firebase 儲存失敗:', error);

        const existingData = JSON.parse(localStorage.getItem('carbonData') || '[]');
        existingData.push({ ...data, timestamp: new Date().toISOString() });
        localStorage.setItem('carbonData', JSON.stringify(existingData));

        console.log('⚠️ 已儲存到 localStorage 作為備用');
    }
}

// 自定義提示視窗
function showAlert(message) {
    const modal = document.getElementById('alertModal');
    const modalTitle = document.querySelector('.modal-title');
    modalTitle.textContent = message;
    modal.classList.remove('hidden');
}

function closeAlert() {
    const modal = document.getElementById('alertModal');
    modal.classList.add('hidden');
}

// 儲存資料到 localStorage
function saveToLocalStorage(buttonType) {
    const data = {
        button: buttonType,
        timestamp: new Date().toISOString()
    };

    const existingData = JSON.parse(localStorage.getItem('userData') || '[]');
    existingData.push(data);
    localStorage.setItem('userData', JSON.stringify(existingData));

    console.log('💾 已儲存到 localStorage:', data);
}

// 切換頁面
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

// 按鈕1：進入輸入頁
document.getElementById('btn1').addEventListener('click', () => {
    buttonClicked = true;
    saveToLocalStorage('button_1');
    showPage('inputPage');
});

// 按鈕2：關閉網頁
document.getElementById('btn2').addEventListener('click', async () => {
    buttonClicked = true;

    const seconds = Math.floor((Date.now() - pageOpenTime) / 1000);
    const footprint = calculateCarbonFootprint('button_2', { seconds });

    console.log('🔴 按鈕2：停留秒數', seconds, '→ footprint:', footprint);

    saveToLocalStorage('button_2');
    await saveCarbonData('button_2', footprint, { seconds });

    setTimeout(() => window.close(), 500);
});

// 提交文字按鈕
document.getElementById('submitBtn').addEventListener('click', async () => {
    const inputText = document.getElementById('textInput').value.trim();

    if (!inputText) {
        showAlert('請輸入文字');
        return;
    }

    console.log('📝 字數:', inputText.length);

    const charCount = inputText.length;
    const footprint = calculateCarbonFootprint('submit', { charCount });

    const data = {
        button: 'submit',
        text: inputText,
        timestamp: new Date().toISOString()
    };

    const existingData = JSON.parse(localStorage.getItem('userData') || '[]');
    existingData.push(data);
    localStorage.setItem('userData', JSON.stringify(existingData));

    await saveCarbonData('submit', footprint, { charCount, text: inputText });

    setTimeout(() => window.close(), 500);
});

// 關閉提示視窗
document.getElementById('modalOkBtn').addEventListener('click', () => {
    closeAlert();
});

// **頁面載入後啟動 10 秒 no_click 機制**
window.addEventListener('load', () => {
    console.log('⏳ 開始 10 秒倒數');

    const loadingScreen = document.getElementById('loadingScreen');
    const homePage = document.getElementById('homePage');

    if (loadingScreen) loadingScreen.style.display = 'none';
    if (homePage) {
        homePage.style.opacity = '1';
        homePage.style.transition = 'opacity 0.3s';
    }

    setTimeout(async () => {
        if (!buttonClicked) {
            console.log('⏳ 10 秒內未點擊 → no_click');

            const footprint = 5;

            saveToLocalStorage('no_click');
            await saveCarbonData('no_click', footprint);

            setTimeout(() => window.close(), 500);
        }
    }, 10000);
});

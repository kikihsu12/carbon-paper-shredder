// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getDatabase, ref, push, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';

// Firebase 配置 - 請在這裡填入你的 Firebase 配置
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


function calculateCarbonFootprint(action, data = {}) {
    switch (action) {

        case 'no_click':
            // 自動關閉 → 固定為 5
            return 5;

        case 'button_2':
            // 停留秒數直接當碳足跡
            return data.seconds || 0;

        case 'submit':
            // 使用者輸入字數直接當碳足跡
            return data.charCount || 0;

        default:
            return 0;
    }
}

// 儲存碳足跡資料到 Firebase
async function saveCarbonData(action, footprint, additionalData = {}) {
    const data = {
        action: action,
        footprint: footprint,
        timestamp: serverTimestamp(),
        ...additionalData
    };

    try {
        const carbonRef = ref(database, 'carbonData');
        await push(carbonRef, data);
        console.log('✅ 碳足跡已記錄到 Firebase:', data);
    } catch (error) {
        console.error('❌ Firebase 儲存失敗:', error);
        // 備用方案：儲存到 localStorage
        const existingData = JSON.parse(localStorage.getItem('carbonData') || '[]');
        existingData.push({ ...data, timestamp: new Date().toISOString() });
        localStorage.setItem('carbonData', JSON.stringify(existingData));
        console.log('⚠️ 已儲存到 localStorage 作為備用');
    }
}

// 顯示自定義提示視窗
function showAlert(message) {
    const modal = document.getElementById('alertModal');
    const modalTitle = document.querySelector('.modal-title');
    modalTitle.textContent = message;
    modal.classList.remove('hidden');
}

// 關閉自定義提示視窗
function closeAlert() {
    const modal = document.getElementById('alertModal');
    modal.classList.add('hidden');
}

// 儲存資料到 localStorage (保留舊的格式以便兼容)
function saveToLocalStorage(buttonType) {
    const data = {
        button: buttonType,
        timestamp: new Date().toISOString()
    };

    // 取得現有資料
    const existingData = JSON.parse(localStorage.getItem('userData') || '[]');
    existingData.push(data);
    localStorage.setItem('userData', JSON.stringify(existingData));

    console.log('✅ 資料已儲存:', data);
}

// 切換頁面
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

// 按鈕1：進入輸入頁面
document.getElementById('btn1').addEventListener('click', () => {
    buttonClicked = true;
    saveToLocalStorage('button_1');
    showPage('inputPage');
});

// 按鈕2：關閉網頁
document.getElementById('btn2').addEventListener('click', async () => {
    buttonClicked = true;

    // 計算從打開到點擊的秒數
    const seconds = Math.floor((Date.now() - pageOpenTime) / 1000);
    const footprint = calculateCarbonFootprint('button_2', { seconds });

    console.log('🔴 按鈕2被點擊，停留秒數:', seconds, '碳足跡:', footprint);

    saveToLocalStorage('button_2');
    await saveCarbonData('button_2', footprint, { seconds });

    // 延遲關閉以確保 Firebase 寫入完成
    setTimeout(() => {
        console.log('👋 準備關閉頁面');
        window.close();
    }, 500);
});

// 提交按鈕
document.getElementById('submitBtn').addEventListener('click', async () => {
    const inputText = document.getElementById('textInput').value.trim();

    // 檢查是否有輸入文字
    if (!inputText) {
        showAlert('請輸入文字');
        return;
    }

    console.log('📝 準備提交文字，字數:', inputText.length);

    // 計算文字碳足跡
    const charCount = inputText.length;
    const footprint = calculateCarbonFootprint('submit', { charCount });
    console.log('💨 計算出的碳足跡:', footprint, 'gCO2');

    // 儲存文字內容和提交記錄
    const data = {
        button: 'submit',
        text: inputText,
        timestamp: new Date().toISOString()
    };

    const existingData = JSON.parse(localStorage.getItem('userData') || '[]');
    existingData.push(data);
    localStorage.setItem('userData', JSON.stringify(existingData));

    console.log('💾 開始寫入 Firebase...');
    await saveCarbonData('submit', footprint, { charCount, text: inputText });

    console.log('✅ 文字已儲存:', data);

    // 延遲關閉以確保 Firebase 寫入完成
    setTimeout(() => {
        console.log('👋 準備關閉頁面');
        window.close();
    }, 500);
});

// OK按鈕關閉提示視窗
document.getElementById('modalOkBtn').addEventListener('click', () => {
    closeAlert();
});

// 等待頁面完全載入後才開始 5 秒倒數
window.addEventListener('load', () => {
    console.log('✅ 頁面已完全載入，開始 5 秒倒數');

    // 隱藏載入畫面，顯示主頁面
    const loadingScreen = document.getElementById('loadingScreen');
    const homePage = document.getElementById('homePage');

    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    if (homePage) {
        homePage.style.opacity = '1';
        homePage.style.transition = 'opacity 0.3s';
    }

    setTimeout(async () => {
        if (!buttonClicked) {
            console.log('⏳ 5 秒內未點擊，寫入 "no_click"');

            const footprint = calculateCarbonFootprint('no_click');
            saveToLocalStorage('no_click');
            await saveCarbonData('no_click', footprint);

            // 延遲關閉以確保 Firebase 寫入完成
            setTimeout(() => {
                console.log('👋 準備關閉頁面');
                window.close();
            }, 500);
        }
    }, 5000);
});


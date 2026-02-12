// js/main.js
import { 
    renderHome, 
    renderBattleMap, 
    renderGachaScreen, 
    renderInventory, 
    showGachaResults, 
    updateHeader 
} from './ui.js';
import { getState, addHeroToInventory, updateGems } from './state.js';
import { getHeroDB } from './database.js';

// --- 1. KHỞI TẠO ỨNG DỤNG ---
// Cập nhật hiển thị Kim cương ban đầu
updateHeader(); 
// Mặc định hiển thị trang chủ khi vừa tải trang
renderHome();

// --- 2. QUẢN LÝ ĐIỀU HƯỚNG (NAVIGATION) ---

// Nút Trang Chủ
document.getElementById('btn-home').onclick = () => {
    renderHome();
};

// Nút Chiến Đấu (Map + Tháp)
document.getElementById('btn-battle').onclick = () => {
    renderBattleMap();
};

// Nút Triệu Hồi (Gacha)
document.getElementById('btn-gacha').onclick = () => {
    renderGachaScreen((num) => {
        const state = getState();
        const cost = num * 160;

        // Kiểm tra tài nguyên trước khi quay
        if (state.gems < cost) {
            alert("Bạn không đủ Kim cương để thực hiện triệu hồi!");
            return;
        }

        // Trừ tiền và lấy dữ liệu tướng từ Database
        updateGems(-cost);
        const heroDB = getHeroDB();
        const results = [];

        for (let i = 0; i < num; i++) {
            // Random tướng từ kho dữ liệu gốc
            const randomHero = heroDB[Math.floor(Math.random() * heroDB.length)];
            // Thêm vào túi đồ cá nhân (tự tạo UID duy nhất)
            addHeroToInventory(randomHero);
            results.push(randomHero);
        }

        // Hiển thị kết quả (có hiệu ứng nếu là SSR trở lên)
        showGachaResults(results);
        updateHeader();
    });
};

// Nút Túi Tướng (Kho tàng 500 thẻ)
document.getElementById('btn-inventory').onclick = () => {
    renderInventory();
};

/**
 * LƯU Ý: 
 * Các chức năng như nâng Cấp, nâng Sao, và chọn Đội hình 
 * được xử lý thông qua sự kiện click vào Card trong ui.js 
 * và gọi trực tiếp các hàm từ window.
 */
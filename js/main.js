// js/main.js
import { 
    renderHome, 
    renderBattleMap, 
    renderGachaScreen, 
    renderInventory, 
    showGachaResults, 
    updateHeader,renderEquipmentBag
} from './ui.js';

// Import logic quay riêng biệt
import { pullHeroGacha, pullEquipGacha } from './gacha.js'; 

// --- 1. KHỞI TẠO ỨNG DỤNG ---
updateHeader(); 
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

// Nút Túi Tướng
document.getElementById('btn-inventory').onclick = () => {
    renderInventory();
};

// --- 3. KẾT NỐI GACHA (QUAN TRỌNG) ---

// Nút Triệu Hồi (Gacha)
document.getElementById('btn-gacha').onclick = () => {
    // Truyền 2 hàm callback riêng biệt cho UI: 
    // 1. Hàm quay Tướng
    // 2. Hàm quay Trang bị
    renderGachaScreen(
        (times) => { // Callback khi bấm nút quay bên tab Tướng
            const result = pullHeroGacha(times);
            handleGachaResult(result);
        },
        (times) => { // Callback khi bấm nút quay bên tab Trang bị
            const result = pullEquipGacha(times);
            handleGachaResult(result);
        }
    );
};

// Hàm xử lý kết quả chung sau khi quay
function handleGachaResult(result) {
    if (result.success) {
        // Cập nhật số Gem trên Header
        updateHeader();
        // Hiển thị danh sách kết quả (Tướng hoặc Trang bị)
        showGachaResults(result.results);
    } else {
        // Báo lỗi (VD: Không đủ tiền, đầy túi)
        alert(result.message);
    }
}
document.getElementById('btn-equip-bag').onclick = () => {
    renderEquipmentBag();
};
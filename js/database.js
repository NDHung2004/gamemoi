// js/database.js

const DB_KEY = 'gacha_hero_db_v1';

// Dữ liệu mặc định (Nếu chưa có gì trong bộ nhớ)
const DEFAULT_HEROES = [
    { id: 1, name: "Lính Gác", rank: "R", hp: 100, atk: 15, def: 5, speed: 10, crit: 0, rate: 0.5, img: "🛡️" },
    { id: 2, name: "Cung Thủ", rank: "R", hp: 80, atk: 25, def: 2, speed: 20, crit: 5, rate: 0.3, img: "🏹" },
    { id: 3, name: "Hiệp Sĩ", rank: "SR", hp: 300, atk: 40, def: 20, speed: 12, crit: 5, rate: 0.14, img: "⚔️" },
    { id: 4, name: "Pháp Sư", rank: "SR", hp: 150, atk: 70, def: 5, speed: 15, crit: 10, rate: 0.05, img: "🔮" },
    { id: 5, name: "Vua Arthur", rank: "SSR", hp: 1200, atk: 150, def: 50, speed: 25, crit: 15, rate: 0.01, img: "👑" }
];

// Biến lưu database hiện tại
let currentDB = [];

// Hàm khởi tạo: Tải từ LocalStorage hoặc dùng mặc định
function initDB() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
        currentDB = JSON.parse(saved);
    } else {
        currentDB = JSON.parse(JSON.stringify(DEFAULT_HEROES));
        saveDB();
    }
}

// Lưu lại thay đổi (Khi Admin thêm tướng)
function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(currentDB));
}

// Hàm lấy danh sách tướng (để quay Gacha)
export function getHeroDB() {
    if (currentDB.length === 0) initDB();
    return currentDB;
}

// Hàm thêm tướng mới (Dành cho Admin)
export function addNewHeroToDB(heroObj) {
    if (currentDB.length === 0) initDB();
    
    // Tự động tạo ID mới
    const newId = currentDB.length > 0 ? Math.max(...currentDB.map(h => h.id)) + 1 : 1;
    heroObj.id = newId;
    
    currentDB.push(heroObj);
    saveDB();
    return heroObj;
}

// Hàm reset về mặc định
// js/database.js

export function resetDB() {
    // 1. Xóa dữ liệu Tướng đã lưu
    localStorage.removeItem(DB_KEY);
    
    // 2. Xóa dữ liệu Ải/Campaign đã lưu
    localStorage.removeItem(CAMPAIGN_KEY);
    
    // 3. Xóa dữ liệu trạng thái người chơi (Vàng, Kim cương, Đội hình, Tiến trình ải/tháp)
    localStorage.removeItem('gacha_game_v2_data'); // Tên key mặc định của StorageSystem
    
    alert("Đã reset toàn bộ dữ liệu về mặc định!");
    location.reload(); // Tải lại trang để khởi tạo lại từ đầu
}
// --- PHẦN MỚI: CỐT TRUYỆN (CAMPAIGN) ---
const CAMPAIGN_KEY = 'gacha_campaign_db_v1';

const DEFAULT_CAMPAIGN = [
    { id: 1, name: "Bìa Rừng", desc: "Nơi bắt đầu hành trình.", enemyName: "Sói Hoang", hp: 200, atk: 20, reward: 100, img: "🌲" },
    { id: 2, name: "Hang Động", desc: "Tối tăm và ẩm ướt.", enemyName: "Nhện Độc", hp: 500, atk: 50, reward: 200, img: "🕸️" },
    { id: 3, name: "Trại Goblin", desc: "Căn cứ địch.", enemyName: "Goblin Chúa", hp: 1200, atk: 120, reward: 500, img: "👹" }
];

let currentCampaign = [];

function initCampaignDB() {
    const saved = localStorage.getItem(CAMPAIGN_KEY);
    if (saved) {
        currentCampaign = JSON.parse(saved);
    } else {
        currentCampaign = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN));
        saveCampaignDB();
    }
}

function saveCampaignDB() {
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(currentCampaign));
}

export function getCampaignDB() {
    if (currentCampaign.length === 0) initCampaignDB();
    return currentCampaign;
}

export function addStageToDB(stageObj) {
    if (currentCampaign.length === 0) initCampaignDB();
    
    // Tự động tăng ID
    const newId = currentCampaign.length + 1;
    stageObj.id = newId;
    
    currentCampaign.push(stageObj);
    saveCampaignDB();
    return stageObj;
}
// --- QUẢN LÝ TƯỚNG TRONG DATABASE ---
export function updateHeroInDB(id, updatedData) {
    const db = getHeroDB();
    const index = db.findIndex(h => h.id === id);
    if (index !== -1) {
        // Giữ nguyên ID, cập nhật các dữ liệu khác
        db[index] = { ...updatedData, id: id };
        saveDB(); // Tên hàm chính xác của bạn là saveDB
        return true;
    }
    return false;
}

export function deleteHeroFromDB(id) {
    if (currentDB.length === 0) initDB();
    currentDB = currentDB.filter(h => h.id !== id);
    saveDB();
}

// --- QUẢN LÝ ẢI TRONG DATABASE ---
export function updateStageInDB(id, updatedStage) {
    const db = getCampaignDB();
    const index = db.findIndex(s => s.id === id);
    if (index !== -1) {
        // Giữ nguyên ID, cập nhật dữ liệu mới
        db[index] = { ...updatedStage, id: id };
        saveCampaignDB();
        return true;
    }
    return false;
}

export function deleteStageFromDB(id) {
    if (currentCampaign.length === 0) initCampaignDB();
    currentCampaign = currentCampaign.filter(s => s.id !== id);
    saveCampaignDB();
}
// js/database.js

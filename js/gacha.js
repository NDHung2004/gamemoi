// js/gacha.js
import { getHeroDB } from './database.js'; 
import { EQUIPMENT_DB } from './items.js'; 
import { getState, updateGems, addHeroToInventory, MAX_INVENTORY } from './state.js'; 
import { addEquipmentToBag } from './equipment.js'; 

const COST_PER_PULL = 160;

// --- HÀM QUAY TƯỚNG RIÊNG ---
export function pullHeroGacha(times) {
    const state = getState();
    if (state.inventory.length + times > MAX_INVENTORY) {
        return { success: false, message: `Túi tướng đã đầy!` };
    }
    return executeGacha(times, 'hero');
}

// --- HÀM QUAY TRANG BỊ RIÊNG ---
export function pullEquipGacha(times) {
    const state = getState();
    // Giới hạn trang bị
    if ((state.equipmentBag || []).length + times > MAX_EQUIPMENT_BAG) {
        return { success: false, message: "Túi trang bị đã đầy! Hãy bán bớt trang bị." };
    }
    return executeGacha(times, 'equip');
}

// --- HÀM XỬ LÝ CHUNG (TRỪ GEM & RANDOM) ---
function executeGacha(times, type) {
    const state = getState();
    const totalCost = COST_PER_PULL * times;

    if (state.gems < totalCost) {
        return { success: false, message: "Không đủ Kim Cương!" };
    }

    updateGems(-totalCost);
    let results = [];
    const db = type === 'hero' ? getHeroDB() : EQUIPMENT_DB;

    for (let i = 0; i < times; i++) {
        if (type === 'hero') {
            // QUAY TƯỚNG (Có Rate)
            const hero = rollWithRate(db);
            addHeroToInventory(hero);
            results.push({ ...hero, isItem: false });
        } else {
            // QUAY TRANG BỊ (Random đều - Có thể nâng cấp thêm Rate sau)
            const item = rollItemWithRate(EQUIPMENT_DB);
            if (item) {
                addEquipmentToBag(item);
                results.push({ ...item, isItem: true });
            }
        }
    }
    return { success: true, results: results };
}
// Hàm tính toán tỉ lệ rơi đồ
function rollItemWithRate(db) {
    if (db.length === 0) return null;
    const totalRate = db.reduce((sum, item) => sum + (item.rate || 0), 0);
    let rand = Math.random() * totalRate;
    let cumulative = 0;
    for (let item of db) {
        cumulative += (item.rate || 0);
        if (rand < cumulative) return { ...item };
    }
    return { ...db[0] };
}
// Logic Random theo tỷ lệ (Rate) cho Tướng
function rollWithRate(db) {
    const totalRate = db.reduce((sum, h) => sum + h.rate, 0);
    let rand = Math.random() * totalRate;
    let cumulative = 0;
    for (let h of db) {
        cumulative += h.rate;
        if (rand < cumulative) return { ...h };
    }
    return { ...db[0] };
}

// Logic Random đều cho Trang bị
function rollRandomEquip(db) {
    if (db.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * db.length);
    return { ...db[randomIndex] };
}
import { getState } from './state.js';
import { StorageSystem } from './storage.js'; // Sửa lỗi import quan trọng
import { EQUIPMENT_DB } from './items.js';

// --- LOGIC TÍNH TOÁN CHỈ SỐ ---
export function calculateHeroStats(hero) {
    let finalStats = { 
        hp: hero.hp, 
        atk: hero.atk, 
        speed: hero.speed || 10,
        def: hero.def || 0,
        crit: hero.crit || 0
    };

    if (hero.equipped) {
        Object.values(hero.equipped).forEach(item => {
            if (item) {
                if (item.type === 'weapon') finalStats.atk += item.stat;
                if (item.type === 'armor') finalStats.hp += item.stat;
                if (item.type === 'boots') finalStats.speed += item.stat;
            }
        });
    }
    return finalStats;
}

// --- LOGIC QUẢN LÝ KHO ĐỒ ---
export function addEquipmentToBag(itemId) {
    const state = getState();
    // Chấp nhận cả ID (number) hoặc object item đầy đủ
    let itemBase;
    if (typeof itemId === 'object') {
        itemBase = itemId; // Trường hợp truyền nguyên object từ Gacha
    } else {
        itemBase = EQUIPMENT_DB.find(i => i.id === itemId);
    }

    if (!itemBase) return false;

    const newItem = {
        ...itemBase,
        uid: Date.now() + Math.random(),
        isEquipped: false
    };

    if (!state.equipmentBag) state.equipmentBag = [];
    state.equipmentBag.push(newItem);
    
    StorageSystem.save(state);
    return newItem;
}

export function equipItem(heroUid, itemUid) {
    const state = getState();
    const hero = state.inventory.find(h => Number(h.uid) === Number(heroUid));
    const item = state.equipmentBag.find(i => i.uid === Number(itemUid)); // Ép kiểu Number để so sánh chính xác

    if (!hero || !item) return { success: false, msg: "Lỗi dữ liệu!" };

    if (!hero.equipped) hero.equipped = { weapon: null, armor: null, boots: null };
    const slot = item.type;

    // 1. Tháo đồ cũ (nếu có)
    if (hero.equipped[slot]) {
        const oldItem = hero.equipped[slot];
        oldItem.isEquipped = false;
        state.equipmentBag.push(oldItem);
    }

    // 2. Mặc đồ mới
    hero.equipped[slot] = item;
    
    // 3. Xóa khỏi túi
    state.equipmentBag = state.equipmentBag.filter(i => i.uid !== Number(itemUid));

    StorageSystem.save(state);
    return { success: true, msg: `Đã trang bị ${item.name}` };
}

export function unequipItem(heroUid, slot) {
    const state = getState();
    const hero = state.inventory.find(h => Number(h.uid) === Number(heroUid));

    if (!hero || !hero.equipped || !hero.equipped[slot]) return;

    const item = hero.equipped[slot];
    item.isEquipped = false;
    
    if (!state.equipmentBag) state.equipmentBag = [];
    state.equipmentBag.push(item);

    hero.equipped[slot] = null;
    StorageSystem.save(state);
    return { success: true };
}
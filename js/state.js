// js/state.js
import { StorageSystem } from './storage.js';

let currentState = StorageSystem.load() || {
    gems: 1000,
    inventory: [],
    supportInventory: [],
    progress: { campaignStage: 1, towerFloor: 1 },
    team: [],
    lastLogin: Date.now()
};

// Tự động sửa lỗi dữ liệu cũ (nếu thiếu mảng)
['inventory', 'supportInventory', 'team'].forEach(key => {
    if (!Array.isArray(currentState[key])) currentState[key] = [];
});

export function getState() { return currentState; }

// --- HÀM GENERIC: Thêm vật phẩm vào mảng bất kỳ ---
function addItemToState(arrayName, itemData) {
    const newItem = {
        ...itemData,
        uid: Date.now() + Math.random(), // Tạo ID duy nhất
        isEquipped: false,
        equippedTo: null,
        // Chỉ tướng mới có level/star, trang bị thì không cần reset
        ...(arrayName === 'inventory' ? { level: 1, star: 0 } : {})
    };
    currentState[arrayName].push(newItem);
    StorageSystem.save(currentState);
    return newItem;
}

// Wrapper function để code bên ngoài dễ hiểu hơn
export function addHeroToInventory(hero) { return addItemToState('inventory', hero); }
export function addSupportToInventory(item) { return addItemToState('supportInventory', item); }

// --- QUẢN LÝ TÀI NGUYÊN ---
export function updateGems(amount) {
    currentState.gems += amount;
    StorageSystem.save(currentState);
}

// --- QUẢN LÝ TRANG BỊ ---
export function equipSupportItem(heroUid, supportUid) {
    const hero = currentState.inventory.find(h => h.uid === heroUid);
    const item = currentState.supportInventory.find(s => s.uid === supportUid);
    if (!hero || !item) return false;

    if (hero.equippedItemUid) unequipSupportItem(hero.uid); // Tháo đồ cũ
    if (item.isEquipped && item.equippedTo) unequipSupportItem(item.equippedTo); // Gỡ khỏi người cũ

    hero.equippedItemUid = supportUid;
    item.isEquipped = true;
    item.equippedTo = heroUid;
    StorageSystem.save(currentState);
    return true;
}

export function unequipSupportItem(heroUid) {
    const hero = currentState.inventory.find(h => h.uid === heroUid);
    if (!hero || !hero.equippedItemUid) return false;

    const item = currentState.supportInventory.find(s => s.uid === hero.equippedItemUid);
    if (item) {
        item.isEquipped = false;
        item.equippedTo = null;
    }
    hero.equippedItemUid = null;
    StorageSystem.save(currentState);
    return true;
}

// --- CÁC HÀM KHÁC (Giữ nguyên logic đặc thù) ---
export function toggleTeamMember(uid) {
    const idx = currentState.team.indexOf(uid);
    if (idx > -1) currentState.team.splice(idx, 1);
    else {
        if (currentState.team.length >= 5) return alert("Đội hình tối đa 5 tướng!");
        currentState.team.push(uid);
    }
    StorageSystem.save(currentState);
}

export function removeHeroFromInventory(uid) {
    if (currentState.team.includes(Number(uid))) return { success: false, message: "Tướng đang trong đội hình!" };
    currentState.inventory = currentState.inventory.filter(h => Number(h.uid) !== Number(uid));
    updateGems(10);
    StorageSystem.save(currentState);
    return { success: true };
}

export function upgradeHeroLevel(uid) {
    const hero = currentState.inventory.find(h => Number(h.uid) === Number(uid));
    if (currentState.gems < 100) return alert("Thiếu 100 Gem để nâng cấp!");
    hero.level++;
    hero.hp = Math.floor(hero.hp * 1.1);
    hero.atk = Math.floor(hero.atk * 1.1);
    updateGems(-100);
    StorageSystem.save(currentState);
    return true;
}

export function upgradeHeroStarBulk(targetUid, materialUids) {
    const hero = currentState.inventory.find(h => h.uid === targetUid);
    const mUids = materialUids.map(Number);
    const oldHP = hero.hp; const oldATK = hero.atk; const oldStar = hero.star;
    
    // Xóa nguyên liệu
    currentState.inventory = currentState.inventory.filter(h => !mUids.includes(Number(h.uid)));
    
    // Tăng chỉ số
    mUids.forEach(() => {
        hero.star++;
        hero.hp = Math.floor(hero.hp * 1.5);
        hero.atk = Math.floor(hero.atk * 1.5);
    });
    StorageSystem.save(currentState);
    
    return { success: true, count: mUids.length, newStar: hero.star, oldHP, newHP: hero.hp, oldATK, newATK: hero.atk };
}

export function advanceStage(type) {
    if (type === 'campaign') currentState.progress.campaignStage++;
    else currentState.progress.towerFloor++;
    StorageSystem.save(currentState);
}
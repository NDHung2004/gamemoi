// js/state.js
import { StorageSystem } from './storage.js';

export const MAX_INVENTORY = 500;

// 1. Khởi tạo trạng thái ban đầu
const DEFAULT_STATE = {
    gems: 1000,
    inventory: [],
    equipmentBag: [],
    history: [],
    progress: {
        campaignStage: 1,
        towerFloor: 1
    },
    team: [],
    createdAt: new Date().toISOString()
};

// 2. Load dữ liệu và tự động sửa lỗi (Migration)
let currentState = StorageSystem.load();
if (!currentState.equipmentBag) currentState.equipmentBag = [];
// Kiểm tra và tự động thêm dữ liệu còn thiếu
if (!currentState.progress) {
    currentState.progress = { ...DEFAULT_STATE.progress };
}
if (!currentState.team) {
    currentState.team = [];
}
StorageSystem.save(currentState);

// 3. Các hàm Export
export function getState() {
    return currentState;
}

export function updateGems(amount) {
    currentState.gems += amount;
    StorageSystem.save(currentState);
}

export function advanceStage(type) {
    if (type === 'campaign') currentState.progress.campaignStage++;
    if (type === 'tower') currentState.progress.towerFloor++;
    StorageSystem.save(currentState);
}

export function toggleTeamMember(heroUid) {
    const uid = Number(heroUid); 
    const index = currentState.team.indexOf(uid);
    
    if (index > -1) {
        currentState.team.splice(index, 1);
    } else {
        const exists = currentState.inventory.some(h => Number(h.uid) === uid);
        if (!exists) return false;

        if (currentState.team.length >= 5) {
            alert("Đội hình chỉ tối đa 5 tướng!");
            return false;
        }
        currentState.team.push(uid);
    }
    
    StorageSystem.save(currentState);
    return true; 
}

export function addHeroToInventory(hero) {
    if (currentState.inventory.length >= MAX_INVENTORY) return false;

    const heroData = { 
        ...hero, 
        level: hero.level || 1, 
        star: hero.star || 0,
        obtainedAt: new Date().toISOString(),
        uid: Date.now() + Math.random(),
        // MỚI: Khởi tạo slot trang bị trống
        equipped: { weapon: null, armor: null, boots: null }
    };
    currentState.inventory.push(heroData);
    currentState.history.unshift(`Nhận [${hero.rank}] ${hero.name}`);
    if(currentState.history.length > 50) currentState.history.pop();

    StorageSystem.save(currentState);
    return true;
}

// --- LOGIC NÂNG CẤP & TIẾN HÓA ---

// js/state.js

export function upgradeHeroLevel(heroUid) {
    const targetUid = Number(heroUid);
    const hero = currentState.inventory.find(h => Number(h.uid) === targetUid);
    if (!hero) return false;

    const cost = (hero.level || 1) * 100;
    if (currentState.gems < cost) {
        alert("Không đủ Kim cương!");
        return false;
    }

    updateGems(-cost);
    hero.level = (hero.level || 1) + 1;
    hero.hp = Math.floor(hero.hp * 1.1);
    hero.atk = Math.floor(hero.atk * 1.1);
    
    StorageSystem.save(currentState);
    return true;
}

// js/state.js

// js/state.js
export function upgradeHeroStarWithMaterial(targetUid, materialUid) {
    const tUid = Number(targetUid);
    const mUid = Number(materialUid);

    // 1. Tìm thẻ chính và thẻ nguyên liệu
    const hero = currentState.inventory.find(h => Number(h.uid) === tUid);
    const material = currentState.inventory.find(h => Number(h.uid) === mUid);

    if (!hero || !material) {
        alert("Lỗi: Không tìm thấy thẻ tướng hoặc nguyên liệu!");
        return false;
    }

    if (hero.star >= 10) {
        alert("Tướng đã đạt tối đa 10 sao!");
        return false;
    }

    // 2. Xóa thẻ nguyên liệu khỏi túi đồ
    currentState.inventory = currentState.inventory.filter(h => Number(h.uid) !== mUid);

    // 3. Nâng sao và tăng chỉ số cho thẻ chính
    hero.star = (hero.star || 0) + 1;
    hero.hp = Math.floor(hero.hp * 1.5);
    hero.atk = Math.floor(hero.atk * 1.5);

    StorageSystem.save(currentState);
    return true;
}
export function upgradeHeroStar(heroUid) {
    const targetUid = Number(heroUid);
    const hero = currentState.inventory.find(h => Number(h.uid) === targetUid);
    
    if (!hero) return false;

    // CHẶN NẾU ĐÃ ĐẠT 10 SAO
    if ((hero.star || 0) >= 10) {
        alert("Tướng đã đạt tối đa 10 sao!");
        return false;
    }

    const duplicateIndex = currentState.inventory.findIndex(h => 
        h.id === hero.id && Number(h.uid) !== targetUid
    );

    if (duplicateIndex === -1) {
        alert("Cần thêm 1 thẻ cùng loại để nâng sao!");
        return false;
    }

    // Thực hiện nâng sao
    currentState.inventory.splice(duplicateIndex, 1);
    hero.star = (hero.star || 0) + 1;
    
    // Tăng chỉ số mạnh mẽ hơn
    hero.hp = Math.floor(hero.hp * 1.5);
    hero.atk = Math.floor(hero.atk * 1.5);

    StorageSystem.save(currentState);
    return true;
}
// js/state.js

// js/state.js

export function upgradeHeroStarBulk(targetUid, materialUids) {
    const hero = currentState.inventory.find(h => Number(h.uid) === Number(targetUid));
    if (!hero || hero.star >= 10) return { success: false, message: "Lỗi dữ liệu hoặc đã Max sao!" };

    // 1. Lưu lại chỉ số CŨ để làm báo cáo
    const oldHP = hero.hp;
    const oldATK = hero.atk;
    const oldStar = hero.star;

    // 2. Xử lý nguyên liệu
    const mUids = materialUids.map(Number);
    const canAdd = Math.min(mUids.length, 10 - hero.star);
    const actualMaterials = mUids.slice(0, canAdd);

    // Xóa nguyên liệu khỏi túi
    currentState.inventory = currentState.inventory.filter(h => !actualMaterials.includes(Number(h.uid)));

    // 3. TÍNH TOÁN CHỈ SỐ MỚI (Mỗi sao tăng 1.5 lần)
    actualMaterials.forEach(() => {
        hero.star++;
        hero.hp = Math.floor(hero.hp * 1.5);
        hero.atk = Math.floor(hero.atk * 1.5);
    });

    StorageSystem.save(currentState);

    // 4. TRẢ VỀ DỮ LIỆU ĐỂ HIỂN THỊ THÔNG BÁO
    return { 
        success: true, 
        count: actualMaterials.length, // Số sao đã tăng
        newStar: hero.star,
        oldHP: oldHP,
        newHP: hero.hp,
        oldATK: oldATK,
        newATK: hero.atk
    };
}
export function evolveHero(heroUid) {
    const hero = currentState.inventory.find(h => h.uid === heroUid);
    if ((hero.star || 0) < 5) {
        alert("Cần đạt 5 sao để tiến hóa!");
        return false;
    }

    const EVOLVE_COST = 5000;
    if (currentState.gems < EVOLVE_COST) {
        alert("Không đủ 5000 Kim cương!");
        return false;
    }

    const RANK_UP = { "R": "SR", "SR": "SSR", "SSR": "UR", "UR": "GOD" };
    const nextRank = RANK_UP[hero.rank];

    if (!nextRank) {
        alert("Tướng đã đạt phẩm cấp tối đa!");
        return false;
    }

    updateGems(-EVOLVE_COST);
    hero.rank = nextRank;
    hero.star = 0;
    hero.level = 1;
    hero.hp *= 2;
    hero.atk *= 2;
    
    currentState.history.unshift(`✨ TIẾN HÓA: ${hero.name} -> [${nextRank}]`);
    StorageSystem.save(currentState);
    return true;
}

export function clearInventory() {
    currentState.inventory = [];
    currentState.team = [];
    currentState.equipmentBag = [];
    StorageSystem.save(currentState);
}

export function setGemsDirectly(value) {
    currentState.gems = value;
    StorageSystem.save(currentState);
}
// js/state.js

// Đảm bảo có từ khóa 'export' ở đầu hàm
// js/state.js

export function removeHeroFromInventory(uid) {
    // Kiểm tra xem tướng có đang trong đội hình (team) không
    if (currentState.team.includes(Number(uid))) {
        // Trả về False để UI biết đường báo lỗi
        return { success: false, message: "Tướng đang ra trận!" }; 
    }

    // Nếu không trong đội, tiến hành xóa
    currentState.inventory = currentState.inventory.filter(h => Number(h.uid) !== Number(uid));
    
    // Cộng tiền
    updateGems(10);
    
    // Lưu lại
    StorageSystem.save(currentState);
    
    return { success: true };
}

// js/state.js

export const MAX_EQUIPMENT_BAG = 200; // Giới hạn túi trang bị

// Hàm xóa trang bị khỏi túi
// js/state.js

// 1. Logic Xóa trang bị (Giống tướng: +10 Gem, kiểm tra đang mặc)
export function removeEquipmentFromBag(uid) {
    const state = getState();
    const itemUid = Number(uid);

    // Kiểm tra xem có anh hùng nào đang mặc món đồ này không
    const isEquipped = state.inventory.some(hero => 
        hero.equipped && Object.values(hero.equipped).some(eq => eq && Number(eq.uid) === itemUid)
    );

    if (isEquipped) {
        return { success: false, message: "Trang bị đang được sử dụng, không thể bán!" };
    }

    // Xóa khỏi túi đồ
    state.equipmentBag = state.equipmentBag.filter(item => Number(item.uid) !== itemUid);
    
    // Cộng 10 Gem giống như bán tướng
    updateGems(10); 
    
    StorageSystem.save(state);
    return { success: true };
}

// 2. Logic Nâng cấp Level trang bị
export function upgradeEquipmentLevel(targetUid) {
    const state = getState();
    // Ép kiểu Number để đảm bảo tìm đúng UID duy nhất (Unique ID)
    const tUid = Number(targetUid);
    
    // Tìm chính xác món đồ người dùng đang mở trong Modal
    const item = state.equipmentBag.find(i => Number(i.uid) === tUid);

    if (!item) {
        console.error("Không tìm thấy trang bị để nâng cấp!");
        return false;
    }

    // Tính toán phí nâng cấp dựa trên Level hiện tại của CHÍNH món đồ đó
    const cost = (item.level || 1) * 100;
    
    if (state.gems < cost) {
        alert("Không đủ Kim cương!");
        return false;
    }

    // Thực hiện trừ tiền và tăng cấp
    updateGems(-cost);
    item.level = (item.level || 1) + 1;
    
    // Chỉ tăng chỉ số cho món đồ có UID này
    item.stat = Math.floor(item.stat * 1.1);
    
    StorageSystem.save(state);
    return true;
}

// 3. Logic Nâng sao gộp (Bulk) cho trang bị (Dùng đồ trùng ID làm phôi)
// js/state.js

export function upgradeEquipmentStarBulk(targetUid, materialUids) {
    const state = getState();
    // Ép kiểu Number để tìm kiếm chính xác
    const tUid = Number(targetUid);
    const item = state.equipmentBag.find(i => Number(i.uid) === tUid);
    
    if (!item || (item.star || 0) >= 10) {
        return { success: false, message: "Trang bị không tồn tại hoặc đã đạt tối đa 10 sao!" };
    }

    // Chuyển mảng UID phôi sang kiểu số
    const mUids = materialUids.map(Number);
    
    // Tính toán số lượng phôi thực tế có thể dùng (tối đa đến 10 sao)
    const canAdd = Math.min(mUids.length, 10 - (item.star || 0));
    const actualMaterials = mUids.slice(0, canAdd);

    // QUAN TRỌNG: Loại bỏ các phôi khỏi túi đồ
    state.equipmentBag = state.equipmentBag.filter(i => !actualMaterials.includes(Number(i.uid)));

    // Tăng sao và chỉ số (Ví dụ: 1.5 lần mỗi sao tương tự tướng)
    actualMaterials.forEach(() => {
        item.star = (item.star || 0) + 1;
        item.stat = Math.floor(item.stat * 1.5); 
    });

    StorageSystem.save(state); // Lưu trạng thái mới
    
    return { 
        success: true, 
        newStar: item.star,
        count: actualMaterials.length 
    };
}
// Hàm nâng sao trang bị (Dùng trang bị cùng ID làm nguyên liệu)
export function upgradeEquipmentStar(targetUid, materialUid) {
    const state = getState();
    const item = state.equipmentBag.find(i => i.uid === targetUid);
    const material = state.equipmentBag.find(i => i.uid === materialUid);

    if (!item || !material || item.id !== material.id || targetUid === materialUid) {
        alert("Nguyên liệu không hợp lệ (phải cùng loại)!");
        return false;
    }

    if ((item.star || 0) >= 5) {
        alert("Đã đạt tối đa 5 sao!");
        return false;
    }

    // Xóa nguyên liệu
    state.equipmentBag = state.equipmentBag.filter(i => i.uid !== materialUid);
    
    // Tăng sao và chỉ số đột biến
    item.star = (item.star || 0) + 1;
    item.stat = Math.floor(item.stat * 1.5); // Tăng 50% chỉ số khi lên sao

    StorageSystem.save(state);
    return true;
}

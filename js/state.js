// js/state.js
import { StorageSystem } from './storage.js';

export const MAX_INVENTORY = 500;

// 1. Khởi tạo trạng thái ban đầu
const DEFAULT_STATE = {
    gems: 1000,
    inventory: [],
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
    // Ép kiểu UID về số để tránh lỗi so sánh giữa string và number
    const uid = Number(heroUid); 
    const index = currentState.team.indexOf(uid);
    
    if (index > -1) {
        // Nếu đã có thì xóa (Hủy chọn)
        currentState.team.splice(index, 1);
        console.log("Đã bỏ chọn tướng:", uid);
    } else {
        // Kiểm tra xem tướng có tồn tại trong túi đồ không trước khi thêm
        const exists = currentState.inventory.some(h => h.uid === uid);
        if (!exists) {
            console.error("Tướng không tồn tại trong túi đồ!");
            return false;
        }

        // Nếu chưa có thì thêm vào (nhưng không quá 5)
        if (currentState.team.length >= 5) {
            alert("Đội hình chỉ tối đa 5 tướng!");
            return false;
        }
        currentState.team.push(uid);
        console.log("Đã chọn tướng vào đội hình:", uid);
    }
    
    StorageSystem.save(currentState);
    return true; 
}

export function addHeroToInventory(hero) {
    if (currentState.inventory.length >= MAX_INVENTORY) return false;

    const heroData = { 
        ...hero, 
        level: hero.level || 1, // Đảm bảo có level
        star: hero.star || 0,   // Đảm bảo có sao
        obtainedAt: new Date().toISOString(),
        uid: Date.now() + Math.random()
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
    // 1. Ép kiểu về Number để so sánh chính xác tuyệt đối
    const targetUid = Number(heroUid);
    
    // 2. Tìm chính xác thẻ dựa trên UID duy nhất
    const hero = currentState.inventory.find(h => Number(h.uid) === targetUid);

    if (!hero) {
        console.error("Không tìm thấy tướng để nâng cấp!");
        return false;
    }

    const cost = (hero.level || 1) * 100;
    if (currentState.gems < cost) {
        alert("Không đủ Kim cương!");
        return false;
    }

    updateGems(-cost);
    hero.level = (hero.level || 1) + 1;
    
    // Tăng chỉ số dựa trên chỉ số hiện tại của CHÍNH thẻ đó
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

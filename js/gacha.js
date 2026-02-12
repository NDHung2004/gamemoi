// js/gacha.js

import { getHeroDB } from './database.js'; 
// --- SỬA DÒNG DƯỚI ĐÂY (Thêm MAX_INVENTORY vào) ---
import { getState, updateGems, addHeroToInventory, MAX_INVENTORY } from './state.js'; 
// ---------------------------------------------------

const COST_PER_PULL = 160;

export function pullGacha(times) {
    const state = getState();
    
    // 1. Kiểm tra túi đầy (Giờ đã có biến MAX_INVENTORY để so sánh)
    if (state.inventory.length + times > MAX_INVENTORY) {
        return { 
            success: false, 
            message: `Túi đã đầy (${state.inventory.length}/${MAX_INVENTORY})! Hãy bán bớt tướng.` 
        };
    }

    // 2. Kiểm tra tiền
    const totalCost = COST_PER_PULL * times;
    if (state.gems < totalCost) {
        return { success: false, message: "Không đủ Kim Cương!" };
    }

    updateGems(-totalCost);

    let results = [];
    const currentDB = getHeroDB(); 

    for (let i = 0; i < times; i++) {
        const hero = rollSingle(currentDB);
        // Lưu ý: addHeroToInventory cũng kiểm tra full túi, 
        // nhưng ta đã chặn ngay từ đầu hàm này rồi nên an toàn.
        addHeroToInventory(hero); 
        results.push(hero);
    }

    return { success: true, results: results };
}

// Logic random dựa trên trọng số
// js/gacha.js
function rollSingle(db) {
    // Tính tổng tất cả tỉ lệ hiện có trong DB
    const totalRate = db.reduce((sum, hero) => sum + hero.rate, 0);
    let rand = Math.random() * totalRate; // Random trong khoảng tổng tỉ lệ thực tế
    let cumulative = 0;
    
    for (let hero of db) {
        cumulative += hero.rate;
        if (rand < cumulative) {
            return { ...hero };
        }
    }
    return { ...db[0] };
}
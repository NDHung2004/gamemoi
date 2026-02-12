// js/ui-equipment.js
import { getState } from './state.js';
import { calculateHeroStats, equipItem, unequipItem } from './equipment.js';
import { EQUIPMENT_DB } from './items.js';
import { renderInventory, updateHeader } from './ui.js';
let currentHeroUid = null;

// Hàm mở Modal Quản lý Trang bị
export function openEquipmentModal(heroUid) {
    currentHeroUid = heroUid;
    renderEquipmentModal();
}

function renderEquipmentModal() {
    const state = getState();
    const hero = state.inventory.find(h => Number(h.uid) === Number(currentHeroUid));
    if (!hero) return;

    // Tính chỉ số (bao gồm đồ)
    const stats = calculateHeroStats(hero);
    
    // Đảm bảo object equipped tồn tại
    const equipped = hero.equipped || { weapon: null, armor: null, boots: null };

    // HTML cho 3 slot
    const slotsHtml = `
        <div class="equip-slots-container">
            ${renderSlot(equipped.weapon, 'weapon', '🗡️ Vũ Khí')}
            ${renderSlot(equipped.armor, 'armor', '👕 Giáp')}
            ${renderSlot(equipped.boots, 'boots', '👞 Giày')}
        </div>
    `;

    // HTML hiển thị chỉ số
    const statsHtml = `
        <div class="equip-stats">
            <p>❤️ HP: <span class="stat-val">${stats.hp}</span> ${getBonusText(hero.hp, stats.hp)}</p>
            <p>⚔️ ATK: <span class="stat-val">${stats.atk}</span> ${getBonusText(hero.atk, stats.atk)}</p>
            <p>💨 SPD: <span class="stat-val">${stats.speed}</span> ${getBonusText(hero.speed, stats.speed)}</p>
        </div>
    `;

    // Dựng Modal
    const modalHtml = `
        <div id="equip-modal" class="gm-modal">
            <div class="gm-box" style="max-width: 500px;">
                <h3 class="gm-title">${hero.name} - Trang Bị</h3>
                
                <div style="display:flex; gap:15px; margin-bottom:20px;">
                    <div class="card" style="transform:scale(0.8); margin:0;">
                        <div class="hero-icon">${hero.img}</div>
                    </div>
                    ${statsHtml}
                </div>

                ${slotsHtml}

                <div id="equip-selection-area" class="equip-selection-list">
                    <p style="text-align:center; color:#777;">Bấm vào một ô trang bị để thay đổi</p>
                </div>

                <button class="gm-btn gm-btn-gray" style="width:100%; margin-top:20px" 
                    onclick="document.getElementById('equip-modal').remove()">ĐÓNG</button>
            </div>
        </div>
    `;

    // Xóa modal cũ nếu có
    const old = document.getElementById('equip-modal');
    if (old) old.remove();

    // Thêm modal mới
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
}

// Render 1 ô slot
function renderSlot(item, type, label) {
    if (item) {
        return `
            <div class="equip-slot active" onclick="window.selectSlot('${type}')">
                <div class="slot-icon">${item.img}</div>
                <div class="slot-info">
                    <div class="slot-name ${item.rarity}">${item.name}</div>
                    <div class="slot-stat">+${item.stat} ${getStatName(type)}</div>
                </div>
                <button class="slot-remove-btn" onclick="event.stopPropagation(); window.doUnequip('${type}')">✖</button>
            </div>
        `;
    } else {
        return `
            <div class="equip-slot empty" onclick="window.selectSlot('${type}')">
                <div class="slot-icon">➕</div>
                <div class="slot-label">${label}</div>
            </div>
        `;
    }
}

// Helper texts
function getBonusText(base, total) {
    const diff = total - base;
    return diff > 0 ? `<span style="color:#00ff00">(+${diff})</span>` : '';
}
function getStatName(type) {
    if (type === 'weapon') return 'ATK';
    if (type === 'armor') return 'HP';
    if (type === 'boots') return 'SPD';
    return '';
}

// --- GLOBAL FUNCTIONS cho HTML gọi ---

window.selectSlot = (type) => {
    const state = getState();
    const listArea = document.getElementById('equip-selection-area');
    
    // Lọc đồ trong túi phù hợp với slot này
    const availableItems = (state.equipmentBag || []).filter(i => i.type === type);

    if (availableItems.length === 0) {
        listArea.innerHTML = `<p style="text-align:center; padding:10px; color:#ff3c3c;">Không có ${type} nào trong túi!</p>`;
        return;
    }

    listArea.innerHTML = availableItems.map(item => `
        <div class="equip-item-row" onclick="window.doEquip('${item.uid}')">
            <div style="font-size:20px; margin-right:10px;">${item.img}</div>
            <div style="flex-grow:1;">
                <div class="item-name ${item.rarity}">${item.name}</div>
                <div class="item-desc">${item.desc}</div>
            </div>
            <div class="item-stat">+${item.stat}</div>
            <button class="gm-btn gm-btn-blue" style="font-size:10px; margin-left:5px;">Mặc</button>
        </div>
    `).join('');
};

window.doEquip = (itemUid) => {
    // 1. Thực hiện logic mặc đồ
    const res = equipItem(currentHeroUid, Number(itemUid)); 
    
    if (res.success) {
        // 2. Cập nhật lại số liệu trong Modal Trang bị hiện tại
        renderEquipmentModal(); 
        
        // 3. CẬP NHẬT LẠI TÚI TƯỚNG BÊN NGOÀI (Quan trọng)
        renderInventory(); 
        
        // 4. Cập nhật lại Gem nếu có tốn phí (nếu cần)
        updateHeader();
    } else {
        alert(res.msg);
    }
};

window.doUnequip = (slot) => {
    const res = unequipItem(currentHeroUid, slot);
    if (res && res.success) {
        renderEquipmentModal();
        renderInventory(); // Cập nhật lại giao diện túi tướng sau khi tháo đồ
    }
};
// js/admin.js
import { getState, updateGems, clearInventory } from './state.js';
import { addEquipmentToBag } from './equipment.js';
import { updateHeader, renderInventory } from './ui.js'; // Thêm renderInventory nếu cần reset túi
import { 
    resetDB, getHeroDB, getCampaignDB, 
    addNewHeroToDB, updateHeroInDB, deleteHeroFromDB,
    addStageToDB, updateStageInDB, deleteStageFromDB 
} from './database.js';
// IMPORT MỚI CHO TRANG BỊ
import { EQUIPMENT_DB, ITEM_TYPES, addItemToDB, updateItemInDB, deleteItemFromDB } from './items.js';

export function initAdminPanel() {
    const btn = document.createElement('button');
    btn.innerText = "⚙️ GM Tool";
    btn.className = "gm-floating-btn"; 
    btn.onclick = () => showAdminModal();
    document.body.appendChild(btn);
}

let currentAdminTab = 'general'; // general, heroes, stages, items

function showAdminModal() {
    renderAdminModal();
}

function renderAdminModal() {
    const old = document.getElementById('admin-modal');
    if(old) old.remove();

    const modalHtml = `
    <div id="admin-modal" class="gm-modal" style="align-items: flex-start; padding-top: 50px; overflow-y: auto;">
      <div class="gm-box" style="width: 95%; max-width: 800px;">
        <h2 class="gm-title">🛠️ GM CONTROL PANEL</h2>
        
        <div class="gm-tabs">
            <button class="gm-tab-btn ${currentAdminTab==='general'?'active':''}" onclick="window.switchAdminTab('general')">Chung</button>
            <button class="gm-tab-btn ${currentAdminTab==='heroes'?'active':''}" onclick="window.switchAdminTab('heroes')">Tướng</button>
            <button class="gm-tab-btn ${currentAdminTab==='stages'?'active':''}" onclick="window.switchAdminTab('stages')">Ải</button>
            <button class="gm-tab-btn ${currentAdminTab==='items'?'active':''}" onclick="window.switchAdminTab('items')">🛡️ Trang Bị</button>
        </div>

        <div id="gm-tab-content" style="max-height: 60vh; overflow-y: auto; padding: 10px;">
            ${renderTabContent()}
        </div>

        <button class="gm-btn gm-btn-gray" style="width:100%; margin-top:20px" onclick="document.getElementById('admin-modal').remove()">ĐÓNG PANEL</button>
      </div>
    </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
}

window.switchAdminTab = (tab) => { currentAdminTab = tab; renderAdminModal(); };

function renderTabContent() {
    switch(currentAdminTab) {
        case 'general': return renderGeneralTab();
        case 'heroes': return renderHeroesTab();
        case 'stages': return renderStagesTab();
        case 'items': return renderItemsTab(); // TAB MỚI
        default: return 'Empty';
    }
}

// ========================================================================
// --- TAB 1: CHUNG (Tài nguyên & Hack nhanh) ---
// ========================================================================
function renderGeneralTab() {
    return `
        <fieldset class="gm-section"><legend>💰 Tài Nguyên</legend>
          <button class="gm-btn gm-btn-blue" onclick="window.adminAction('add_gem', 50000)">+50k Gem</button>
          <button class="gm-btn gm-btn-blue" onclick="window.adminAction('add_gem', 10000)">+10k Gem</button>
          <button class="gm-btn gm-btn-orange" onclick="window.adminAction('clear_inv')">Xóa Túi</button>
          <button class="gm-btn gm-btn-purple" onclick="window.adminAction('reset_db')">Reset DB Gốc</button>
        </fieldset>
        
        <fieldset class="gm-section" style="border-color: #00ff00;"><legend>🎒 Hack Nhanh Trang Bị (Test)</legend>
          <button class="gm-btn gm-btn-green" onclick="window.addTestEquip(103)">+ Kiếm SSR</button>
          <button class="gm-btn gm-btn-green" onclick="window.addTestEquip(203)">+ Giáp SSR</button>
          <button class="gm-btn gm-btn-green" onclick="window.addTestEquip(303)">+ Giày SSR</button>
          <div style="font-size:10px; color:#aaa; margin-top:5px;">(Vào túi tướng bấm "Trang bị" để mặc)</div>
        </fieldset>`;
}

// ========================================================================
// --- TAB 2: QUẢN LÝ TƯỚNG (HEROES) ---
// ========================================================================
// js/admin.js

// js/admin.js

function renderItemsTab() {
    const db = EQUIPMENT_DB;
    const nextId = db.length > 0 ? Math.max(...db.map(i => i.id)) + 1 : 101;

    // Sử dụng style inline để ép chiều ngang không được vượt quá container
    let html = `
        <div style="margin-bottom: 20px; border-bottom: 2px solid #555; padding-bottom: 20px; width: 100%; box-sizing: border-box;">
            <h3 style="color:gold;">${editingItemId ? 'Sửa Trang Bị ID: ' + editingItemId : 'Thêm Trang Bị Mới'}</h3>
            <form id="item-form" onsubmit="event.preventDefault(); window.saveItemData();" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="gm-grid" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                    <div>
                        <label style="font-size:10px;">ID (Tự động):</label>
                        <input type="number" id="i-id" class="gm-input" value="${editingItemId ? editingItemId : nextId}" disabled style="width: 100%; background: #333;">
                    </div>
                    <div>
                        <label style="font-size:10px;">Tên Trang Bị:</label>
                        <input type="text" id="i-name" class="gm-input" placeholder="Tên" required style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size:10px;">Icon:</label>
                        <input type="text" id="i-img" class="gm-input" placeholder="Icon" required style="width: 100%;">
                    </div>
                </div>

                <div class="gm-grid" style="grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
                    <select id="i-type" class="gm-select" style="width: 100%;">
                        <option value="weapon">Vũ Khí</option>
                        <option value="armor">Giáp</option>
                        <option value="boots">Giày</option>
                    </select>
                    <select id="i-rarity" class="gm-select" style="width: 100%;">
                        <option value="R">R</option>
                        <option value="SR">SR</option>
                        <option value="SSR">SSR</option>
                    </select>
                    <input type="number" id="i-rate" class="gm-input" step="0.001" placeholder="Rate (0.1)" required style="width: 100%;">
                </div>

                <input type="number" id="i-stat" class="gm-input" placeholder="Chỉ số cộng thêm" required style="width: 100%;">
                <input type="text" id="i-desc" class="gm-input" placeholder="Mô tả trang bị" style="width: 100%;">
                
                <button type="submit" class="gm-btn gm-btn-green" style="width:100%; margin-top: 5px;">LƯU TRANG BỊ</button>
                ${editingItemId ? `<button type="button" class="gm-btn gm-btn-gray" onclick="window.cancelEditItem()" style="width:100%;">HỦY</button>` : ''}
            </form>
        </div>

        <h3 style="color:cyan;">Danh Sách Trang Bị Hiện Có (${db.length})</h3>
        <div class="gm-list" style="max-height: 300px; overflow-y: auto; overflow-x: hidden; width: 100%; box-sizing: border-box;">
    `;

    // Render danh sách item (Đảm bảo không dùng bảng/table gây tràn)
    db.forEach(item => {
        const rarityColor = item.rarity === 'SSR' ? 'gold' : (item.rarity === 'SR' ? '#3498db' : '#eee');
        html += `
            <div class="gm-item" style="display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; padding: 10px; border-bottom: 1px solid #333;">
                <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                    <span style="color: #777; font-size: 10px;">#${item.id}</span>
                    <span style="font-size: 20px;">${item.img}</span>
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="color: ${rarityColor}; font-size: 13px;">${item.name}</strong>
                        <div style="font-size: 10px; color: #888;">+${item.stat} ${item.type}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 5px; flex-shrink: 0;">
                    <button class="gm-btn gm-btn-blue" style="padding: 2px 6px; font-size: 10px;" onclick="window.editItem(${item.id})">Sửa</button>
                    <button class="gm-btn gm-btn-red" style="padding: 2px 6px; font-size: 10px;" onclick="window.deleteItem(${item.id})">Xóa</button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

// ========================================================================
// --- TAB 3: QUẢN LÝ ẢI (STAGES) ---
// ========================================================================
function renderStagesTab() {
    const campaignDB = getCampaignDB();
    return `
    <fieldset class="gm-section">
      <legend>🗺️ Tạo Ải Cốt Truyện</legend>
      <div class="gm-grid">
        <input id="stg_name" class="gm-input" placeholder="Tên Ải">
        <input id="stg_desc" class="gm-input" placeholder="Mô tả ngắn">
        <input id="stg_enemy" class="gm-input" placeholder="Tên Boss">
        <input id="stg_img" class="gm-input" placeholder="Emoji/Icon" value="⚔️">
        <input id="stg_hp" type="number" class="gm-input" placeholder="HP Boss" value="1000">
        <input id="stg_atk" type="number" class="gm-input" placeholder="ATK Boss" value="100">
        <input id="stg_reward" type="number" class="gm-input" placeholder="Thưởng Gem" value="100">
      </div>
      <button class="gm-btn gm-btn-orange" style="width:100%; margin-top:10px" onclick="window.createStage()">➕ THÊM ẢI</button>
    </fieldset>

    <h4>Danh sách Ải (${campaignDB.length})</h4>
    <div class="gm-list">
      ${campaignDB.map(s => `
        <div class="gm-item">
          <span><strong>Ải ${s.id}:</strong> ${s.name}</span>
          <div>
            <button class="gm-btn gm-btn-blue" onclick="window.editStage(${s.id})">Sửa</button>
            <button class="gm-btn gm-btn-red" onclick="window.deleteStage(${s.id})">Xóa</button>
          </div>
        </div>
      `).join('')}
    </div>`;
}

// ========================================================================
// --- TAB 4: QUẢN LÝ TRANG BỊ (MỚI HOÀN TOÀN) ---
// ========================================================================

let editingItemId = null;

// js/admin.js (Trích đoạn hàm renderItemsTab)

// js/admin.js (Phần Form trong renderItemsTab)

// js/admin.js


function getRarityColor(r) { return r==='SSR'?'gold':(r==='SR'?'#3498db':'#eee'); }

// --- CÁC HÀM XỬ LÝ CRUD ITEM ---

window.saveItemData = () => {
    const data = {
        id: Number(document.getElementById('i-id').value),
        name: document.getElementById('i-name').value,
        img: document.getElementById('i-img').value,
        type: document.getElementById('i-type').value,
        rarity: document.getElementById('i-rarity').value,
        stat: Number(document.getElementById('i-stat').value),
        rate: parseFloat(document.getElementById('i-rate').value), // Lấy tỉ lệ
        desc: document.getElementById('i-desc').value
    };

    if (editingItemId) {
        updateItemInDB(editingItemId, data);
        editingItemId = null;
    } else {
        if(!addItemToDB(data)) return alert("ID này đã tồn tại!");
    }
    renderAdminModal();
};

window.editItem = (id) => {
    const item = EQUIPMENT_DB.find(i => i.id === id);
    if (!item) return;
    editingItemId = id;
    renderAdminModal(); // Render lại để hiện form sửa
    // Điền dữ liệu vào form
    setTimeout(() => {
        document.getElementById('i-id').value = item.id;
        document.getElementById('i-name').value = item.name;
        document.getElementById('i-img').value = item.img;
        document.getElementById('i-type').value = item.type;
        document.getElementById('i-rarity').value = item.rarity;
        document.getElementById('i-stat').value = item.stat;
        document.getElementById('i-desc').value = item.desc || '';
    }, 0);
};

window.deleteItem = (id) => {
    if(confirm(`Bạn chắc chắn muốn xóa trang bị ID ${id}?`)) {
        if(deleteItemFromDB(id)) { alert("Đã xóa!"); renderAdminModal(); }
        else alert("Lỗi xóa!");
    }
};

window.cancelEditItem = () => { editingItemId = null; renderAdminModal(); };

// ========================================================================
// --- CÁC HÀM WINDOW GLOBAL CŨ (ĐỂ ĐẢM BẢO TƯƠNG THÍCH) ---
// ========================================================================

window.adminAction = (action, value) => {
    switch(action) {
        case 'add_gem': updateGems(value); alert("Đã thêm Gem thành công!"); break;
        case 'clear_inv': if(confirm("Bạn chắc chắn muốn xóa sạch túi đồ?")) { clearInventory(); renderInventory(); alert("Đã xóa túi đồ."); } break;
        case 'reset_db': if(confirm("CẢNH BÁO: Reset Database Gốc?")) resetDB(); break;
    }
    updateHeader();
};

window.addTestEquip = (id) => { addEquipmentToBag(id); alert("Đã thêm trang bị vào túi!"); };

// --- XỬ LÝ TƯỚNG (Giữ nguyên logic cũ) ---
window.deleteHero = (id) => { if(confirm("Xóa tướng này?")) { deleteHeroFromDB(id); renderAdminModal(); } };
window.createCustomHero = () => {
    const name = document.getElementById('new_name').value;
    if(!name) return alert("Chưa nhập tên Tướng!");
    const newHero = {
        name: name,
        rank: document.getElementById('new_rank').value,
        hp: parseInt(document.getElementById('new_hp').value) || 100,
        atk: parseInt(document.getElementById('new_atk').value) || 10,
        def: parseInt(document.getElementById('new_def').value) || 0,
        speed: parseInt(document.getElementById('new_speed').value) || 10,
        rate: parseFloat(document.getElementById('new_rate').value) || 0.05,
        img: document.getElementById('new_img').value || "🃏",
        crit: 5
    };
    addNewHeroToDB(newHero);
    alert(`Đã thêm tướng "${name}"!`);
    renderAdminModal();
};
window.editHero = (id) => {
    const hero = getHeroDB().find(h => h.id === id);
    if (!hero) return;
    // Chuyển sang form tạo nhưng load dữ liệu cũ (Cách làm nhanh của bạn)
    document.getElementById('new_name').value = hero.name;
    document.getElementById('new_rank').value = hero.rank;
    document.getElementById('new_hp').value = hero.hp;
    document.getElementById('new_atk').value = hero.atk;
    document.getElementById('new_rate').value = hero.rate;
    document.getElementById('new_img').value = hero.img;

    const btn = document.querySelector('button[onclick="window.createCustomHero()"]');
    btn.innerText = "💾 LƯU THAY ĐỔI";
    btn.style.background = "green";
    btn.onclick = () => {
        const updated = {
            name: document.getElementById('new_name').value,
            rank: document.getElementById('new_rank').value,
            hp: parseInt(document.getElementById('new_hp').value),
            atk: parseInt(document.getElementById('new_atk').value),
            rate: parseFloat(document.getElementById('new_rate').value),
            img: document.getElementById('new_img').value
        };
        updateHeroInDB(id, updated);
        alert("Đã cập nhật!");
        renderAdminModal();
    };
};

// --- XỬ LÝ ẢI (Giữ nguyên logic cũ) ---
window.deleteStage = (id) => { if(confirm("Xóa ải này?")) { deleteStageFromDB(id); renderAdminModal(); } };
window.createStage = () => {
    const newStage = {
        name: document.getElementById('stg_name').value,
        desc: document.getElementById('stg_desc').value,
        enemyName: document.getElementById('stg_enemy').value,
        img: document.getElementById('stg_img').value || "⚔️",
        hp: parseInt(document.getElementById('stg_hp').value) || 1000,
        atk: parseInt(document.getElementById('stg_atk').value) || 50,
        reward: parseInt(document.getElementById('stg_reward').value) || 100
    };
    if(!newStage.name) return alert("Thiếu tên Ải!");
    addStageToDB(newStage);
    alert(`Đã thêm Ải: ${newStage.name}`);
    renderAdminModal();
};
window.editStage = (id) => {
    const stage = getCampaignDB().find(s => s.id === id);
    if (!stage) return;
    document.getElementById('stg_name').value = stage.name;
    document.getElementById('stg_desc').value = stage.desc;
    document.getElementById('stg_enemy').value = stage.enemyName;
    document.getElementById('stg_hp').value = stage.hp;
    document.getElementById('stg_atk').value = stage.atk;
    document.getElementById('stg_reward').value = stage.reward;

    const btn = document.querySelector('button[onclick="window.createStage()"]');
    btn.innerText = "💾 LƯU THAY ĐỔI";
    btn.style.background = "green";
    btn.onclick = () => {
        const updated = {
            name: document.getElementById('stg_name').value,
            desc: document.getElementById('stg_desc').value,
            enemyName: document.getElementById('stg_enemy').value,
            hp: parseInt(document.getElementById('stg_hp').value),
            atk: parseInt(document.getElementById('stg_atk').value),
            reward: parseInt(document.getElementById('stg_reward').value),
            img: document.getElementById('stg_img').value
        };
        updateStageInDB(id, updated);
        alert("Đã cập nhật ải!");
        renderAdminModal();
    };
};
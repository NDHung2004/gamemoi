import { getState, setGemsDirectly, clearInventory, updateGems, addHeroToInventory, addSupportToInventory } from './state.js';
import { StorageSystem } from './storage.js';
import { updateHeader, renderInventory } from './ui.js';
// Import đủ cả Tướng và Ải
import {
  addNewHeroToDB,
  resetDB,
  getHeroDB,
  addStageToDB,
  getCampaignDB,
  deleteHeroFromDB,
  updateHeroInDB,
  deleteStageFromDB,
  updateStageInDB
} from './database.js';

export function initAdminPanel() {
    const btn = document.createElement('button');
    btn.innerText = "⚙️ GM Tool";
    btn.className = "gm-floating-btn"; // Sử dụng class CSS thay vì inline style
    btn.onclick = () => showAdminModal();
    document.body.appendChild(btn);
}

 function showAdminModal() {
    const state = getState();
    const heroDB = getHeroDB();         // Lấy danh sách tướng
    const campaignDB = getCampaignDB(); // Lấy danh sách ải

    const modalHtml = `
<div id="admin-modal" class="gm-modal">
  <div class="gm-box">

    <h2 class="gm-title">🛠️ TRUNG TÂM QUẢN LÝ (GM)</h2>

    <fieldset class="gm-section">
      <legend>💰 Tài Nguyên</legend>
      <button class="gm-btn gm-btn-blue" onclick="window.adminAction('add_gem', 100000)">+100k Gem</button>
      <button class="gm-btn gm-btn-blue" onclick="window.adminAction('add_gem', 10000)">+10k Gem</button>
      <button class="gm-btn gm-btn-orange" onclick="window.adminAction('clear_inv')">Xóa Túi</button>
      <button class="gm-btn gm-btn-purple" onclick="window.adminAction('reset_db')">Reset Database Gốc</button>
    </fieldset>

    <fieldset class="gm-section">
      <legend>🃏 Tạo Tướng Mới</legend>
      <div class="gm-grid">
        <input id="new_name" class="gm-input" placeholder="Tên tướng">
        <select id="new_rank" class="gm-select">
          <option value="R">Rank R</option>
          <option value="SR">Rank SR</option>
          <option value="SSR">Rank SSR</option>
          <option value="UR">Rank UR</option>
        </select>
        <input id="new_hp" type="number" class="gm-input" placeholder="HP" value="100">
        <input id="new_atk" type="number" class="gm-input" placeholder="ATK" value="20">
        <input id="new_def" type="number" class="gm-input" placeholder="DEF" value="5">
        <input id="new_speed" type="number" class="gm-input" placeholder="Speed" value="10">
        <input id="new_rate" type="number" class="gm-input" placeholder="Rate" value="0.05">
        <input id="new_img" class="gm-input" placeholder="Emoji" value="🐲">
      </div>
      <button class="gm-btn gm-btn-blue" style="width:100%; margin-top:10px" onclick="window.createCustomHero()">💾 TẠO TƯỚNG</button>
    </fieldset>

    <h4>Danh sách Tướng (${heroDB.length})</h4>
    <div class="gm-list">
      ${heroDB.map(h => `
        <div class="gm-item">
          <span>[${h.id}] <strong>${h.name}</strong> (${h.rank})</span>
          <div>
            <button class="gm-btn gm-btn-blue" onclick="window.editHero(${h.id})">Sửa</button>
            <button class="gm-btn gm-btn-red" onclick="window.deleteHero(${h.id})">Xóa</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div></div>
    <fieldset class="gm-section">
  <legend>🗺️ Tạo Ải Cốt Truyện</legend>

  <div class="gm-grid">
    <input id="stg_name" class="gm-input" placeholder="Tên Ải (VD: Núi Lửa)">
    <input id="stg_desc" class="gm-input" placeholder="Mô tả ngắn">

    <input id="stg_enemy" class="gm-input" placeholder="Tên Boss">
    <input id="stg_img" class="gm-input" placeholder="Emoji/Icon" value="⚔️">

    <input id="stg_hp" type="number" class="gm-input" placeholder="HP Boss" value="1000">
    <input id="stg_atk" type="number" class="gm-input" placeholder="ATK Boss" value="100">

    <input id="stg_reward" type="number" class="gm-input" placeholder="Thưởng Gem" value="100">
  </div>

  <button class="gm-btn gm-btn-orange" style="width:100%; margin-top:10px"
    onclick="window.createStage()">➕ THÊM ẢI VÀO MAP</button>
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
</div>

    <button class="gm-btn gm-btn-gray" style="width:100%; margin-top:20px"
      onclick="document.getElementById('admin-modal').remove()">ĐÓNG BẢNG ADMIN</button>

  </div>
</div>
`;


    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
}

// --- CÁC HÀM XỬ LÝ (Global Window) ---

// 1. Xử lý tài nguyên
window.adminAction = (action, value) => {
    switch(action) {
        case 'add_gem':
            updateGems(value);
            alert("Đã thêm Gem thành công!");
            break;
        case 'clear_inv':
            if(confirm("Bạn chắc chắn muốn xóa sạch túi đồ?")) {
                clearInventory();
                renderInventory();
                alert("Đã xóa túi đồ.");
            }
            break;
        case 'reset_db':
            if(confirm("CẢNH BÁO: Bạn muốn xóa hết Tướng & Ải tự tạo để quay về mặc định?")) resetDB();
            break;
    }
    updateHeader();
};
// --- XỬ LÝ TƯỚNG ---
window.deleteHero = (id) => {
    if(confirm("Xóa vĩnh viễn tướng này khỏi Database?")) {
        deleteHeroFromDB(id);
        showAdminModal(); // Refresh
    }
};

// --- XỬ LÝ TƯỚNG ---
window.editHero = (id) => {
    const hero = getHeroDB().find(h => h.id === id);
    if (!hero) return;

    document.getElementById('new_name').value = hero.name;
    document.getElementById('new_rank').value = hero.rank;
    document.getElementById('new_hp').value = hero.hp;
    document.getElementById('new_atk').value = hero.atk;
    document.getElementById('new_rate').value = hero.rate;
    document.getElementById('new_img').value = hero.img;

    const btn = document.querySelector('button[onclick="window.createCustomHero()"]');
    btn.innerText = "💾 LƯU THAY ĐỔI TƯỚNG";
    btn.style.background = "green";
    
    // Ghi đè sự kiện click để lưu thay đổi thay vì tạo mới
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
        alert("Đã cập nhật tướng thành công!");
        document.getElementById('admin-modal').remove(); 
        showAdminModal(); // Refresh lại modal
    };
};
// --- XỬ LÝ ẢI ---
window.deleteStage = (id) => {
if(confirm("Xóa vĩnh viễn ải này?")) {
 deleteStageFromDB(id);
 showAdminModal();
}
};

// --- XỬ LÝ ẢI ---
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
    btn.innerText = "💾 LƯU THAY ĐỔI ẢI";
    btn.style.background = "green";
    
    btn.onclick = () => {
        const updated = {
            name: document.getElementById('stg_name').value,
            desc: document.getElementById('stg_desc').value,
            enemyName: document.getElementById('stg_enemy').value,
            hp: parseInt(document.getElementById('stg_hp').value),
            atk: parseInt(document.getElementById('stg_atk').value),
            reward: parseInt(document.getElementById('stg_reward').value),
            img: document.getElementById('stg_img').value // Nhớ lấy thêm icon
        };
        updateStageInDB(id, updated);
        alert("Đã cập nhật ải thành công!");
        document.getElementById('admin-modal').remove();
        showAdminModal();
    };
};
// 2. Logic tạo Tướng
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
    alert(`Đã thêm tướng "${name}" vào Database!`);
    document.getElementById('admin-modal').remove(); 
    showAdminModal(); // Refresh lại modal để hiện danh sách mới
};

// 3. Logic tạo Ải
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

    if(!newStage.name || !newStage.enemyName) return alert("Thiếu tên Ải hoặc tên Boss!");

    addStageToDB(newStage);
    alert(`Đã thêm Ải: ${newStage.name}`);
    document.getElementById('admin-modal').remove();
    showAdminModal(); // Refresh lại modal
};
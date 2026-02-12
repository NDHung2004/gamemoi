// js/ui.js
import { 
    getState, advanceStage, updateGems, toggleTeamMember, 
    removeHeroFromInventory, upgradeHeroLevel, upgradeHeroStarBulk, 
    addHeroToInventory, addSupportToInventory, equipSupportItem, unequipSupportItem 
} from './state.js';
import { getCampaignDB, getHeroDB, getSupportDB } from './database.js';
import { initAdminPanel } from './admin.js';

const appContent = document.getElementById('app-content');
const gemDisplay = document.getElementById('gem-count');
let isSellMode = false;
let selectedMaterials = []; 

// --- UTILS: BigInt Formatting ---
function formatNumber(num) {
    const n = BigInt(Math.floor(Number(num)));
    const units = [
        { val: 1000000000000000000n, sym: 'Q' },
        { val: 1000000000000000n, sym: 'q' },
        { val: 1000000000000n, sym: 't' },
        { val: 1000000000n, sym: 'b' },
        { val: 1000000n, sym: 'm' },
        { val: 1000n, sym: 'k' }
    ];
    for (const unit of units) {
        if (n >= unit.val) return (Number(n / (unit.val / 10n)) / 10).toFixed(1) + unit.sym;
    }
    return n.toString();
}

export function updateHeader() {
    const state = getState();
    if (gemDisplay) gemDisplay.innerText = formatNumber(state.gems);
}

// --- COMPONENTS: Tái sử dụng HTML ---

// 1. Component Thẻ Tướng
function createCardHTML(hero, isSelected, isGacha = false) {
    const state = getState();
    // Tính chỉ số thực (Gốc + Đồ)
    let hp = BigInt(Math.floor(hero.hp)), atk = BigInt(Math.floor(hero.atk));
    const equippedItem = hero.equippedItemUid ? state.supportInventory?.find(s => s.uid === hero.equippedItemUid) : null;
    
    if (equippedItem) {
        hp += BigInt(Math.floor(equippedItem.hp));
        atk += BigInt(Math.floor(equippedItem.atk));
    }

    return `
        <div class="card ${hero.rank} ${isSelected ? 'selected' : ''}" onclick="window.handleCardClick(${hero.uid})">
            <div class="card-header">
                <div class="rank-badge ${hero.rank}">${hero.rank}</div>
                <div class="level-badge">Lv.${hero.level}</div>
            </div>
            <div class="card-body">
                <div>⭐x${hero.star || 0}</div>
                <div class="hero-icon">${hero.img}</div>
                <h3 class="hero-name">${hero.name}</h3>
            </div>
            <div class="card-footer">
                ${!isGacha ? `
                <div class="equip-slot" onclick="event.stopPropagation(); window.openEquipModal(${hero.uid})" style="border:1px dashed #555; padding:2px; margin-bottom:5px; cursor:pointer;">
                    ${equippedItem ? `<span style="color:gold">${equippedItem.img} ${equippedItem.name}</span>` : `<span style="font-size:10px; color:#aaa">➕ Trang bị</span>`}
                </div>` : ''}
                <div class="stats-grid">
                    <div class="stat-item">❤️ ${formatNumber(hp)}</div>
                    <div class="stat-item">⚔️ ${formatNumber(atk)}</div>
                </div>
                ${!isGacha ? `<div class="card-actions"><button onclick="event.stopPropagation(); window.doUpgradeLevel(${hero.uid})">Up Lv</button><button onclick="event.stopPropagation(); window.doUpgradeStar(${hero.uid})">Up ⭐</button></div>` : ''}
            </div>
        </div>`;
}

// 2. Component Thẻ Trang Bị (Mới - Tối ưu hiển thị)
function createItemCardHTML(item) {
    return `
        <div class="card ${item.rank}" style="padding:10px; min-height:160px; position:relative;">
            <div class="rank-badge ${item.rank}">${item.rank}</div>
            <div style="font-size:35px; margin:10px 0;">${item.img}</div>
            <div style="font-weight:bold; font-size:13px; height:35px;">${item.name}</div>
            <div style="font-size:10px; color:#ccc; margin-top:5px;">
                <div>⚔️ +${formatNumber(item.atk)}</div>
                <div>❤️ +${formatNumber(item.hp)}</div>
            </div>
            ${item.hasOwnProperty('isEquipped') ? 
                `<div style="margin-top:8px; font-size:10px; color:${item.isEquipped ? 'lime' : '#666'}">
                    ${item.isEquipped ? '🛡️ Đang dùng' : '💤 Trong túi'}
                </div>` : ''}
        </div>`;
}

// --- MÀN HÌNH CHÍNH ---
export function renderInventory() {
    const state = getState();
    const sorted = [...state.inventory].sort((a, b) => b.level - a.level);
    appContent.innerHTML = `
        <div style="text-align:center; padding:10px; background:#222; position:sticky; top:0;">
            <h2>Kho Tướng (${state.inventory.length})</h2>
            <button onclick="window.toggleSellMode()" class="gm-btn ${isSellMode?'gm-btn-red':'gm-btn-blue'}">${isSellMode?"HỦY BÁN":"💰 BÁN TƯỚNG"}</button>
        </div>
        <div class="card-grid">${sorted.map(h => createCardHTML(h, state.team.includes(Number(h.uid)))).join('')}</div>`;
}

export function renderSupportInventory() {
    const state = getState();
    const sorted = [...(state.supportInventory || [])].sort((a, b) => (b.rank === 'GOD') - (a.rank === 'GOD'));
    appContent.innerHTML = `
        <div style="text-align:center; padding:10px; background:#222;"><h2>Kho Trang Bị (${sorted.length})</h2></div>
        <div class="card-grid">${sorted.map(i => createItemCardHTML(i)).join('')}</div>`;
}

// --- HỆ THỐNG GACHA (Tối ưu Generic) ---
export function renderGachaScreen(type) {
    const isHero = type === 'hero';
    appContent.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <h2 style="color:${isHero ? '#e74c3c' : '#f1c40f'}">Triệu Hồi ${isHero ? "Tướng" : "Trang Bị"}</h2>
            <div style="margin:20px 0;">
                <button class="action-btn" onclick="window.pull('${type}', 1)">x1 (${isHero?1000:100}💎)</button>
                <button class="action-btn" onclick="window.pull('${type}', 10)">x10 (${isHero?9000:900}💎)</button>
            </div>
            <div id="gacha-results" class="card-grid"></div>
        </div>`;
}

window.pull = (type, amount) => {
    const state = getState();
    const cost = (type === 'hero' ? 1000 : 100) * (amount === 10 ? 0.9 : 1);
    if (state.gems < cost) return alert("Không đủ Kim Cương!");
    
    updateGems(-cost);
    updateHeader();
    
    const db = type === 'hero' ? getHeroDB() : getSupportDB();
    const results = [];
    
    for(let i=0; i<amount; i++) {
        // Random đơn giản (Có thể thêm tỷ lệ SSR/GOD ở đây)
        const item = db[Math.floor(Math.random() * db.length)];
        if (type === 'hero') addHeroToInventory(item);
        else addSupportToInventory(item);
        results.push(item);
    }
    
    const container = document.getElementById('gacha-results');
    // Tái sử dụng component hiển thị
    if (type === 'hero') container.innerHTML = results.map(h => createCardHTML(h, false, true)).join('');
    else container.innerHTML = results.map(i => createItemCardHTML(i)).join('');
};

// --- LOGIC CHIẾN ĐẤU (Hợp nhất Campaign & Tower) ---
export async function startBattle(mode, stageId = null) {
    const state = getState();
    const teamHeroes = state.team.map(uid => state.inventory.find(h => Number(h.uid) === uid)).filter(h => h);
    if (teamHeroes.length === 0) return alert("Chưa chọn đội hình!");

    // Tính tổng lực chiến một cách an toàn
    let playerATK = 0n, playerHP = 0n;
    teamHeroes.forEach(h => {
        let stats = { hp: BigInt(Math.floor(h.hp)), atk: BigInt(Math.floor(h.atk)) };
        if (h.equippedItemUid) {
            const item = state.supportInventory?.find(s => s.uid === h.equippedItemUid);
            if (item) { stats.hp += BigInt(Math.floor(item.hp)); stats.atk += BigInt(Math.floor(item.atk)); }
        }
        playerATK += stats.atk; playerHP += stats.hp;
    });

    let isAuto = mode === 'tower';
    let logs = [isAuto ? "🚀 LEO THÁP TỰ ĐỘNG..." : "⚔️ BẮT ĐẦU CHIẾN DỊCH..."];
    let winCount = 0;

    do {
        let enemyHP, enemyATK, enemyName, reward;
        if (mode === 'tower') {
            const floor = state.progress.towerFloor;
            enemyName = `Boss Tầng ${floor}`;
            enemyHP = BigInt(floor) * 2000000000000000000n; 
            enemyATK = BigInt(floor) * 500000000000000000n;
            reward = 50 + Math.floor(floor/5);
        } else {
            const stage = getCampaignDB().find(s => s.id === parseInt(stageId));
            enemyName = stage.enemyName;
            enemyHP = BigInt(Math.floor(stage.hp)); enemyATK = BigInt(Math.floor(stage.atk));
            reward = stage.reward;
        }

        logs.push(`------------------`);
        logs.push(`👹 ${enemyName} (HP: ${formatNumber(enemyHP)})`);

        enemyHP -= playerATK; // Đánh trước
        if (enemyHP <= 0n) {
            logs.push(`✅ THẮNG! +${reward}💎`);
            updateGems(reward);
            if (mode === 'tower') { state.progress.towerFloor++; winCount++; }
            else { if (parseInt(stageId) === state.progress.campaignStage) advanceStage('campaign'); break; }
        } else {
            playerHP -= enemyATK; // Boss phản đòn
            if (playerHP <= 0n) {
                logs.push(`💀 THUA CUỘC!`);
                isAuto = false;
            } else {
                logs.push(`🛡️ Chịu đòn & Thắng!`);
                updateGems(reward);
                if (mode === 'tower') { state.progress.towerFloor++; winCount++; }
                else { if (parseInt(stageId) === state.progress.campaignStage) advanceStage('campaign'); break; }
            }
        }
        if (winCount >= 100) { logs.push("⚠️ Tạm dừng (Max 100 tầng)"); break; }
    } while (isAuto);

    appContent.innerHTML = `<div style="padding:20px;"><div style="background:#000; color:#0f0; height:400px; overflow-y:auto; font-family:monospace; border:1px solid #333;">${logs.map(l=>`<div>${l}</div>`).join('')}</div><button class="action-btn" onclick="window.renderBattleMap()">Quay về Map</button></div>`;
    updateHeader();
}

export function renderBattleMap() {
    const state = getState();
    const towerHP = BigInt(state.progress.towerFloor) * 2000000000000000000n;
    const towerATK = BigInt(state.progress.towerFloor) * 500000000000000000n;
    
    appContent.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <h2>BẢN ĐỒ CHIẾN ĐẤU</h2>
            <div class="card-grid" style="justify-content:center;">
                ${getCampaignDB().map(s => `<div class="card" onclick="window.selectStage(${s.id})"><h3>Ải ${s.id}</h3>${s.name}</div>`).join('')}
            </div>
            <div class="mode-card" style="margin-top:20px; border:2px solid #9b59b6; padding:15px; background:#222;">
                <h3 style="color:#9b59b6">🗼 Tháp Tầng ${state.progress.towerFloor}</h3>
                <div style="margin:10px 0; font-size:12px;">Boss HP: <b style="color:red">${formatNumber(towerHP)}</b> | ATK: <b style="color:orange">${formatNumber(towerATK)}</b></div>
                <button class="action-btn" onclick="window.startTower()" style="width:100%; background:#8e44ad">LEO THÁP NGAY</button>
            </div>
        </div>`;
}

export function renderHome() { 
    appContent.innerHTML = `<div style="text-align:center; padding:50px;"><h1>Cửu Giới Hỗn Mang</h1><p>Chào mừng trở lại!</p></div>`; 
}

// --- INIT GLOBAL ---
window.renderHome = renderHome;
window.renderBattleMap = renderBattleMap;
window.selectStage = (id) => startBattle('campaign', id);
window.startTower = () => startBattle('tower');
window.renderInventory = renderInventory;
window.renderSupportInventory = renderSupportInventory;
window.toggleSellMode = () => { isSellMode = !isSellMode; renderInventory(); };
window.handleCardClick = (uid) => {
    if (isSellMode) { if(confirm("Bán?")) removeHeroFromInventory(uid); renderInventory(); updateHeader(); }
    else { toggleTeamMember(uid); renderInventory(); }
};
window.doUpgradeLevel = (uid) => { if(upgradeHeroLevel(uid)) { updateHeader(); renderInventory(); }};
window.openEquipModal = (uid) => {
    const state = getState();
    const hero = state.inventory.find(h => Number(h.uid) === Number(uid));
    const inv = state.supportInventory || [];
    const available = inv.filter(s => !s.isEquipped || s.equippedTo === uid);

    const overlay = document.createElement('div');
    overlay.className = 'rare-appearance-overlay';
    overlay.innerHTML = `
        <div style="background:#222; padding:20px; border:2px solid gold; width:90%; max-width:400px; color:white;">
            <h3 style="text-align:center; color:gold;">TRANG BỊ CHO ${hero.name}</h3>
            <div style="text-align:center; margin-bottom:10px;"><button onclick="if(window.unequipItem(${uid})) this.closest('.rare-appearance-overlay').remove(); window.renderInventory();" style="background:red; color:white;">GỠ ĐỒ</button></div>
            <div style="max-height:300px; overflow-y:auto; display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                ${available.map(i => `<div onclick="if(window.equipItem(${uid}, ${i.uid})) this.closest('.rare-appearance-overlay').remove(); window.renderInventory();" style="background:#333; padding:5px; cursor:pointer; border:1px solid #555;">${i.img} <br> ${i.name}</div>`).join('')}
            </div>
            <button onclick="this.closest('.rare-appearance-overlay').remove()" style="width:100%; margin-top:10px;">ĐÓNG</button>
        </div>`;
    document.body.appendChild(overlay);
};
window.equipItem = equipSupportItem;
window.unequipItem = unequipSupportItem;

initAdminPanel();
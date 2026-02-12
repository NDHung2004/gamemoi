// js/ui.js
import { 
    getState, advanceStage, updateGems, toggleTeamMember, 
    removeHeroFromInventory, MAX_INVENTORY, upgradeHeroLevel, 
    evolveHero, upgradeHeroStarBulk, setGemsDirectly, addHeroToInventory, clearInventory,
    removeEquipmentFromBag, 
    upgradeEquipmentLevel, 
    upgradeEquipmentStar,
    MAX_EQUIPMENT_BAG,
    upgradeEquipmentStarBulk
} from './state.js';
import { getCampaignDB, getHeroDB } from './database.js';
import { simulateBattle, autoClimbTower } from './battle.js';
import { initAdminPanel } from './admin.js';
import { openEquipmentModal } from './ui-equipment.js'; // MỚI: Import UI Trang bị
import { calculateHeroStats } from './equipment.js';    // MỚI: Import tính chỉ số

const appContent = document.getElementById('app-content');
const gemDisplay = document.getElementById('gem-count');
let isSellMode = false;
let selectedMaterials = []; 
let currentGachaTab = 'hero'
// --- 1. HÀM HỖ TRỢ (UTILS) ---

function formatNumber(num) {
    // Chuyển đổi sang BigInt để tính toán chính xác tuyệt đối
    const n = BigInt(Math.floor(Number(num)));
    if (n >= 1000000000000000000n) return (Number(n / 100000000000000000n) / 10).toFixed(1) + 'Q'; 
    if (n >= 1000000000000000n) return (Number(n / 100000000000000n) / 10).toFixed(1) + 'q'; 
    if (n >= 1000000000000n) return (Number(n / 100000000000n) / 10).toFixed(1) + 't'; 
    if (n >= 1000000000n) return (Number(n / 100000000n) / 10).toFixed(1) + 'b'; 
    if (n >= 1000000n) return (Number(n / 100000n) / 10).toFixed(1) + 'm'; 
    if (n >= 1000n) return (Number(n / 100n) / 10).toFixed(1) + 'k'; 
    return n.toString();
}

export function updateHeader() {
    const state = getState();
    if (gemDisplay) gemDisplay.innerText = formatNumber(state.gems);
}

// Hàm tạo HTML thẻ bài dùng chung cho toàn game
function createCardHTML(hero, isSelected, isGacha = false) {
    // MỚI: Tính chỉ số thực tế (bao gồm trang bị) để hiển thị
    const stats = calculateHeroStats(hero);
    const formattedHP = formatNumber(stats.hp);
    const formattedATK = formatNumber(stats.atk);
    
    const starDisplay = (hero.star || 0) > 0 ? `⭐x${hero.star}` : "⭐x0";

    // MỚI: Hiển thị icon trang bị nhỏ trên thẻ
    const eq = hero.equipped || {};
    const eqStatus = `
        <div style="font-size:10px; margin-top:2px; opacity:0.8;">
            ${eq.weapon ? '⚔️' : '⚪'} ${eq.armor ? '🛡️' : '⚪'} ${eq.boots ? '👞' : '⚪'}
        </div>
    `;

    return `
        <div class="card ${hero.rank} ${isSelected ? 'selected' : ''}" onclick="window.handleCardClick('${hero.uid}')">
            <div class="card-header">
                <div class="rank-badge ${hero.rank}">${hero.rank}</div>
                <div class="level-badge">Lv.${hero.level || 1}</div>
            </div>
            <div class="card-body">
                <div class="star-container">${starDisplay}</div>
                <div class="hero-icon">${hero.img || '🃏'}</div>
                <h3 class="hero-name">${hero.name}</h3>
                ${!isGacha ? eqStatus : ''} 
            </div>
            <div class="card-footer">
                <div class="stats-grid">
                    <div class="stat-item">❤️<span>${formattedHP}</span></div>
                    <div class="stat-item">⚔️<span>${formattedATK}</span></div>
                </div>
            </div>
        </div>`;
}

// --- 2. CÁC MÀN HÌNH CHÍNH ---

export function renderHome() {
    appContent.innerHTML = `
        <div style="text-align:center; padding: 50px;">
            <h1>Cửu Giới Hỗn Mang</h1>
            <p>Chào mừng trở lại!</p>
            <p style="color:#aaa; font-size:12px;">Phiên bản: Equipment Update</p>
        </div>`;
}


export function renderBattleMap() {
    const state = getState();
    const curStage = state.progress.campaignStage;
    const campaignDB = getCampaignDB();

    // 1. Render danh sách các Ải Chiến Dịch
    let stagesHTML = campaignDB.map(stage => {
        const isPassed = stage.id < curStage;
        const isLocked = stage.id > curStage;
        const statusColor = (isPassed || stage.id === curStage) ? (isPassed ? "#27ae60" : "#e67e22") : "#555";
        
        return `
            <div style="background:#333; border: 2px solid ${statusColor}; border-radius:8px; padding:10px; width:140px; text-align:center; cursor:pointer; position:relative;" 
                 onclick="window.selectStage(${stage.id})">
                <div style="font-size:24px;">${stage.img}</div>
                <h4 style="margin:5px 0; font-size:14px;">Ải ${stage.id}: ${stage.name}</h4>
                
                <div style="font-size:10px; color:#aaa; background:rgba(0,0,0,0.3); padding:4px; border-radius:4px; margin:5px 0;">
                    <div style="color:#ff4757;">❤️ HP: ${formatNumber(stage.hp)}</div>
                    <div style="color:#ffa502;">⚔️ ATK: ${formatNumber(stage.atk)}</div>
                </div>

                <div style="background:${statusColor}; color:white; font-size:10px; padding:2px 4px; border-radius:4px;">
                    ${isPassed ? "✅ ĐÃ QUA" : (isLocked ? "🔒 KHÓA" : "⚔️ CHIẾN")}
                </div>
            </div>`;
    }).join('');

    // 2. Render Tháp Vô Tận
    const floor = BigInt(state.progress.towerFloor);
    const towerHP = floor * 2000000000000000000n; 
    const towerATK = floor * 500000000000000000n;

    appContent.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <h2 style="margin-bottom:20px;">🗺️ BẢN ĐỒ CHIẾN ĐẤU</h2>
            
            <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:30px;">
                ${stagesHTML}
            </div>

            <div class="mode-card" style="border: 2px solid #9b59b6; padding: 20px; background: #222; border-radius:15px; max-width:500px; margin: 0 auto; box-shadow: 0 0 15px rgba(155, 89, 182, 0.3);">
                <h3 style="color:#9b59b6; margin-top:0;">🗼 Tháp Vô Tận</h3>
                <div style="font-size:18px; margin:10px 0;">Tầng hiện tại: <strong style="color:cyan;">${state.progress.towerFloor}</strong></div>
                
                <div style="display:flex; justify-content:center; gap:20px; margin-bottom:15px; font-size:13px; color:#ccc;">
                    <span>💀 Boss HP: <b style="color:#ff4757;">${formatNumber(towerHP)}</b></span>
                    <span>⚔️ Boss ATK: <b style="color:#ffa502;">${formatNumber(towerATK)}</b></span>
                </div>

                <button class="action-btn" onclick="window.startTower()" style="background: #8e44ad; width: 100%; font-size:16px;">
                    LEO THÁP NGAY
                </button>
            </div>
        </div>
    `;
}

function calculateTeamPower() {
    const state = getState();
    // Lấy danh sách tướng trong team
    const teamHeroes = state.team.map(uid => state.inventory.find(h => Number(h.uid) === uid)).filter(h => h);
    
    // MỚI: Dùng calculateHeroStats để tính cả đồ
    let totalPower = 0n;
    
    teamHeroes.forEach(hero => {
        const stats = calculateHeroStats(hero);
        // Chuyển về BigInt để cộng tổng an toàn
        totalPower += BigInt(Math.floor(stats.hp)) + BigInt(Math.floor(stats.atk));
    });

    return totalPower; 
}

const RANK_ORDER = { "GOD": 5, "UR": 4, "SSR": 3, "SR": 2, "R": 1 };

export function renderInventory() {
    const state = getState();
    const currentCount = state.inventory.length;
    const currentPower = calculateTeamPower();
    
    const sortedInventory = [...state.inventory].sort((a, b) => {
        const rankDiff = (RANK_ORDER[b.rank] || 0) - (RANK_ORDER[a.rank] || 0);
        if (rankDiff !== 0) return rankDiff; 
        return b.level - a.level; 
    });

    appContent.innerHTML = `
        <div style="text-align:center; padding:10px; background:#222; border-bottom:1px solid #444; position:sticky; top:0; z-index:10;">
            <h2>Kho Tàng (<span style="${currentCount >= 500 ? 'color:red' : ''}">${currentCount}/500</span>)</h2>
            
            <div style="background: linear-gradient(90deg, #222, #444, #222); padding: 8px; margin: 5px 0; border: 1px solid #ffcc00; border-radius: 5px;">
                <span style="color: #ffcc00; font-weight: bold; font-size: 16px;">⚔️ Lực Chiến Đội Hình: ${formatNumber(currentPower)}</span>
            </div>

            <div style="display:flex; justify-content:center; gap:10px; margin-top: 10px;">
                <button onclick="window.toggleSellMode()" class="gm-btn ${isSellMode ? 'gm-btn-red' : 'gm-btn-blue'}">
                    ${isSellMode ? "HỦY BÁN" : "💰 BÁN TƯỚNG"}
                </button>
            </div>
            <p style="font-size:11px; color:#aaa; margin-top:5px;">Bấm vào thẻ để xem chi tiết và mặc trang bị</p>
        </div>
        <div class="card-grid">
            ${sortedInventory.map(hero => {
                const isSelected = state.team.includes(Number(hero.uid));
                return createCardHTML(hero, isSelected);
            }).join('')}
        </div>
    `;
}

// --- 4. MODAL CHI TIẾT TƯỚNG (MỚI) ---

window.handleCardClick = (uidStr) => {
    const uid = Number(uidStr);

    // 1. NẾU ĐANG Ở CHẾ ĐỘ BÁN (Giữ nguyên logic cũ)
    if (isSellMode) {
        if (confirm("Bạn có chắc muốn bán tướng này lấy 10 Kim Cương?")) {
            const result = removeHeroFromInventory(uid);
            if (result.success) {
                updateHeader();
                renderInventory();
            } else {
                alert("⛔ KHÔNG THỂ BÁN!\nTướng này đang nằm trong Đội Hình Chiến Đấu.");
            }
        }
        return;
    }

    // 2. NẾU BÌNH THƯỜNG -> MỞ MODAL CHI TIẾT
    showHeroDetailModal(uid);
};

function showHeroDetailModal(uid) {
    const state = getState();
    const hero = state.inventory.find(h => Number(h.uid) === uid);
    if (!hero) return;

    const isInTeam = state.team.includes(uid);
    const btnTeamText = isInTeam ? "❌ Bỏ khỏi đội" : "✅ Chọn vào đội";
    const btnTeamColor = isInTeam ? "gm-btn-red" : "gm-btn-blue";
    
    // Tính toán tài nguyên nâng cấp
    const upgradeCost = (hero.level || 1) * 100;

    const modalHtml = `
        <div id="detail-modal" class="gm-modal">
            <div class="gm-box" style="max-width:400px;">
                <h2 style="text-align:center; color:${getRankColor(hero.rank)}">[${hero.rank}] ${hero.name}</h2>
                <div style="text-align:center; font-size:60px; margin:10px 0; animation: bounce 2s infinite;">${hero.img}</div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:20px; text-align:center;">
                    <div style="background:#333; padding:5px; border-radius:5px;">Cấp: <b>${hero.level}</b></div>
                    <div style="background:#333; padding:5px; border-radius:5px;">Sao: <b>${hero.star}</b></div>
                </div>

                <div class="gm-grid" style="gap:10px;">
                    <button class="gm-btn ${btnTeamColor}" onclick="window.doToggleTeam('${uid}')">${btnTeamText}</button>
                    <button class="gm-btn gm-btn-orange" onclick="window.doOpenEquip('${uid}')">🛡️ TRANG BỊ</button>
                    
                    <button class="gm-btn gm-btn-green" onclick="window.doUpgradeLevel('${uid}')">
                        ⬆️ Cấp (${upgradeCost}💎)
                    </button>
                    <button class="gm-btn gm-btn-purple" onclick="window.doUpgradeStar('${uid}')">
                        ✨ Nâng Sao
                    </button>
                </div>

                 <button class="gm-btn gm-btn-gray" style="width:100%; margin-top:20px" onclick="document.getElementById('detail-modal').remove()">Đóng</button>
            </div>
        </div>
    `;

    // Remove modal cũ nếu có
    const old = document.getElementById('detail-modal');
    if (old) old.remove();

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
}

function getRankColor(rank) {
    if (rank === 'GOD') return '#ff00ff';
    if (rank === 'UR') return '#e74c3c';
    if (rank === 'SSR') return '#f1c40f';
    if (rank === 'SR') return '#3498db';
    return '#fff';
}

// --- 5. LOGIC NÂNG SAO GỘP (GIỮ NGUYÊN) ---

window.doUpgradeStar = (heroUid) => {
    // Đóng modal chi tiết trước khi mở modal nâng sao
    const detailModal = document.getElementById('detail-modal');
    if(detailModal) detailModal.remove();

    const state = getState();
    const targetHero = state.inventory.find(h => Number(h.uid) === Number(heroUid));
    const materials = state.inventory.filter(h => h.id === targetHero.id && Number(h.uid) !== Number(heroUid));

    if (materials.length === 0) return alert("Không có thẻ cùng loại để nâng cấp!");
    
    selectedMaterials = [];
    const overlay = document.createElement('div');
    overlay.className = 'rare-appearance-overlay';
    overlay.id = 'bulk-picker-modal';
    overlay.innerHTML = `
        <div style="background:#222; padding:20px; border-radius:10px; border:2px solid #00ff00; width:90%; max-width:400px; color:white;">
            <h3 style="text-align:center; color:#00ff00;">NÂNG SAO TƯỚNG</h3>
            <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; max-height:250px; overflow-y:auto; margin:15px 0;">
                ${materials.map(m => `
                    <div class="material-item" id="m-${m.uid}" onclick="window.toggleMaterialSelection('${m.uid}')" style="border:1px solid #444; padding:5px; cursor:pointer; width:70px; position:relative;">
                        <div style="font-size:20px;">${m.img}</div>
                        <div style="font-size:9px;">Lv.${m.level}</div>
                        <div class="check-mark" style="display:none; position:absolute; top:2px; right:4px; color:#00ff00;">✔</div>
                    </div>`).join('')}
            </div>
            <button id="btn-confirm-bulk" onclick="window.confirmUnifiedUpgrade('${targetHero.uid}')" style="width:100%; background:#00ff00; color:black; font-weight:bold; padding:10px;">XÁC NHẬN (0)</button>
            <button onclick="document.getElementById('bulk-picker-modal').remove()" style="width:100%; margin-top:5px; background:#444;">HỦY</button>
        </div>`;
    document.body.appendChild(overlay);
};

window.toggleMaterialSelection = (uid) => {
    const nUid = Number(uid);
    const idx = selectedMaterials.indexOf(nUid);
    const el = document.getElementById(`m-${uid}`);
    if (idx > -1) {
        selectedMaterials.splice(idx, 1); el.style.borderColor = "#444"; el.querySelector('.check-mark').style.display = "none";
    } else {
        selectedMaterials.push(nUid); el.style.borderColor = "#00ff00"; el.querySelector('.check-mark').style.display = "block";
    }
    document.getElementById('btn-confirm-bulk').innerText = `XÁC NHẬN (${selectedMaterials.length} thẻ)`;
};

window.confirmUnifiedUpgrade = (targetUid) => {
    if (selectedMaterials.length === 0) return alert("⚠️ Vui lòng chọn ít nhất 1 nguyên liệu!");
    
    const result = upgradeHeroStarBulk(targetUid, selectedMaterials);
    
    if (result.success) {
        document.getElementById('bulk-picker-modal').remove();
        selectedMaterials = []; 
        renderInventory(); 
        alert(`🎉 NÂNG CẤP THÀNH CÔNG!\n⭐ ${result.newStar} Sao\nSức mạnh tăng vượt trội!`);
    } else {
        alert("❌ Lỗi: " + result.message);
    }
};

// --- 6. GÁN CÁC HÀM CÒN LẠI RA WINDOW ---

// Bridge Function: Gọi từ Modal Chi tiết
window.doToggleTeam = (uid) => {
    toggleTeamMember(uid);
    document.getElementById('detail-modal').remove(); // Đóng modal
    renderInventory(); // Refresh UI
};

window.doUpgradeLevel = (uid) => { 
    if (upgradeHeroLevel(uid)) { 
        // 1. Cập nhật số Gem trên header
        updateHeader(); 
        
        // 2. Kiểm tra nếu đang mở Modal chi tiết thì vẽ lại Modal, 
        // nếu không thì vẽ lại Inventory
        const detailModal = document.getElementById('detail-modal');
        if(detailModal) {
            detailModal.remove();
            showHeroDetailModal(Number(uid));
        }
        
        // Luôn gọi renderInventory để các thẻ bài bên dưới cập nhật chỉ số mới
        renderInventory(); 
    } 
};

// Bridge Function: Mở Modal Trang Bị
window.doOpenEquip = (uid) => {
    const detailModal = document.getElementById('detail-modal');
    if(detailModal) detailModal.remove();
    openEquipmentModal(uid);
};

window.toggleSellMode = () => { isSellMode = !isSellMode; renderInventory(); };
window.selectStage = (id) => startBattle('campaign', id);

export function renderGachaScreen(heroPullCb, equipPullCb) {
    // Lưu callback vào window để gọi lại khi đổi tab
    window._heroPullCb = heroPullCb;
    window._equipPullCb = equipPullCb;

    const isHero = currentGachaTab === 'hero';

    appContent.innerHTML = `
        <div style="text-align:center;">
            <h2>Triệu Hồi Thánh Điện</h2>
            
            <div class="gacha-tabs">
                <button class="gacha-tab-btn ${isHero ? 'active' : ''}" onclick="window.switchGachaTab('hero')">🦸 Tướng</button>
                <button class="gacha-tab-btn ${!isHero ? 'active' : ''}" onclick="window.switchGachaTab('equip')">🛡️ Trang Bị</button>
            </div>

            <div class="gacha-banner" style="margin: 20px auto; padding: 30px; background: ${isHero ? '#2c3e50' : '#342224'}; border-radius: 10px; max-width: 500px; border: 2px solid ${isHero ? '#3498db' : '#e74c3c'};">
                <h3 style="color: ${isHero ? '#3498db' : '#e74c3c'};">${isHero ? 'Triệu Hồi Anh Hùng' : 'Kho Tàng Thần Binh'}</h3>
                <p style="font-size:12px; color:#aaa;">Tiêu hao: 160💎 / lần</p>
                <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
                    <button class="action-btn" style="background:${isHero?'#2980b9':'#c0392b'}" onclick="window.doPull(1)">Quay x1</button>
                    <button class="action-btn" style="background:${isHero?'#2980b9':'#c0392b'}" onclick="window.doPull(10)">Quay x10 (VIP)</button>
                </div>
            </div>

            <div id="gacha-results" class="card-grid"></div>
        </div>
    `;
}

// Các hàm bridge cho Gacha UI
window.switchGachaTab = (tab) => {
    currentGachaTab = tab;
    // Render lại màn hình với tab mới
    renderGachaScreen(window._heroPullCb, window._equipPullCb);
};

window.doPull = (times) => {
    if (currentGachaTab === 'hero') window._heroPullCb(times);
    else window._equipPullCb(times);
};

// --- SỬA HÀM NÀY TRONG js/ui.js ---

// --- THAY THẾ HÀM showGachaResults CŨ ---
export function showGachaResults(results) {
    const container = document.getElementById('gacha-results');
    container.innerHTML = ''; // Clear cũ

    // Lọc đồ/tướng hiếm để chạy hiệu ứng
    const rareDrops = results.filter(r => {
        if (r.isItem) return r.rarity === 'SSR';
        return ['SSR', 'UR', 'GOD'].includes(r.rank);
    });
    
    if (rareDrops.length > 0) {
        showRareQueue(rareDrops);
    }

    // Render kết quả
    container.innerHTML = results.map(obj => {
        if (obj.isItem) {
            // --- RENDER THẺ TRANG BỊ VỚI HIỆU ỨNG MỚI ---
            const isSSR = obj.rarity === 'SSR';
            const vipClass = isSSR ? 'equip-card-ssr summon-glow' : '';
            
            return `
                <div class="card ${obj.rarity} ${vipClass}" style="border-style:dashed;">
                    <div class="card-header">
                        <div class="rank-badge ${obj.rarity}">${obj.rarity}</div>
                        <div class="level-badge">Trang bị</div>
                    </div>
                    <div class="card-body">
                        <div style="font-size:50px; margin:10px 0;">${obj.img}</div>
                        <h3 class="hero-name" style="${isSSR ? 'color:gold; text-shadow:0 0 5px orange;' : ''}">${obj.name}</h3>
                    </div>
                    <div class="card-footer" style="text-align:center;">
                         <span style="color:${isSSR?'gold':'#00ff00'}; font-weight:bold;">
                            +${obj.stat} ${obj.type === 'weapon' ? 'Công' : (obj.type === 'armor' ? 'Máu' : 'Tốc')}
                        </span>
                    </div>
                </div>
            `;
        } else {
            // RENDER THẺ TƯỚNG (Giữ nguyên)
            const cardHTML = createCardHTML(obj, false, true); 
            return ['SSR', 'UR', 'GOD'].includes(obj.rank) ? `<div class="summon-glow">${cardHTML}</div>` : cardHTML;
        }
    }).join('');
}

function showRareQueue(queue) {
    if (queue.length === 0) return;
    const currentHero = queue[0];
    const remainingQueue = queue.slice(1);
    createRareAppearance(currentHero, () => showRareQueue(remainingQueue));
}

function createRareAppearance(obj, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'rare-appearance-overlay';
    overlay.style.zIndex = "5000";
    
    let cardDisplayHTML = '';
    let titleText = '';
    let extraEffect = '';

    if (obj.isItem) {
        // --- HIỂN THỊ TRANG BỊ VIP ---
        extraEffect = `<div class="vip-equip-ray"></div>`; // Thêm luồng sáng xoay
        cardDisplayHTML = `
            <div class="card SSR equip-card-ssr" style="transform: scale(1.8);margin-top:100px;margin-bottom:20px">
                <div class="card-header"><div class="rank-badge SSR">SSR</div></div>
                <div class="card-body">
                    <div style="font-size:70px; margin:0px 0;">${obj.img}</div>
                    <h2 style="color:gold; text-shadow:0 0 10px orange;margin:0px ;text-size:30px">${obj.name}</h2>
                    <p style="color:#ccc;">${obj.desc}</p>
                </div>
                 <div class="card-footer" style="text-align:center; font-size:10px; color:gold;">
                    +${obj.stat} chỉ số 
                </div>
            </div>
        `;
    } else {
        // --- HIỂN THỊ TƯỚNG VIP (Cũ) ---
        cardDisplayHTML = `<div class="rare-card-animate" style="transform: scale(1.5);">${createCardHTML(obj, false, true)}</div>`;
    }
    
    overlay.innerHTML = `
        <div class="light-burst"></div>
        ${extraEffect}
        <h1 style="color:gold; position:absolute; top:15%; text-shadow:0 0 10px black; z-index:2;">${titleText}</h1>
        ${cardDisplayHTML}
        <button id="confirm-rare-btn" class="action-btn" style="margin-top: 200px; width: 250px; background: linear-gradient(90deg, #f1c40f, #e67e22); z-index:2;">
            NHẬN NGAY
        </button>
    `;
    
    document.body.appendChild(overlay);
    document.getElementById('confirm-rare-btn').onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };
}

// Battle & Tower Logic giữ nguyên nhưng dùng BigInt
export function startBattle(mode, stageId = null) {
    const state = getState();
    const teamHeroes = state.team.map(uid => state.inventory.find(h => Number(h.uid) === uid)).filter(h => h);
    
    if (teamHeroes.length === 0) return alert("Vui lòng chọn đội hình trước khi chiến đấu!");

    // Tính chỉ số bao gồm trang bị
    let playerATK = 0n;
    let playerHP = 0n;
    teamHeroes.forEach(h => {
        const stats = calculateHeroStats(h);
        playerATK += BigInt(Math.floor(stats.atk));
        playerHP += BigInt(Math.floor(stats.hp));
    });

    let enemyHP, enemyATK, enemyName, reward = 0;

    if (mode === 'tower') {
        const floor = state.progress.towerFloor;
        enemyName = `Boss Tầng ${floor}`;
        enemyHP = BigInt(floor) * 5000000n; 
        enemyATK = BigInt(floor) * 500000n;
        reward = 50 + Math.floor(floor / 10);
    } else {
        const stage = getCampaignDB().find(s => s.id === parseInt(stageId));
        if (!stage) return;
        enemyName = stage.enemyName;
        enemyHP = BigInt(Math.floor(stage.hp));
        enemyATK = BigInt(Math.floor(stage.atk));
        reward = stage.reward;
    }

    let logs = [`🚀 TRẬN ĐẤU BẮT ĐẦU!`];
    logs.push(`⚔️ Đội hình: ${formatNumber(playerATK)} Công / ${formatNumber(playerHP)} Máu`);
    logs.push(`👹 Đối thủ: ${enemyName} (${formatNumber(enemyHP)} Máu)`);
    logs.push(`-----------------------------`);

    enemyHP -= playerATK;
    logs.push(`💥 Bạn tấn công cực mạnh!`);

    if (enemyHP <= 0n) {
        logs.push(`💀 ${enemyName} đã bị tiêu diệt hoàn toàn!`);
        logs.push(`🏆 CHIẾN THẮNG RỰC RỠ!`);
        updateGems(reward);
        if (mode === 'tower') state.progress.towerFloor++;
        else if (parseInt(stageId) === state.progress.campaignStage) advanceStage('campaign');
    } else {
        logs.push(`⚠️ ${enemyName} còn ${formatNumber(enemyHP)} máu và phản công!`);
        playerHP -= enemyATK;
        
        if (playerHP <= 0n) {
            logs.push(`❌ Đội hình của bạn đã gục ngã...`);
            logs.push(`🏆 KẾT QUẢ: THẤT BẠI`);
        } else {
            logs.push(`🛡️ Bạn chịu đòn, đội hình còn ${formatNumber(playerHP)} máu.`);
            logs.push(`🏆 CHIẾN THẮNG!`);
            updateGems(reward);
            if (mode === 'tower') state.progress.towerFloor++;
            else if (parseInt(stageId) === state.progress.campaignStage) advanceStage('campaign');
        }
    }

    appContent.innerHTML = `
        <div style="padding:20px; max-width:600px; margin: 0 auto;">
            <h2 style="color: gold; text-align:center">KẾT QUẢ CHIẾN ĐẤU</h2>
            <div style="background:#111; color:#0f0; padding:15px; height:400px; overflow-y:auto; font-family:monospace; border: 2px solid #444; border-radius:8px; line-height:1.6;">
                ${logs.map(l => `<div>${l}</div>`).join('')}
            </div>
            <button class="action-btn" onclick="window.renderBattleMap()" style="margin-top:20px; background:#e67e22; width:100%;">Quay về Map</button>
        </div>
    `;
    updateHeader();
}

async function autoClimbTowerContinuous() {
    const state = getState();
    const teamHeroes = state.team.map(uid => state.inventory.find(h => Number(h.uid) === uid)).filter(h => h);
    
    if (teamHeroes.length === 0) return alert("Vui lòng chọn đội hình trước khi leo tháp!");

    let isStillWinning = true;
    let floorsClimbed = 0;
    let totalGemsGained = 0;
    let allLogs = [`🚀 BẮT ĐẦU CHẾ ĐỘ LEO THÁP TỰ ĐỘNG...`];

    // Tính stats 1 lần
    let playerATK = 0n;
    let playerHP = 0n;
    teamHeroes.forEach(h => {
        const stats = calculateHeroStats(h);
        playerATK += BigInt(Math.floor(stats.atk));
        playerHP += BigInt(Math.floor(stats.hp));
    });

    while (isStillWinning) {
        const floor = state.progress.towerFloor;
        let enemyHP = BigInt(floor) * 2000000000000000000n; 
        let enemyATK = BigInt(floor) * 500000000000000000n;
        let reward = 50 + Math.floor(floor / 5);

        allLogs.push(`-----------------------------`);
        allLogs.push(`🗼 TẦNG ${floor}: Boss ${formatNumber(enemyHP)} HP`);

        // Đánh nhau (BigInt safe)
        enemyHP -= playerATK;
        
        if (enemyHP <= 0n) {
            allLogs.push(`✅ CHIẾN THẮNG!`);
            updateGems(reward);
            state.progress.towerFloor++;
            floorsClimbed++;
            totalGemsGained += reward;
        } else {
            // Boss đánh trả
            const tempHP = playerHP - enemyATK; // Tính tạm
            if (tempHP <= 0n) {
                allLogs.push(`💀 THẤT BẠI... Boss còn ${formatNumber(enemyHP)} HP.`);
                isStillWinning = false;
            } else {
                allLogs.push(`🛡️ Thắng sau khi chịu đòn!`);
                updateGems(reward);
                state.progress.towerFloor++;
                floorsClimbed++;
                totalGemsGained += reward;
            }
        }
        
        if (floorsClimbed >= 100) {
            allLogs.push(`⚠️ Tạm dừng sau 100 tầng.`);
            isStillWinning = false;
        }
    }

    allLogs.push(`-----------------------------`);
    allLogs.push(`🏆 TỔNG KẾT: Leo được ${floorsClimbed} tầng.`);
    allLogs.push(`💰 Tổng nhận: ${totalGemsGained} Kim Cương.`);

    appContent.innerHTML = `
        <div style="padding:20px; max-width:600px; margin: 0 auto;">
            <h2 style="color: gold; text-align:center">KẾT QUẢ LEO THÁP</h2>
            <div style="background:#111; color:#0f0; padding:15px; height:450px; overflow-y:auto; font-family:monospace; border: 2px solid #9b59b6; border-radius:8px; line-height:1.6;">
                ${allLogs.map(l => `<div>${l}</div>`).join('')}
            </div>
            <button class="action-btn" onclick="window.renderBattleMap()" style="margin-top:20px; background:#8e44ad; width:100%;">Quay về Map</button>
        </div>
    `;
    updateHeader();
}
// js/ui.js

// js/ui.js

// --- BƯỚC 1: THÊM CÁC HÀM SAU VÀO DANH SÁCH IMPORT TỪ state.js ---


// ... (giữ nguyên các phần code khác cho đến đoạn túi trang bị)

// --- BƯỚC 2: SỬA LẠI CÁC HÀM QUẢN LÝ TÚI TRANG BỊ ---

let isEquipSellMode = false; // Chế độ bán trang bị

// 1. Hệ thống sắp xếp (SSR > SR > R, sau đó đến Level)
const EQUIP_RANK_ORDER = { "SSR": 3, "SR": 2, "R": 1 };

export function renderEquipmentBag() {
    const state = getState();
    const bag = state.equipmentBag || [];
    
    // Sắp xếp túi đồ
    const sortedBag = [...bag].sort((a, b) => {
        const rankDiff = (EQUIP_RANK_ORDER[b.rarity] || 0) - (EQUIP_RANK_ORDER[a.rarity] || 0);
        if (rankDiff !== 0) return rankDiff;
        return (b.level || 1) - (a.level || 1);
    });

    appContent.innerHTML = `
        <div style="text-align:center; padding:10px; background:#222; border-bottom:1px solid #444; position:sticky; top:0; z-index:10;">
            <h2>Túi Trang Bị (${bag.length}/200)</h2>
            <div style="display:flex; justify-content:center; gap:10px; margin-top: 10px;">
                <button onclick="window.toggleEquipSellMode()" class="gm-btn ${isEquipSellMode ? 'gm-btn-red' : 'gm-btn-blue'}">
                    ${isEquipSellMode ? "HỦY BÁN" : "💰 BÁN TRANG BỊ"}
                </button>
            </div>
            <p style="font-size:11px; color:#aaa; margin-top:5px;">Ưu tiên hiển thị phẩm cấp cao nhất</p>
        </div>
        <div class="card-grid">
            ${sortedBag.map(item => `
                <div class="card ${item.rarity} ${isEquipSellMode ? 'selected' : ''}" 
                     onclick="window.handleEquipClick('${item.uid}')" 
                     style="border-style:dashed; height: auto; min-height: 180px;">
                    <div class="card-header">
                        <span class="rank-badge ${item.rarity}">${item.rarity}</span>
                        <span class="level-badge">Lv.${item.level || 1}</span>
                    </div>
                    <div class="card-body">
                        <div class="star-container">${(item.star || 0) > 0 ? '⭐x'+item.star : '⭐x0'}</div>
                        <div class="hero-icon">${item.img}</div>
                        <div class="hero-name">${item.name}</div>
                        <div style="color:#00ff00; font-weight:bold; font-size:12px;">+${item.stat}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 2. Logic Xử lý Click giống Tướng
window.handleEquipClick = (uid) => {
    if (isEquipSellMode) {
        if (confirm("Bạn có chắc muốn bán trang bị này lấy 10 Kim Cương?")) {
            const result = removeEquipmentFromBag(uid);
            if (result.success) {
                updateHeader();
                renderEquipmentBag();
            } else {
                alert("⛔ " + result.message);
            }
        }
    } else {
        showEquipDetailModal(uid);
    }
};
// 3. Modal chi tiết trang bị để Nâng cấp/Nâng sao
function showEquipDetailModal(uid) {
    const state = getState();
    const item = state.equipmentBag.find(i => Number(i.uid) === Number(uid));
    if (!item) return;

    const modalHtml = `
        <div id="equip-detail-modal" class="gm-modal">
            <div class="gm-box" style="max-width:350px; text-align:center;">
                <h2 style="color:gold;">${item.name}</h2>
                <div style="font-size:60px; margin:10px 0;">${item.img}</div>
                <div style="margin-bottom:15px;">
                    <div style="color:cyan;">Cấp: ${item.level || 1} | Sao: ${item.star || 0}</div>
                    <div style="color:#00ff00; font-size:20px;">+${item.stat} Chỉ số</div>
                </div>
                <div class="gm-grid">
                    <button class="gm-btn gm-btn-green" onclick="window.doEquipLevelUp('${uid}')">Nâng Cấp</button>
                    <button class="gm-btn gm-btn-purple" onclick="window.doEquipStarUp('${uid}')">Nâng Sao</button>
                </div>
                <button class="gm-btn gm-btn-gray" style="width:100%; margin-top:20px;" 
                    onclick="document.getElementById('equip-detail-modal').remove()">Đóng</button>
            </div>
        </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
}

// Bridge Functions
// js/ui.js

window.doEquipLevelUp = (uid) => {
    // Gọi hàm nâng cấp với UID cụ thể của trang bị đang xem
    if (upgradeEquipmentLevel(uid)) {
        // Cập nhật số Gem trên màn hình
        updateHeader();
        
        // Vẽ lại Modal chi tiết của CHÍNH con đó để thấy Level tăng ngay
        // Đóng modal cũ và mở lại với dữ liệu mới
        const oldModal = document.getElementById('equip-detail-modal');
        if (oldModal) oldModal.remove();
        
        showEquipDetailModal(uid);
        
        // Đồng thời vẽ lại túi đồ bên dưới để đồng bộ
        renderEquipmentBag();
    }
};

// Mở bảng chọn phôi nâng sao gộp (Giống tướng)
// js/ui.js

// js/ui.js

window.doEquipStarUp = (uid) => {
    const detailModal = document.getElementById('equip-detail-modal');
    if (detailModal) detailModal.remove();

    const state = getState();
    const tUid = Number(uid); // Ép kiểu UID trang bị chính
    
    // Tìm trang bị chính để lấy ID loại (ví dụ: Kiếm Gỗ có ID 101)
    const target = state.equipmentBag.find(i => Number(i.uid) === tUid);

    if (!target) return alert("Lỗi dữ liệu trang bị!");

    // LOGIC QUAN TRỌNG: Lọc những món cùng ID (loại) nhưng KHÁC UID (thực thể)
    const materials = state.equipmentBag.filter(i => 
        i.id === target.id && Number(i.uid) !== tUid
    );

    if (materials.length === 0) {
        return alert("Không có trang bị cùng loại để làm phôi!");
    }
    
    let selected = [];
    const overlay = document.createElement('div');
    overlay.className = 'rare-appearance-overlay';
    overlay.id = 'equip-bulk-picker';
    overlay.innerHTML = `
        <div style="background:#222; padding:20px; border-radius:10px; border:2px solid #a29bfe; width:90%; max-width:400px; color:white;">
            <h3 style="text-align:center; color:#a29bfe;">CHỌN PHÔI NÂNG SAO</h3>
            <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; max-height:250px; overflow-y:auto; margin:15px 0;">
                ${materials.map(m => `
                    <div class="material-item" id="em-${m.uid}" onclick="window.toggleEquipMaterial('${m.uid}')" 
                         style="border:1px solid #444; padding:5px; cursor:pointer; width:70px; position:relative;">
                        <div style="font-size:20px;">${m.img}</div>
                        <div style="font-size:9px;">Lv.${m.level || 1}</div>
                        <div class="check-mark" style="display:none; position:absolute; top:2px; right:4px; color:#00ff00;">✔</div>
                    </div>`).join('')}
            </div>
            <button id="btn-confirm-equip-bulk" class="gm-btn" style="width:100%; background:#a29bfe; color:black;">XÁC NHẬN (0)</button>
            <button class="gm-btn gm-btn-gray" style="width:100%; margin-top:5px;" 
                    onclick="document.getElementById('equip-bulk-picker').remove()">HỦY</button>
        </div>`;
    
    document.body.appendChild(overlay);

    // Xử lý chọn phôi
    window.toggleEquipMaterial = (mUid) => {
        const idStr = mUid.toString();
        const idx = selected.indexOf(idStr);
        const el = document.getElementById(`em-${idStr}`);
        
        if (idx > -1) {
            selected.splice(idx, 1);
            el.style.borderColor = "#444";
            el.querySelector('.check-mark').style.display = "none";
        } else {
            selected.push(idStr);
            el.style.borderColor = "#a29bfe";
            el.querySelector('.check-mark').style.display = "block";
        }
        document.getElementById('btn-confirm-equip-bulk').innerText = `XÁC NHẬN (${selected.length})`;
    };

    document.getElementById('btn-confirm-equip-bulk').onclick = () => {
        if (selected.length === 0) return alert("Hãy chọn ít nhất 1 phôi!");
        
        // Truyền chính xác UID trang bị chính và mảng phôi đã chọn
        const res = upgradeEquipmentStarBulk(tUid, selected);
        if (res.success) {
            document.getElementById('equip-bulk-picker').remove();
            renderEquipmentBag(); 
            alert(`Thành công! Trang bị chính đã đạt ${res.newStar} sao.`);
        }
    };
};
window.toggleEquipSellMode = () => {
    isEquipSellMode = !isEquipSellMode;
    renderEquipmentBag();
};

// Sửa lỗi ReferenceError: Thêm ép kiểu Number(uid)
window.uiRemoveEquip = (uid) => {
    if(confirm("Bán trang bị này để nhận 50 Kim cương?")) {
        const res = removeEquipmentFromBag(Number(uid)); // Ép kiểu để tìm đúng UID
        if(res.success) { 
            updateHeader(); 
            renderEquipmentBag(); 
        } else {
            alert(res.message);
        }
    }
};

window.uiUpgradeEquipLevel = (uid) => {
    if(upgradeEquipmentLevel(Number(uid))) { // Ép kiểu Number
        updateHeader(); 
        renderEquipmentBag(); 
    }
};

window.uiUpgradeEquipStar = (targetUid) => {
    const state = getState();
    const tUid = Number(targetUid); // Ép kiểu
    const item = state.equipmentBag.find(i => Number(i.uid) === tUid);

    if(!item) return alert("Không tìm thấy trang bị!"); // Sửa lỗi TypeError

    const materials = state.equipmentBag.filter(i => i.id === item.id && Number(i.uid) !== tUid);

    if(materials.length === 0) return alert("Cần thêm 1 trang bị cùng loại (cùng ID) để nâng sao!");
    
    if(confirm(`Sử dụng ${materials[0].name} để nâng sao?`)) {
        if(upgradeEquipmentStar(tUid, Number(materials[0].uid))) {
            renderEquipmentBag();
        }
    }
};
window.renderBattleMap = renderBattleMap;
window.selectStage = (id) => startBattle('campaign', id);
window.startTower = () => autoClimbTowerContinuous();
initAdminPanel();
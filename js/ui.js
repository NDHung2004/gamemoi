// js/ui.js
import { 
    getState, advanceStage, updateGems, toggleTeamMember, 
    removeHeroFromInventory, MAX_INVENTORY, upgradeHeroLevel, 
    evolveHero, upgradeHeroStarBulk, setGemsDirectly, addHeroToInventory, clearInventory,
} from './state.js';
import { getCampaignDB, getHeroDB, } from './database.js';
import { simulateBattle, autoClimbTower } from './battle.js';
import { initAdminPanel } from './admin.js';
const appContent = document.getElementById('app-content');
const gemDisplay = document.getElementById('gem-count');
let isSellMode = false;
let selectedMaterials = []; 

// --- 1. HÀM HỖ TRỢ (UTILS) ---

function formatNumber(num) {
    // Chuyển đổi sang BigInt để tính toán chính xác tuyệt đối
    const n = BigInt(Math.floor(Number(num)));
    if (n >= 1000000000000000000n) return (Number(n / 100000000000000000n) / 10).toFixed(1) + 'Q'; // Quintillion (Tỷ tỷ)
    if (n >= 1000000000000000n) return (Number(n / 100000000000000n) / 10).toFixed(1) + 'q'; // Quadrillion (Triệu tỷ)
    if (n >= 1000000000000n) return (Number(n / 100000000000n) / 10).toFixed(1) + 't'; // Trillion
    if (n >= 1000000000n) return (Number(n / 100000000n) / 10).toFixed(1) + 'b'; // Billion
    if (n >= 1000000n) return (Number(n / 100000n) / 10).toFixed(1) + 'm'; // Million
    if (n >= 1000n) return (Number(n / 100n) / 10).toFixed(1) + 'k'; // Thousand
    return n.toString();
}

export function updateHeader() {
    const state = getState();
    if (gemDisplay) gemDisplay.innerText = formatNumber(state.gems);
}

// Hàm tạo HTML thẻ bài dùng chung cho toàn game
function createCardHTML(hero, isSelected, isGacha = false) {
    const formattedHP = formatNumber(hero.hp);
    const formattedATK = formatNumber(hero.atk);
    const starDisplay = (hero.star || 0) > 0 ? `⭐x${hero.star}` : "⭐x0";

    return `
        <div class="card ${hero.rank} ${isSelected ? 'selected' : ''}" onclick="window.handleCardClick(${hero.uid})">
            <div class="card-header">
                <div class="rank-badge ${hero.rank}">${hero.rank}</div>
                <div class="level-badge">Lv.${hero.level || 1}</div>
            </div>
            <div class="card-body">
                <div class="star-container">${starDisplay}</div>
                <div class="hero-icon">${hero.img || '🃏'}</div>
                <h3 class="hero-name">${hero.name}</h3>
            </div>
            <div class="card-footer">
                <div class="stats-grid">
                    <div class="stat-item">❤️<span>${formattedHP}</span></div>
                    <div class="stat-item">⚔️<span>${formattedATK}</span></div>
                </div>
                ${!isGacha ? `
                <div class="card-actions">
                    <button onclick="event.stopPropagation(); window.doUpgradeLevel(${hero.uid})">Cấp</button>
                    <button onclick="event.stopPropagation(); window.doUpgradeStar(${hero.uid})">Sao</button>
                </div>` : ''}
            </div>
        </div>`;
}

// --- 2. CÁC MÀN HÌNH CHÍNH ---

export function renderHome() {
    appContent.innerHTML = `
        <div style="text-align:center; padding: 50px;">
            <h1>Cửu Giới Hỗn Mang</h1>
            <p>Chào mừng trở lại!</p>
        </div>`;
}
export function renderBattleMap() {
    const state = getState();
    const curStage = state.progress.campaignStage;
    const campaignDB = getCampaignDB();

    // 1. Render danh sách các Ải Chiến Dịch với thông số Boss
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

    // 2. Render khu vực Tháp Vô Tận với thông số tầng hiện tại
    // --- SỬA PHẦN NÀY: Tính toán Boss Tháp dùng BigInt ---
    const floor = BigInt(state.progress.towerFloor);
    
    // Công thức này PHẢI GIỐNG HỆT công thức trong hàm autoClimbTowerContinuous
    // HP = Floor * 2 Tỷ Tỷ
    const towerHP = floor * 2000000000000000000n; 
    
    // ATK = Floor * 500 Triệu Tỷ
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
    
    // Tính tổng HP và ATK
    const totalHP = teamHeroes.reduce((sum, h) => sum + BigInt(Math.floor(h.hp)), 0n);
    const totalATK = teamHeroes.reduce((sum, h) => sum + BigInt(Math.floor(h.atk)), 0n);
    
    // Công thức lực chiến đơn giản: HP + ATK (Bạn có thể tùy chỉnh: HP/10 + ATK)
    return totalHP + totalATK; 
}
// Định nghĩa độ ưu tiên Rank (Số càng cao càng nằm trên đầu)
// js/ui.js

// Định nghĩa độ ưu tiên Rank (Số càng cao càng nằm trên đầu)
const RANK_ORDER = {
    "GOD": 5,
    "UR": 4,
    "SSR": 3,
    "SR": 2,
    "R": 1
};

export function renderInventory() {
    const state = getState();
    const currentCount = state.inventory.length;
    const currentPower = calculateTeamPower();
    // 1. Logic sắp xếp túi đồ: Ưu tiên Rank cao nhất, sau đó đến Level
    const sortedInventory = [...state.inventory].sort((a, b) => {
        const rankDiff = (RANK_ORDER[b.rank] || 0) - (RANK_ORDER[a.rank] || 0);
        if (rankDiff !== 0) return rankDiff; // Nếu Rank khác nhau, xếp theo Rank
        return b.level - a.level; // Nếu cùng Rank, xếp theo Level cao đến thấp
    });

    // 2. Render giao diện
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
            <p style="font-size:11px; color:#aaa; margin-top:5px;">Ưu tiên hiển thị phẩm cấp cao nhất</p>
        </div>
        <div class="card-grid">
            ${sortedInventory.map(hero => {
                const isSelected = state.team.includes(Number(hero.uid));
                return createCardHTML(hero, isSelected);
            }).join('')}
        </div>
    `;
}

// --- 4. LOGIC NÂNG SAO GỘP (OPTIMIZED) ---

window.doUpgradeStar = (heroUid) => {
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
    if (selectedMaterials.length === 0) {
        return alert("⚠️ Vui lòng chọn ít nhất 1 nguyên liệu!");
    }
    
    // Gọi logic xử lý từ state.js
    const result = upgradeHeroStarBulk(targetUid, selectedMaterials);
    
    if (result.success) {
        // 1. Đóng bảng chọn
        const modal = document.getElementById('bulk-picker-modal');
        if (modal) modal.remove();
        
        // 2. Reset mảng chọn
        selectedMaterials = []; 
        
        // 3. Cập nhật giao diện túi đồ
        renderInventory(); 

        // 4. HIỂN THỊ THÔNG BÁO THÀNH CÔNG
        // Sử dụng formatNumber để hiển thị số đẹp (1.2k, 1.5m)
        alert(
            `🎉 NÂNG CẤP THÀNH CÔNG! 🎉\n\n` +
            `⭐ Số sao: ${result.newStar - result.count} ➔ ${result.newStar} Sao\n` +
            `❤️ Máu: ${formatNumber(result.oldHP)} ➔ ${formatNumber(result.newHP)}\n` +
            `⚔️ Công: ${formatNumber(result.oldATK)} ➔ ${formatNumber(result.newATK)}\n\n` +
            `Sức mạnh đã tăng vượt trội!`
        );
    } else {
        alert("❌ Lỗi: " + result.message);
    }
};

// --- 5. GÁN CÁC HÀM CÒN LẠI RA WINDOW ---

window.handleCardClick = (uid) => {
    // 1. NẾU ĐANG Ở CHẾ ĐỘ BÁN
    if (isSellMode) {
        if (confirm("Bạn có chắc muốn bán tướng này lấy 10 Kim Cương?")) {
            // Gọi hàm xóa từ state
            const result = removeHeroFromInventory(uid);
            
            if (result.success) {
                // Nếu bán thành công
                updateHeader();
                renderInventory();
                // (Tùy chọn) alert("Đã bán thành công!"); 
            } else {
                // 🛑 NẾU THẤT BẠI (Do đang trong đội hình) -> HIỆN THÔNG BÁO
                alert("⛔ KHÔNG THỂ BÁN!\n\nTướng này đang nằm trong Đội Hình Chiến Đấu (Viền Xanh).\nVui lòng gỡ tướng khỏi đội hình trước khi bán.");
            }
        }
    } 
    // 2. NẾU ĐANG Ở CHẾ ĐỘ CHỌN ĐỘI (Mặc định)
    else {
        toggleTeamMember(uid);
        renderInventory();
    }
};

window.doUpgradeLevel = (uid) => { if (upgradeHeroLevel(uid)) { updateHeader(); renderInventory(); } };
window.doEvolve = (uid) => { if (confirm("Tiến hóa tốn 5k 💎?") && evolveHero(uid)) { updateHeader(); renderInventory(); } };
window.toggleSellMode = () => { isSellMode = !isSellMode; renderInventory(); };
window.selectStage = (id) => startBattle('campaign', id);

// Xuất các hàm cần thiết cho main.js
export function renderGachaScreen(pullCb) {
    appContent.innerHTML = `<div style="text-align:center;"><h2>Triệu Hồi</h2><button class="action-btn" onclick="window.pull(1)">Quay x1</button><button class="action-btn" onclick="window.pull(10)">Quay x10</button><div id="gacha-results" class="card-grid"></div></div>`;
    window.pull = pullCb;
}

export function showGachaResults(heroes) {
    const container = document.getElementById('gacha-results');
    
    // 1. Lọc ra danh sách các thẻ hiếm để chuẩn bị hàng đợi hiển thị
    const rareHeroes = heroes.filter(h => ['SSR', 'UR', 'GOD'].includes(h.rank));

    // 2. Nếu có thẻ hiếm, bắt đầu chuỗi hiển thị hiệu ứng "Siêu phẩm xuất hiện"
    if (rareHeroes.length > 0) {
        showRareQueue(rareHeroes);
    }

    // 3. Hiển thị danh sách tổng quát trong vùng kết quả quay
    container.innerHTML = heroes.map(hero => {
        // Sử dụng tham số true cho isGacha để ẩn các nút "Cấp/Sao"
        const cardHTML = createCardHTML(hero, false, true); 
        
        // Thêm lớp summon-glow nếu là thẻ hiếm để tạo hiệu ứng hào quang
        return ['SSR', 'UR', 'GOD'].includes(hero.rank) 
            ? `<div class="summon-glow">${cardHTML}</div>` 
            : cardHTML;
    }).join('');
}

/**
 * Quản lý hàng đợi hiển thị từng thẻ hiếm một
 */
function showRareQueue(queue) {
    if (queue.length === 0) return;

    const currentHero = queue[0];
    const remainingQueue = queue.slice(1);

    createRareAppearance(currentHero, () => {
        // Sau khi người dùng bấm "XÁC NHẬN", hiện thẻ hiếm tiếp theo (nếu có)
        showRareQueue(remainingQueue);
    });
}

/**
 * Tạo màn hình lớp phủ (Overlay) nhấn mạnh thẻ hiếm
 */
function createRareAppearance(hero, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'rare-appearance-overlay';
    overlay.style.zIndex = "5000"; // Đảm bảo hiện trên cùng
    
    overlay.innerHTML = `
        <div class="light-burst"></div>
        <div class="rare-card-animate" style="transform: scale(1.5);">
            ${createCardHTML(hero, false, true)}
        </div>
        <button id="confirm-rare-btn" class="action-btn" style="margin-top: 100px; width: 250px; background: linear-gradient(90deg, #f1c40f, #e67e22);">
            NHẬN NGAY
        </button>
    `;
    
    document.body.appendChild(overlay);

    document.getElementById('confirm-rare-btn').onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };
}

export function startBattle(mode, stageId = null) {
    const state = getState();
    const teamHeroes = state.team.map(uid => state.inventory.find(h => Number(h.uid) === uid)).filter(h => h);
    
    if (teamHeroes.length === 0) return alert("Vui lòng chọn đội hình trước khi chiến đấu!");

    // Chuyển chỉ số đội hình sang BigInt
    let playerATK = teamHeroes.reduce((sum, h) => sum + BigInt(Math.floor(h.atk)), 0n);
    let playerHP = teamHeroes.reduce((sum, h) => sum + BigInt(Math.floor(h.hp)), 0n);
    
    let enemyHP, enemyATK, enemyName, reward = 0;

    if (mode === 'tower') {
        const floor = state.progress.towerFloor;
        enemyName = `Boss Tầng ${floor}`;
        // Boss tháp mạnh lên theo tầng (Sử dụng BigInt để đồng bộ)
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

    // LUỒNG CHIẾN ĐẤU TỐI ƯU:
    // 1. Bạn tấn công trước
    enemyHP -= playerATK;
    logs.push(`💥 Bạn tấn công cực mạnh!`);

    if (enemyHP <= 0n) {
        // Boss chết ngay lập tức, không có cơ hội phản công
        logs.push(`💀 ${enemyName} đã bị tiêu diệt hoàn toàn!`);
        logs.push(`-----------------------------`);
        logs.push(`🏆 CHIẾN THẮNG RỰC RỠ!`);
        
        // Cập nhật tiến trình
        updateGems(reward);
        if (mode === 'tower') {
            state.progress.towerFloor++;
        } else if (parseInt(stageId) === state.progress.campaignStage) {
            advanceStage('campaign');
        }
    } else {
        // 2. Nếu Boss còn sống, nó mới được đánh trả
        logs.push(`⚠️ ${enemyName} còn ${formatNumber(enemyHP)} máu và phản công!`);
        playerHP -= enemyATK;
        
        if (playerHP <= 0n) {
            logs.push(`❌ Đội hình của bạn đã gục ngã...`);
            logs.push(`🏆 KẾT QUẢ: THẤT BẠI`);
        } else {
            // Sau khi chịu đòn vẫn còn máu thì tính thắng (vì bạn đã đánh boss mất máu trước)
            logs.push(`🛡️ Bạn chịu đòn, đội hình còn ${formatNumber(playerHP)} máu.`);
            logs.push(`🏆 CHIẾN THẮNG!`);
            
            updateGems(reward);
            if (mode === 'tower') {
                state.progress.towerFloor++;
            } else if (parseInt(stageId) === state.progress.campaignStage) {
                advanceStage('campaign');
            }
        }
    }

    // Hiển thị Log kết quả
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
// Thêm hàm này để xử lý leo tháp liên tục
async function autoClimbTowerContinuous() {
    const state = getState();
    const teamHeroes = state.team.map(uid => state.inventory.find(h => Number(h.uid) === uid)).filter(h => h);
    
    if (teamHeroes.length === 0) return alert("Vui lòng chọn đội hình trước khi leo tháp!");

    let isStillWinning = true;
    let floorsClimbed = 0;
    let totalGemsGained = 0;
    let allLogs = [`🚀 BẮT ĐẦU CHẾ ĐỘ LEO THÁP TỰ ĐỘNG...`];

    while (isStillWinning) {
        const floor = state.progress.towerFloor;
        // Chuyển chỉ số đội hình sang BigInt
        let playerATK = teamHeroes.reduce((sum, h) => sum + BigInt(Math.floor(h.atk)), 0n);
        let playerHP = teamHeroes.reduce((sum, h) => sum + BigInt(Math.floor(h.hp)), 0n);

        // Boss tháp mạnh lên theo tầng (BigInt)
        // Hệ số này bạn có thể chỉnh lại cho cân bằng
        let enemyHP = BigInt(floor) * 2000000000000000000n; // Tăng độ khó thực sự
        let enemyATK = BigInt(floor) * 500000000000000000n;
        let reward = 50 + Math.floor(floor / 5);

        allLogs.push(`-----------------------------`);
        allLogs.push(`🗼 TẦNG ${floor}: Boss ${formatNumber(enemyHP)} HP`);

        // Lượt 1: Bạn đánh
        enemyHP -= playerATK;
        
        if (enemyHP <= 0n) {
            // Thắng tầng này
            allLogs.push(`✅ CHIẾN THẮNG TẦNG ${floor}! Nhận ${reward} 💎`);
            updateGems(reward);
            state.progress.towerFloor++; // Tăng tầng trong state
            floorsClimbed++;
            totalGemsGained += reward;
        } else {
            // Boss phản công
            playerHP -= enemyATK;
            if (playerHP <= 0n) {
                allLogs.push(`💀 THẤT BẠI TẠI TẦNG ${floor}...`);
                allLogs.push(`❌ Boss còn dư ${formatNumber(enemyHP)} HP.`);
                isStillWinning = false;
            } else {
                // Thắng sau khi chịu đòn
                allLogs.push(`🛡️ Vượt qua tầng ${floor} sau khi chịu đòn!`);
                updateGems(reward);
                state.progress.towerFloor++;
                floorsClimbed++;
                totalGemsGained += reward;
            }
        }
        
        // Giới hạn để tránh treo trình duyệt nếu lực chiến quá khủng
        if (floorsClimbed >= 100) {
            allLogs.push(`⚠️ Đã leo liên tiếp 100 tầng. Tạm dừng để đảm bảo hiệu suất.`);
            isStillWinning = false;
        }
    }

    allLogs.push(`-----------------------------`);
    allLogs.push(`🏆 TỔNG KẾT: Leo được ${floorsClimbed} tầng.`);
    allLogs.push(`💰 Tổng nhận: ${totalGemsGained} Kim Cương.`);

    // Hiển thị kết quả cuối cùng
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
window.renderBattleMap = renderBattleMap;
window.selectStage = (id) => startBattle('campaign', id);
window.startTower = () => autoClimbTowerContinuous();
initAdminPanel();
import { getState, advanceStage, updateGems } from './state.js';
import { generateTowerEnemy } from './enemies.js';
import { calculateHeroStats } from './equipment.js';
// Tính tổng sức mạnh đội hình người chơi (Lấy 5 tướng mạnh nhất)
// Tính tổng sức mạnh đội hình (Có tính trang bị)
export function calculatePlayerPower() {
    const state = getState();
    const teamIds = state.team || [];
    const teamHeroes = state.inventory.filter(h => teamIds.includes(Number(h.uid)));

    if (teamHeroes.length === 0) {
        return { hp: 0, atk: 0, speed: 0, count: 0, error: true };
    }

    let totalHp = 0;
    let totalAtk = 0;
    let avgSpeed = 0;

    teamHeroes.forEach(hero => {
        // MỚI: Dùng hàm tính chỉ số tổng hợp
        const stats = calculateHeroStats(hero);
        
        totalHp += stats.hp;
        totalAtk += stats.atk;
        avgSpeed += stats.speed;
    });

    avgSpeed = Math.floor(avgSpeed / teamHeroes.length);

    return { 
        hp: totalHp, 
        atk: totalAtk, 
        speed: avgSpeed, 
        count: teamHeroes.length 
    };
}

// Logic đánh nhau (Turn-based đơn giản)
// Trả về log diễn biến trận đấu
export function simulateBattle(enemy) {
    let player = calculatePlayerPower();

    // Kiểm tra nếu chưa chọn đội hình
    if (player.error) {
        return { 
            success: false, 
            logs: ["⚠️ BẠN CHƯA CHỌN ĐỘI HÌNH!", "Hãy vào 'Túi Tướng' và bấm vào thẻ bài để chọn tối đa 5 tướng ra trận."],
            reward: 0 
        };
    }

    // ... (Phần logic đánh nhau while loop bên dưới GIỮ NGUYÊN như cũ)
    let battleLog = [];
    let turn = 1;
    let isWin = false;
    let playerCurrentHp = player.hp;
    let enemyCurrentHp = enemy.hp;
    
    // ... (Copy đoạn logic while loop đánh nhau từ code cũ vào đây) ...
    
    battleLog.push(`⚔️ ĐỘI HÌNH RA TRẬN (${player.count} TƯỚNG)`);
    battleLog.push(`Tổng lực chiến: HP ${player.hp} - ATK ${player.atk}`);
    // ... code đánh nhau tiếp ...
    
    // (Để ngắn gọn tôi không paste lại đoạn while, bạn giữ nguyên logic cũ nhé)
    // Code tạm cho đoạn while nếu bạn lười copy lại:
    while (playerCurrentHp > 0 && enemyCurrentHp > 0 && turn <= 50) {
        enemyCurrentHp -= player.atk;
        battleLog.push(`Lượt ${turn}: Team gây ${player.atk} sát thương.`);
        if (enemyCurrentHp <= 0) { isWin = true; break; }
        playerCurrentHp -= enemy.atk;
        battleLog.push(`Lượt ${turn}: Boss đánh trả ${enemy.atk}.`);
        turn++;
    }

    return { success: isWin, logs: battleLog, reward: isWin ? enemy.reward : 0 };
}// --- HÀM MỚI: LEO THÁP TỰ ĐỘNG ---
export function autoClimbTower() {
    let state = getState();
    let startFloor = state.progress.towerFloor;
    let currentFloor = startFloor;
    
    let totalReward = 0;
    let sessionLogs = []; // Log tổng hợp
    let isDefeated = false;
    let battlesCount = 0;

    // Tính sức mạnh người chơi 1 lần (vì leo tháp không thay đổi đội hình giữa chừng)
    const playerPower = calculatePlayerPower();
    
    // Kiểm tra nếu chưa chọn đội
    if (playerPower.error) {
        return { success: false, logs: ["⚠️ CHƯA CHỌN ĐỘI HÌNH!", "Vào Túi Tướng chọn 5 tướng trước."] };
    }

    sessionLogs.push(`🚀 BẮT ĐẦU LEO TỪ TẦNG ${startFloor}...`);
    sessionLogs.push(`⚔️ Lực chiến đội hình: ${playerPower.atk} công / ${playerPower.hp} máu`);
    sessionLogs.push("-----------------------------");

    // VÒNG LẶP CHIẾN ĐẤU (Giới hạn 50 tầng 1 lần bấm để tránh treo máy nếu bạn quá mạnh)
    while (!isDefeated && battlesCount < 50) {
        // 1. Tạo quái vật theo tầng hiện tại
        const enemy = generateTowerEnemy(currentFloor);
        
        // 2. Mô phỏng trận đấu (Code logic giống simulateBattle nhưng chạy ngầm)
        // Chúng ta viết lại logic ngắn gọn ở đây để tối ưu tốc độ
        let pHP = playerPower.hp;
        let eHP = enemy.hp;
        let turn = 0;
        let battleWon = false;

        // Đánh nhau cho đến khi 1 bên chết
        while (pHP > 0 && eHP > 0 && turn < 50) {
            eHP -= playerPower.atk; // Mình đánh
            if (eHP <= 0) { battleWon = true; break; }
            pHP -= enemy.atk;       // Nó đánh
            turn++;
        }

        // 3. Xử lý kết quả
        if (battleWon) {
            // Thắng: Nhận quà, tăng tầng
            totalReward += enemy.reward;
            updateGems(enemy.reward);
            advanceStage('tower'); // Lưu game ngay lập tức
            
            sessionLogs.push(`✅ Tầng ${currentFloor}: CHIẾN THẮNG! (+${enemy.reward}💎)`);
            currentFloor++;
            battlesCount++;
        } else {
            // Thua: Dừng lại
            sessionLogs.push(`💀 Tầng ${currentFloor}: THẤT BẠI... (Dừng lại)`);
            sessionLogs.push(`❌ Boss còn ${eHP} máu.`);
            isDefeated = true;
        }
    }

    if (battlesCount >= 50) sessionLogs.push("🛑 Đã leo 50 tầng liên tục, hãy bấm leo tiếp!");

    // Tổng kết
    sessionLogs.push("-----------------------------");
    sessionLogs.push(`🏆 KẾT QUẢ: Leo được ${battlesCount} tầng.`);
    sessionLogs.push(`💰 Tổng nhận: ${totalReward} Kim Cương.`);

    return { success: true, logs: sessionLogs };
}
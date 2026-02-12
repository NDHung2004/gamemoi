// Dữ liệu Boss Cốt Truyện (Cố định)
export const CAMPAIGN_BOSSES = {
    1: { name: "Sói Hoang", hp: 100, atk: 10, reward: 100 },
    2: { name: "Gấu Khổng Lồ", hp: 300, atk: 25, reward: 200 },
    3: { name: "Thủ Lĩnh Orc", hp: 800, atk: 50, reward: 500 },
    4: { name: "Rồng Lửa (Boss)", hp: 2000, atk: 150, reward: 1000 }
};

// Hàm tạo Quái Tháp (Sức mạnh tăng theo tầng)
export function generateTowerEnemy(floor) {
    // Công thức: Máu tăng 20% mỗi tầng, Công tăng 10% mỗi tầng
    const scaleHp = Math.floor(200 * Math.pow(1.2, floor - 1));
    const scaleAtk = Math.floor(20 * Math.pow(1.1, floor - 1));
    
    return {
        name: `Hộ Vệ Tầng ${floor}`,
        hp: scaleHp,
        atk: scaleAtk,
        reward: 50 + (floor * 10), // Thưởng tăng dần
        isTower: true
    };
}
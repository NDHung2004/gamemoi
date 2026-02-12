const SAVE_KEY = 'gacha_game_v2_data';

// --- SỬA ĐOẠN NÀY ---
const DEFAULT_DATA = {
    gems: 1000,
    inventory: [],
    history: [],
    // Thêm phần này vào để tránh lỗi undefined
    progress: {
        campaignStage: 1,
        towerFloor: 1
    },
    settings: {
        sound: true,
        notifications: true
    },
    createdAt: new Date().toISOString()
};

export const StorageSystem = {
    // Lưu dữ liệu
   save(data) {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Lỗi save:", e);
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return { ...DEFAULT_DATA };
            
            // Merge dữ liệu cũ với mặc định để đảm bảo luôn có 'progress'
            // Dòng này rất quan trọng:
            return { ...DEFAULT_DATA, ...JSON.parse(raw) }; 
        } catch (e) {
            return { ...DEFAULT_DATA };
        }
    },

    clear() {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
    }
};
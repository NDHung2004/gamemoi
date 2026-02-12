// js/items.js
export const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    BOOTS: 'boots'
};

// Khai báo biến có thể thay đổi để Admin can thiệp
export let EQUIPMENT_DB = [
    { id: 101, name: "Kiếm Gỗ", type: ITEM_TYPES.WEAPON, stat: 15, rarity: "R", img: "🗡️", rate: 0.5 }, // 50%
    { id: 103, name: "Thánh Kiếm", type: ITEM_TYPES.WEAPON, stat: 80, rarity: "SSR", img: "⚔️", rate: 0.05 }, // 5%
    // ... các trang bị khác
];

// js/items.js

export function addItemToDB(newItem) {
    // Nếu ID không được nhập hoặc bằng 0, tự động sinh ID mới
    if (!newItem.id || newItem.id === 0) {
        const maxId = EQUIPMENT_DB.length > 0 
            ? Math.max(...EQUIPMENT_DB.map(i => i.id)) 
            : 100; // Khởi tạo từ 100 nếu danh sách trống
        newItem.id = maxId + 1;
    }

    // Kiểm tra trùng lặp lần cuối
    if (EQUIPMENT_DB.some(i => i.id === newItem.id)) {
        return { success: false, message: "ID đã tồn tại!" };
    }

    EQUIPMENT_DB.push(newItem);
    return { success: true, id: newItem.id };
}

export function updateItemInDB(id, updatedData) {
    const index = EQUIPMENT_DB.findIndex(i => i.id === Number(id));
    if (index === -1) return false;
    EQUIPMENT_DB[index] = { ...EQUIPMENT_DB[index], ...updatedData, id: Number(id) };
    return true;
}

export function deleteItemFromDB(id) {
    EQUIPMENT_DB = EQUIPMENT_DB.filter(i => i.id !== Number(id));
}
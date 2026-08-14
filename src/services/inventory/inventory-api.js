import axiosInstance from "@/lib/axios";

// Warehouse Inventory API
export const warehouseInventoryAPI = {
    // Stock-in to warehouse
    stockIn: async (data) => {
        const response = await axiosInstance.post(`/inventory/warehouse/stock-in`, data);
        return response.data;
    },

    // Adjust inventory
    adjust: async (data) => {
        const response = await axiosInstance.post(`/inventory/warehouse/adjust`, data);
        return response.data;
    },

    // Get warehouse inventory for a variant
    getInventory: async (variantId) => {
        const response = await axiosInstance.get(`/inventory/warehouse/${variantId}`);
        return response.data;
    },

    // Get transaction history
    getHistory: async (variantId, limit = 50) => {
        const response = await axiosInstance.get(
            `/inventory/warehouse/${variantId}/history`,
            { params: { limit } }
        );
        return response.data;
    },

    // Get all warehouse inventory (paginated)
    getAll: async ({ page = 1, pageSize = 50, search = "", status } = {}) => {
        const response = await axiosInstance.get(`/inventory/warehouse/all`, {
            params: {
                page,
                pageSize,
                search: search || undefined,
                status: status || undefined,
            },
        });
        return response.data;
    },
};

// Outlet Assignment API
export const outletAssignmentAPI = {
    // Fetch outlets
    getOutlets: async ({ page = 1, pageSize = 20, search = "" } = {}) => {
        const response = await axiosInstance.get(`/outlets`, {
            params: {
                page,
                pageSize,
                search: search || undefined,
            },
        });
        return response.data;
    },

    // Fetch single outlet
    getOutlet: async (outletId) => {
        const response = await axiosInstance.get(`/outlets/${outletId}`);
        return response.data;
    },

    // Assign products to outlet
    assignProducts: async (outletId, data) => {
        const response = await axiosInstance.post(
            `/outlets/${outletId}/products/assign`,
            data
        );
        return response.data;
    },

    // Unassign products from outlet
    unassignProducts: async (outletId, data) => {
        const response = await axiosInstance.delete(
            `/outlets/${outletId}/products/unassign`,
            { data }
        );
        return response.data;
    },

    // Get products assigned to outlet
    getOutletProducts: async (outletId) => {
        const response = await axiosInstance.get(`/outlets/${outletId}/products`);
        return response.data;
    },
};

// Stock Transfer API
export const stockTransferAPI = {
    // Transfer from warehouse to outlet
    warehouseToOutlet: async (data) => {
        const response = await axiosInstance.post(
            `/inventory/transfer/warehouse-to-outlet`,
            data
        );
        return response.data;
    },

    // Transfer between outlets
    outletToOutlet: async (data) => {
        const response = await axiosInstance.post(
            `/inventory/transfer/outlet-to-outlet`,
            data
        );
        return response.data;
    },

    // Return from outlet to warehouse
    outletToWarehouse: async (data) => {
        const response = await axiosInstance.post(
            `/inventory/transfer/outlet-to-warehouse`,
            data
        );
        return response.data;
    },
};

// Inventory Query API
export const inventoryQueryAPI = {
    // Get complete inventory summary for a variant
    getSummary: async (variantId) => {
        const response = await axiosInstance.get(`/inventory/summary/${variantId}`);
        return response.data;
    },

    // Get outlet inventory
    getOutletInventory: async (outletId) => {
        const response = await axiosInstance.get(`/inventory/outlet/${outletId}`);
        return response.data;
    },

    // Get low stock alerts
    getLowStockAlerts: async (threshold) => {
        const response = await axiosInstance.get(`/inventory/low-stock`, {
            params: { threshold },
        });
        return response.data;
    },
};

// Export all APIs
export const inventoryAPI = {
    warehouse: warehouseInventoryAPI,
    outlets: outletAssignmentAPI,
    transfers: stockTransferAPI,
    queries: inventoryQueryAPI,
};

export default inventoryAPI;

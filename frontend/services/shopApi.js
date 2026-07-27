const API_BASE = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const cartApi = {
  add: async (productId, quantity = 1) => {
    const res = await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add to cart');
    return data;
  },

  get: async () => {
    const res = await fetch(`${API_BASE}/cart`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch cart');
    return data;
  },

  update: async (productId, quantity) => {
    const res = await fetch(`${API_BASE}/cart/update/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update cart');
    return data;
  },

  remove: async (productId) => {
    const res = await fetch(`${API_BASE}/cart/remove/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to remove item');
    return data;
  },

  clear: async () => {
    const res = await fetch(`${API_BASE}/cart/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to clear cart');
    return data;
  }
};

export const sellerShopApi = {
  create: async (shopData) => {
    const res = await fetch(`${API_BASE}/shops`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(shopData)
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to create shop');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  getMine: async () => {
    const res = await fetch(`${API_BASE}/shops/mine`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch shop');
    return data;
  }
};

export const orderApi = {
  place: async (deliveryAddress, paymentMethod = 'COD') => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ deliveryAddress, paymentMethod })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to place order');
    return data;
  },

  getMyOrders: async () => {
    const res = await fetch(`${API_BASE}/orders/my-orders`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
    return data;
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch order');
    return data;
  }
};

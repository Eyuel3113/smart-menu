import {
  ApiResponse,
  TableValidationResponse,
  LoginResponse,
  PublicMenuResponse,
  DashboardAnalyticsResponse,
  Order,
  Table,
  ServiceRequest,
  TableStatus,
  OrderStatus,
  ServiceRequestType,
  ServiceRequestStatus,
  RestaurantBranding,
  Area,
  TableKpis,
  Transaction,
  PaymentMethod,
} from './types';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    // Relative path in browser ensures Next.js rewrites proxy to backend without CORS or mixed-content issues on tunnels
    return '';
  }
  return 'http://localhost:5000';
};

class ApiClient {
  private getStaffToken(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('smart_menu_staff_token');
    } catch {
      return null;
    }
  }

  private getCustomerToken(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return sessionStorage.getItem('smart_menu_customer_token');
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${getBaseUrl()}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const staffToken = this.getStaffToken();
    const customerToken = this.getCustomerToken();
    const isCustomerRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/table');

    if (isCustomerRoute && customerToken) {
      headers['Authorization'] = `Bearer ${customerToken}`;
      headers['x-table-token'] = customerToken;
    } else if (staffToken) {
      headers['Authorization'] = `Bearer ${staffToken}`;
    } else if (customerToken) {
      headers['Authorization'] = `Bearer ${customerToken}`;
      headers['x-table-token'] = customerToken;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('smart_menu_staff_token');
          localStorage.removeItem('smart_menu_staff_user');
          if (!window.location.pathname.startsWith('/table') && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        const errorMsg = data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // --- Auth APIs ---
  public auth = {
    hasStaffToken: (): boolean => {
      if (typeof window === 'undefined') return false;
      return !!localStorage.getItem('smart_menu_staff_token');
    },
    login: async (email: string, password: string): Promise<LoginResponse> => {
      const res = await this.request<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.data.token && typeof window !== 'undefined') {
        localStorage.setItem('smart_menu_staff_token', res.data.token);
        localStorage.setItem('smart_menu_staff_user', JSON.stringify(res.data.staff));
      }
      return res.data;
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('smart_menu_staff_token');
        localStorage.removeItem('smart_menu_staff_user');
      }
    },
    getMe: async () => {
      const res = await this.request<LoginResponse['staff']>('/api/auth/me');
      return res.data;
    },
  };

  // --- Restaurant CMS & Branding APIs ---
  public branding = {
    get: async (restaurantId?: string): Promise<RestaurantBranding> => {
      const query = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : '';
      const res = await this.request<RestaurantBranding>(`/api/restaurant/branding${query}`);
      return res.data;
    },
    update: async (data: Partial<RestaurantBranding>): Promise<RestaurantBranding> => {
      const res = await this.request<RestaurantBranding>('/api/restaurant/branding', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
  };

  // --- Areas & Zones APIs ---
  public areas = {
    getAll: async (): Promise<Area[]> => {
      const res = await this.request<Area[]>('/api/areas');
      return res.data;
    },
    create: async (data: { name: string; sortOrder?: number }): Promise<Area> => {
      const res = await this.request<Area>('/api/areas', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    update: async (id: string, data: { name?: string; sortOrder?: number }): Promise<Area> => {
      const res = await this.request<Area>(`/api/areas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    delete: async (id: string): Promise<any> => {
      const res = await this.request<any>(`/api/areas/${id}`, {
        method: 'DELETE',
      });
      return res.data;
    },
  };

  // --- Table APIs ---
  public tables = {
    validate: async (tableId: string, token: string): Promise<TableValidationResponse> => {
      const res = await this.request<TableValidationResponse>(
        `/api/tables/${tableId}/validate?token=${encodeURIComponent(token)}`
      );
      if (res.data.sessionToken && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('smart_menu_customer_token', res.data.sessionToken);
        } catch {
          // Handled silently
        }
      }
      return res.data;
    },
    getPublic: async (tableId: string): Promise<Table> => {
      const res = await this.request<Table>(`/api/tables/${tableId}/public`);
      return res.data;
    },
    getAll: async (areaId?: string): Promise<Table[]> => {
      const query = areaId ? `?areaId=${encodeURIComponent(areaId)}` : '';
      const res = await this.request<any>(`/api/tables${query}`);
      if (Array.isArray(res.data)) {
        return res.data;
      }
      if (res.data && Array.isArray(res.data.tables)) {
        return res.data.tables;
      }
      return [];
    },
    getWithKpis: async (
      areaId?: string
    ): Promise<{ tables: Table[]; kpis: TableKpis }> => {
      const query = areaId ? `?areaId=${encodeURIComponent(areaId)}` : '';
      const res = await this.request<any>(`/api/tables${query}`);
      if (Array.isArray(res.data)) {
        const total = res.data.length;
        const available = res.data.filter((t: Table) => t.status === 'AVAILABLE').length;
        const occupied = res.data.filter((t: Table) => t.status === 'OCCUPIED').length;
        const paidPending = res.data.filter((t: Table) => t.status === 'PAID_PENDING').length;
        const cleaning = res.data.filter((t: Table) => t.status === 'CLEANING').length;
        const billRequested = res.data.filter((t: Table) => t.status === 'BILL_REQUESTED').length;
        return {
          tables: res.data,
          kpis: { total, available, occupied, paidPending, cleaning, billRequested },
        };
      }
      return res.data;
    },
    getById: async (id: string): Promise<Table> => {
      const res = await this.request<Table>(`/api/tables/${id}`);
      return res.data;
    },
    updateStatus: async (id: string, status: TableStatus): Promise<Table> => {
      const res = await this.request<Table>(`/api/tables/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return res.data;
    },
    create: async (data: {
      tableNumber: number;
      areaId?: string | null;
      capacity?: number;
    }): Promise<Table> => {
      const res = await this.request<Table>('/api/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    update: async (
      id: string,
      data: { tableNumber?: number; areaId?: string | null; capacity?: number }
    ): Promise<Table> => {
      const res = await this.request<Table>(`/api/tables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    delete: async (id: string): Promise<any> => {
      const res = await this.request<any>(`/api/tables/${id}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    regenerateQr: async (id: string): Promise<Table> => {
      const res = await this.request<Table>(`/api/tables/${id}/regenerate-qr`, {
        method: 'POST',
      });
      return res.data;
    },
    pay: async (
      tableId: string,
      data: { paymentMethod: PaymentMethod; referenceNote?: string }
    ): Promise<{ table: Table; transaction: Transaction }> => {
      const res = await this.request<{ table: Table; transaction: Transaction }>(
        `/api/tables/${tableId}/pay`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return res.data;
    },
    approveSettlement: async (tableId: string): Promise<Table> => {
      const res = await this.request<Table>(`/api/tables/${tableId}/approve-settlement`, {
        method: 'PATCH',
      });
      return res.data;
    },
  };

  // --- Transactions APIs ---
  public transactions = {
    getAll: async (filters: {
      from?: string;
      to?: string;
      paymentMethod?: PaymentMethod;
      tableId?: string;
    } = {}): Promise<{
      transactions: Transaction[];
      stats: {
        totalRevenue: number;
        transactionCount: number;
        averageTicket: number;
      };
    }> => {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.tableId) params.append('tableId', filters.tableId);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await this.request<{
        transactions: Transaction[];
        stats: { totalRevenue: number; transactionCount: number; averageTicket: number };
      }>(`/api/transactions${query}`);
      return res.data;
    },
  };

  // --- Menu APIs ---
  public menu = {
    getPublic: async (restaurantId?: string): Promise<PublicMenuResponse> => {
      const query = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : '';
      const res = await this.request<PublicMenuResponse>(`/api/menu/public${query}`);
      return res.data;
    },
    getCategories: async (): Promise<any[]> => {
      const res = await this.request<any[]>('/api/menu/categories');
      return res.data;
    },
    createCategory: async (data: { name: string; sortOrder?: number }): Promise<any> => {
      const res = await this.request<any>('/api/menu/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    updateCategory: async (id: string, data: { name?: string; sortOrder?: number }): Promise<any> => {
      const res = await this.request<any>(`/api/menu/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    deleteCategory: async (id: string): Promise<any> => {
      const res = await this.request<any>(`/api/menu/categories/${id}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    getItems: async (filters: { categoryId?: string; search?: string; isAvailable?: boolean } = {}): Promise<any[]> => {
      const params = new URLSearchParams();
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.search) params.append('search', filters.search);
      if (filters.isAvailable !== undefined) params.append('isAvailable', String(filters.isAvailable));
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await this.request<any[]>(`/api/menu/items${query}`);
      return res.data;
    },
    createItem: async (data: {
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      isAvailable?: boolean;
    }): Promise<any> => {
      const res = await this.request<any>('/api/menu/items', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    updateItem: async (
      id: string,
      data: Partial<{
        categoryId: string;
        name: string;
        description?: string;
        price: number;
        imageUrl?: string;
        isAvailable?: boolean;
      }>
    ): Promise<any> => {
      const res = await this.request<any>(`/api/menu/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    toggleAvailability: async (id: string, isAvailable?: boolean): Promise<any> => {
      const res = await this.request<any>(`/api/menu/items/${id}/availability`, {
        method: 'PATCH',
        body: isAvailable !== undefined ? JSON.stringify({ isAvailable }) : undefined,
      });
      return res.data;
    },
    deleteItem: async (id: string): Promise<any> => {
      const res = await this.request<any>(`/api/menu/items/${id}`, {
        method: 'DELETE',
      });
      return res.data;
    },
  };

  // --- Orders APIs ---
  public orders = {
    place: async (
      tableId: string,
      items: { menuItemId: string; quantity: number; notes?: string }[],
      notes?: string
    ): Promise<Order> => {
      const res = await this.request<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ tableId, items, notes }),
      });
      return res.data;
    },
    getTableOrders: async (tableId: string): Promise<Order[]> => {
      const res = await this.request<any>(`/api/orders/table/${tableId}?includeRecent=true`);
      if (Array.isArray(res.data)) {
        return res.data;
      }
      if (res.data && Array.isArray(res.data.orders)) {
        return res.data.orders;
      }
      return [];
    },
    getTableBill: async (
      tableId: string
    ): Promise<{
      tableId: string;
      orders: Order[];
      totalBill: number;
      items: any[];
    }> => {
      const res = await this.request<any>(
        `/api/orders/table/${tableId}?aggregated=true&includeRecent=true`
      );
      return res.data;
    },
    getKitchen: async (): Promise<Order[]> => {
      const res = await this.request<Order[]>('/api/orders/kitchen');
      return res.data;
    },
    getKitchenOrders: async (): Promise<Order[]> => {
      const res = await this.request<Order[]>('/api/orders/kitchen');
      return res.data;
    },
    getAll: async (status?: OrderStatus, tableId?: string): Promise<Order[]> => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (tableId) params.append('tableId', tableId);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await this.request<Order[]>(`/api/orders${query}`);
      return res.data;
    },
    getById: async (id: string): Promise<Order> => {
      const res = await this.request<Order>(`/api/orders/${id}`);
      return res.data;
    },
    accept: async (id: string): Promise<Order> => {
      const res = await this.request<Order>(`/api/orders/${id}/accept`, {
        method: 'PATCH',
      });
      return res.data;
    },
    reject: async (id: string): Promise<Order> => {
      const res = await this.request<Order>(`/api/orders/${id}/reject`, {
        method: 'PATCH',
      });
      return res.data;
    },
    prepare: async (id: string): Promise<Order> => {
      const res = await this.request<Order>(`/api/orders/${id}/prepare`, {
        method: 'PATCH',
      });
      return res.data;
    },
    ready: async (id: string): Promise<Order> => {
      const res = await this.request<Order>(`/api/orders/${id}/ready`, {
        method: 'PATCH',
      });
      return res.data;
    },
    serve: async (id: string): Promise<Order> => {
      const res = await this.request<Order>(`/api/orders/${id}/serve`, {
        method: 'PATCH',
      });
      return res.data;
    },
    updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
      const res = await this.request<Order>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return res.data;
    },
    complete: async (id: string): Promise<Order> => {
      const res = await this.request<Order>(`/api/orders/${id}/complete`, {
        method: 'PATCH',
      });
      return res.data;
    },
    completeTable: async (tableId: string, status?: TableStatus): Promise<any> => {
      const res = await this.request<any>(`/api/orders/table/${tableId}/complete`, {
        method: 'PATCH',
        body: status ? JSON.stringify({ status }) : undefined,
      });
      return res.data;
    },
  };

  // --- Service Requests APIs ---
  public service = {
    create: async (tableId: string, type: ServiceRequestType): Promise<ServiceRequest> => {
      const res = await this.request<ServiceRequest>('/api/service', {
        method: 'POST',
        body: JSON.stringify({ tableId, type }),
      });
      return res.data;
    },
    getAll: async (status?: ServiceRequestStatus): Promise<ServiceRequest[]> => {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await this.request<ServiceRequest[]>(`/api/service${query}`);
      return res.data;
    },
    updateStatus: async (
      id: string,
      status: ServiceRequestStatus
    ): Promise<ServiceRequest> => {
      const res = await this.request<ServiceRequest>(`/api/service/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return res.data;
    },
  };

  // --- Analytics APIs ---
  public analytics = {
    getDashboard: async (): Promise<DashboardAnalyticsResponse> => {
      const res = await this.request<DashboardAnalyticsResponse>('/api/analytics/dashboard');
      return res.data;
    },
  };
}

export const api = new ApiClient();
export default api;

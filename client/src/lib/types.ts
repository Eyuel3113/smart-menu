export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'PAID_PENDING' | 'CLEANING';

export type PaymentMethod = 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'POS_CARD';
export type PaymentStatus = 'COMPLETED' | 'REFUNDED';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'REJECTED'
  | 'COMPLETED';

export type StaffRole = 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'WAITER';

export type ServiceRequestType = 'CALL_WAITER' | 'REQUEST_BILL';

export type ServiceRequestStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Restaurant {
  id: string;
  name: string;
  currency: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  showReviewShower?: boolean;
  paymentTiming?: 'FINAL' | 'PRE_ORDER';
}

export interface RestaurantBranding {
  id: string;
  name: string;
  currency: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  showReviewShower?: boolean;
  paymentTiming?: 'FINAL' | 'PRE_ORDER';
  updatedAt?: string;
}

export interface Area {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: { tables: number };
}

export interface TableKpis {
  total: number;
  available: number;
  occupied: number;
  paidPending: number;
  cleaning: number;
  billRequested: number;
}

export interface Transaction {
  id: string;
  restaurantId: string;
  tableId: string;
  table?: {
    id: string;
    tableNumber: number;
    area?: { id: string; name: string };
  };
  amount: number | string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  referenceNote?: string | null;
  orderIds: string[];
  itemSnapshot: any;
  settledByStaffId?: string | null;
  createdAt: string;
}

export interface Table {
  id: string;
  restaurantId: string;
  areaId?: string | null;
  area?: { id: string; name: string; sortOrder?: number } | null;
  tableNumber: number;
  capacity: number;
  qrCodeUrl?: string | null;
  secretToken: string;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  transactions?: Transaction[];
  serviceRequests?: ServiceRequest[];
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  items?: MenuItem[];
  _count?: { items: number };
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number | string;
  imageUrl?: string | null;
  isAvailable: boolean;
  category?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem: {
    id: string;
    name: string;
    imageUrl?: string | null;
    price: number | string;
    description?: string | null;
  };
  quantity: number;
  unitPrice: number | string;
  notes?: string | null;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  table?: {
    id: string;
    tableNumber: number;
    status: TableStatus;
    capacity?: number;
    area?: { id: string; name: string } | null;
  };
  status: OrderStatus;
  totalAmount: number | string;
  notes?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequest {
  id: string;
  tableId: string;
  table?: {
    id: string;
    tableNumber: number;
    status: TableStatus;
  };
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
}

export interface TableValidationResponse {
  sessionToken: string;
  table: {
    id: string;
    tableNumber: number;
    status: TableStatus;
    restaurantId: string;
  };
  restaurant: {
    id: string;
    name: string;
    currency: string;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    address?: string | null;
    phone?: string | null;
    showReviewShower?: boolean;
    paymentTiming?: 'FINAL' | 'PRE_ORDER';
  };
}

export interface LoginResponse {
  token: string;
  staff: {
    id: string;
    restaurantId: string;
    restaurantName: string;
    currency: string;
    email: string;
    name: string;
    role: StaffRole;
  };
}

export interface PublicMenuResponse {
  restaurant: {
    id: string;
    name: string;
    currency: string;
  };
  categories: (Category & { items: MenuItem[] })[];
}

export interface DashboardAnalyticsResponse {
  overview: {
    todayGrossRevenue: number;
    todayOrdersCount: number;
    todayCompletedCount: number;
    averageOrderValue: number;
    totalLifetimeRevenue: number;
  };
  tableStats: {
    total: number;
    available: number;
    occupied: number;
    billRequested: number;
    cleaning: number;
  };
  topDishes: {
    id: string;
    name: string;
    imageUrl: string | null;
    count: number;
    totalSales: number;
  }[];
  revenueTrends: {
    date: string;
    revenue: number;
  }[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

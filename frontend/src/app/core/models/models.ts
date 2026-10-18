export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Category {
  id: number;
  name: string;
  kind: 'PHONE' | 'ACCESSORY' | 'PART';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: number;
  category_name: string;
  category_kind: Category['kind'];
  brand: string;
  model_name: string;
  cost_price: number;
  sell_price: number;
  track_imei: boolean;
  stock_qty: number;
  low_stock_threshold: number;
  warranty_days: number;
  is_active: boolean;
  matched_phone_unit_id?: number | null;
  matched_imei?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImportError {
  line: number;
  error: string;
}

export interface ProductImportResult {
  created: number;
  updated: number;
  errors: ProductImportError[];
}

export interface PhoneUnit {
  id: number;
  product: number;
  product_name: string;
  imei: string;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  cost_price: number;
  sell_price: number;
  status: 'IN_STOCK' | 'RESERVED' | 'SOLD' | 'RETURNED';
  purchased_at: string;
  supplier: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  phone_unit: number | null;
  phone_imei: string | null;
  quantity_change: number;
  reason: string;
  reference: string;
  note: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  notes: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  product: number;
  phone_unit: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
  warranty_until: string | null;
  imei?: string;
}

export interface Sale {
  customer_name?: string;
  change_due?: number;
  id: number;
  number: string;
  customer: number | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: 'CASH' | 'CARD' | 'TRANSFER';
  amount_paid: number;
  paid_total: number;
  balance: number;
  status: 'COMPLETED' | 'VOIDED';
  notes: string;
  items: SaleItem[];
  created_at: string;
  updated_at: string;
}

export interface SaleCreate {
  items: Array<{ product_id: number; phone_unit_id?: number; quantity: number; unit_price: number }>;
  customer_id: number | null;
  discount: number;
  payment_method: Sale['payment_method'];
  amount_paid: number;
}

export interface RepairPart {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
}

export interface RepairTicket {
  warranty_until?: string | null;
  id: number;
  number: string;
  customer: number;
  device_brand: string;
  device_model: string;
  imei: string;
  issue_description: string;
  accessories_left: string;
  status: 'RECEIVED' | 'DIAGNOSING' | 'WAITING_PARTS' | 'IN_REPAIR' | 'READY' | 'DELIVERED' | 'CANCELLED';
  estimated_cost: number;
  labor_cost: number;
  deposit_paid: number;
  amount_paid: number;
  parts_total: number;
  total: number;
  balance: number;
  received_at: string;
  promised_date: string | null;
  completed_at: string | null;
  delivered_at: string | null;
  technician_notes: string;
  warranty_days: number;
  parts: RepairPart[];
  created_at: string;
  updated_at: string;
}

export interface SalePayment {
  id: number;
  sale: number;
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER';
  paid_at: string;
  note: string;
}

export interface Expense {
  id: number;
  date: string;
  label: string;
  amount: number;
  category: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface ShopSettings {
  id: number;
  shop_name: string;
  address: string;
  phone: string;
  currency_symbol: string;
  country_dial_code: string;
  receipt_footer_fr: string;
  receipt_footer_ar: string;
  default_language: 'fr' | 'ar';
  created_at: string;
  updated_at: string;
}

export interface DeviceHistory {
  phone_unit: {id:number; imei:string; product:{id:number;name:string;sku:string};status:PhoneUnit['status'];purchased_at:string} | null;
  sales: Array<{ id:number; number: string; date: string; customer: string | null; price: number; warranty_until: string | null }>;
  repairs: Array<{ id:number; number: string; status: string; received_at: string; delivered_at: string | null; warranty_days: number }>;
  warranty: {
    active: boolean;
    ends_on: string | null;
    source: 'sale' | 'repair' | null;
  };
}

export interface CustomerStatement {
  sales: Sale[];
  repairs: RepairTicket[];
  customer: Customer;
  unpaid_sales: Sale[];
  payments: SalePayment[];
}

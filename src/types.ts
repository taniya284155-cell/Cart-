/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'seller' | 'delivery' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isTwoFactorEnabled?: boolean;
  isVerified?: boolean;
}

export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  address: string;
  isApproved: boolean;
  rating: number;
}

export interface DeliveryPartnerProfile {
  id: string;
  userId: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber: string;
  isOnline: boolean;
  isApproved: boolean;
  currentLocation: { lat: number; lng: number };
  walletBalance: number;
  rating: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size: M, Color: Blue"
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerStoreName: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number; // For discount display
  images: string[];
  variants: ProductVariant[];
  stock: number;
  rating: number;
  reviewCount: number;
  specifications: { [key: string]: string };
  isApproved: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  discountAmount: number;
  couponCode?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod: 'UPI' | 'Card' | 'Wallet' | 'COD';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  status: OrderStatus;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryOTP?: string;
  createdAt: string;
  updatedAt: string;
  returnReason?: string;
  refundAmount?: number;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isModerated: boolean;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

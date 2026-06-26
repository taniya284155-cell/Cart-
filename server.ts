/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, 
  SellerProfile, 
  DeliveryPartnerProfile, 
  Product, 
  Order, 
  Review, 
  Coupon, 
  WalletTransaction, 
  ChatMessage, 
  OrderStatus 
} from "./src/types";

// DB file path
const DB_PATH = path.join(process.cwd(), "database.json");

// Helper interface for DB schema
interface DatabaseSchema {
  users: User[];
  sellers: SellerProfile[];
  deliveryPartners: DeliveryPartnerProfile[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  walletTransactions: WalletTransaction[];
  chatMessages: ChatMessage[];
  systemSettings: {
    allowAutoAssign: boolean;
    deliveryFeePerKm: number;
    platformCommissionPercent: number;
  };
}

// Initial seed data
const SEED_DATA: DatabaseSchema = {
  users: [
    { id: "u-cust-1", email: "customer@example.com", name: "Alex Johnson", role: "customer", phone: "+15550199", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true },
    { id: "u-sell-1", email: "seller@example.com", name: "Marcus Sterling", role: "seller", phone: "+15550288", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true },
    { id: "u-delv-1", email: "delivery@example.com", name: "Ryder Swift", role: "delivery", phone: "+15550377", avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true },
    { id: "u-adm-1", email: "admin@example.com", name: "Sloane Administrator", role: "admin", phone: "+15550466", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true },
    { id: "u-super-1", email: "superadmin@example.com", name: "Genevieve Chief", role: "superadmin", phone: "+15550555", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true }
  ],
  sellers: [
    { id: "s-1", userId: "u-sell-1", storeName: "Apex Tech & Lifestyle", description: "Your premium hub for high-performance gadgets and custom wear.", logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=80&h=80&q=80", bannerUrl: "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=800&h=200&q=80", address: "742 Evergreen Terrace, Tech District", isApproved: true, rating: 4.8 }
  ],
  deliveryPartners: [
    { id: "dp-1", userId: "u-delv-1", vehicleType: "bike", vehicleNumber: "BIKE-2026-X", isOnline: true, isApproved: true, currentLocation: { lat: 37.7749, lng: -122.4194 }, walletBalance: 150.00, rating: 4.9 }
  ],
  products: [
    {
      id: "p-1",
      sellerId: "s-1",
      sellerStoreName: "Apex Tech & Lifestyle",
      name: "Nebula Sound X Pro Headphones",
      description: "State-of-the-art hybrid active noise cancellation with 45-hour battery lifespan, spatial audio precision, and water-resistant materials.",
      category: "Electronics",
      brand: "Nebula",
      price: 299,
      originalPrice: 349,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&h=400&q=80"
      ],
      variants: [
        { id: "v-1-1", name: "Matte Black", price: 299, stock: 15, sku: "NEB-SND-BLK" },
        { id: "v-1-2", name: "Titanium Silver", price: 319, stock: 8, sku: "NEB-SND-SLV" }
      ],
      stock: 23,
      rating: 4.7,
      reviewCount: 4,
      specifications: { "Driver Unit": "40mm Beryllium", "Bluetooth Version": "5.3", "Codec": "LDAC, AAC", "Weight": "250g" },
      isApproved: true,
      isFeatured: true,
      isBestSeller: true
    },
    {
      id: "p-2",
      sellerId: "s-1",
      sellerStoreName: "Apex Tech & Lifestyle",
      name: "Aeroglide Carbon Road Running Shoes",
      description: "Propulsive carbon fiber plates paired with dual-density foam midsoles. Engineered specifically for high-tempo training and long distance running.",
      category: "Apparel",
      brand: "Aeroglide",
      price: 140,
      originalPrice: 175,
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=400&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&h=400&q=80"
      ],
      variants: [
        { id: "v-2-1", name: "Size: 9 / Crimson Red", price: 140, stock: 12, sku: "AERO-SH-9R" },
        { id: "v-2-2", name: "Size: 10 / Crimson Red", price: 140, stock: 14, sku: "AERO-SH-10R" },
        { id: "v-2-3", name: "Size: 11 / Stealth Black", price: 145, stock: 5, sku: "AERO-SH-11B" }
      ],
      stock: 31,
      rating: 4.9,
      reviewCount: 3,
      specifications: { "Midsole": "Aerofoam Duo", "Plate": "Curved Carbon Fiber", "Drop": "8mm", "Weight": "210g" },
      isApproved: true,
      isFeatured: true,
      isBestSeller: false
    },
    {
      id: "p-3",
      sellerId: "s-1",
      sellerStoreName: "Apex Tech & Lifestyle",
      name: "Nomad Leather Travel Duffle",
      description: "Full-grain vegetable-tanned leather duffle bag with a separate ventilated shoe compartment, heavy-duty brass zippers, and quick-access passport pockets.",
      category: "Apparel",
      brand: "Nomad Goods",
      price: 189,
      originalPrice: 189,
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&h=400&q=80"
      ],
      variants: [
        { id: "v-3-1", name: "Tan Brown", price: 189, stock: 6, sku: "NOM-DFL-BRN" },
        { id: "v-3-2", name: "Charcoal Black", price: 199, stock: 4, sku: "NOM-DFL-BLK" }
      ],
      stock: 10,
      rating: 4.5,
      reviewCount: 2,
      specifications: { "Material": "Full-grain Leather", "Volume": "45 Liters", "Hardware": "Solid Brass", "Strap": "Detachable Wool Padded" },
      isApproved: true,
      isFeatured: false,
      isBestSeller: false
    },
    {
      id: "p-4",
      sellerId: "s-1",
      sellerStoreName: "Apex Tech & Lifestyle",
      name: "Lumina Intelligent Ambient Lamp",
      description: "WiFi-connected adaptive smart lamp featuring seamless circadian cycle programming, 16 million colors, and voice integration with modern home hubs.",
      category: "Home & Living",
      brand: "Lumina Labs",
      price: 69,
      originalPrice: 89,
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&h=400&q=80"
      ],
      variants: [],
      stock: 45,
      rating: 4.6,
      reviewCount: 1,
      specifications: { "Power": "12W LED", "Max Brightness": "800 Lumens", "Connectivity": "WiFi 2.4Ghz", "Height": "32cm" },
      isApproved: true,
      isFeatured: false,
      isBestSeller: true
    },
    {
      id: "p-5",
      sellerId: "s-1",
      sellerStoreName: "Apex Tech & Lifestyle",
      name: "Matcha Ceremony Reserve Set",
      description: "Direct-from-Uji ceremonial grade matcha tin accompanied by a hand-carved golden bamboo whisk (Chasen), traditional ceramic bowl (Chawan), and fine sifter.",
      category: "Groceries",
      brand: "Uji Gardens",
      price: 34,
      originalPrice: 39,
      images: [
        "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&h=400&q=80"
      ],
      variants: [],
      stock: 120,
      rating: 4.8,
      reviewCount: 3,
      specifications: { "Origin": "Uji, Kyoto, Japan", "Matcha Grade": "Ceremonial Grade AAA", "Tin Weight": "40g", "Whisk tines": "100-prong" },
      isApproved: true,
      isFeatured: false,
      isBestSeller: false
    }
  ],
  orders: [
    {
      id: "ord-1001",
      customerId: "u-cust-1",
      customerName: "Alex Johnson",
      items: [
        {
          id: "oi-1",
          productId: "p-1",
          productName: "Nebula Sound X Pro Headphones",
          productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400&q=80",
          variantId: "v-1-1",
          variantName: "Matte Black",
          price: 299,
          quantity: 1
        }
      ],
      totalAmount: 304,
      deliveryCharge: 5,
      discountAmount: 0,
      shippingAddress: {
        fullName: "Alex Johnson",
        street: "235 Pine Lane, Apartment 4B",
        city: "San Francisco",
        state: "CA",
        zipCode: "94104",
        phone: "+15550199"
      },
      paymentMethod: "UPI",
      paymentStatus: "Paid",
      status: "Delivered",
      deliveryPartnerId: "dp-1",
      deliveryPartnerName: "Ryder Swift",
      deliveryOTP: "5512",
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "ord-1002",
      customerId: "u-cust-1",
      customerName: "Alex Johnson",
      items: [
        {
          id: "oi-2",
          productId: "p-2",
          productName: "Aeroglide Carbon Road Running Shoes",
          productImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=400&q=80",
          variantId: "v-2-1",
          variantName: "Size: 9 / Crimson Red",
          price: 140,
          quantity: 1
        }
      ],
      totalAmount: 145,
      deliveryCharge: 5,
      discountAmount: 0,
      shippingAddress: {
        fullName: "Alex Johnson",
        street: "235 Pine Lane, Apartment 4B",
        city: "San Francisco",
        state: "CA",
        zipCode: "94104",
        phone: "+15550199"
      },
      paymentMethod: "Wallet",
      paymentStatus: "Paid",
      status: "Shipped",
      deliveryPartnerId: "dp-1",
      deliveryPartnerName: "Ryder Swift",
      deliveryOTP: "8920",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ],
  reviews: [
    { id: "r-1", productId: "p-1", customerId: "u-cust-1", customerName: "Alex Johnson", rating: 5, comment: "Absolutely marvelous build quality. Active Noise Cancellation feels like a vault. Highly recommend standard Matte Black flavor!", isVerifiedPurchase: true, isModerated: true, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "r-2", productId: "p-2", customerId: "u-cust-1", customerName: "Alex Johnson", rating: 5, comment: "I feel like I'm sailing forward. Carbon sole is snappy. Fit is true to size.", isVerifiedPurchase: true, isModerated: true, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  coupons: [
    { code: "MEGA50", discountType: "fixed", discountValue: 50, minOrderAmount: 200, expiryDate: "2027-12-31", isActive: true },
    { code: "SAVE15", discountType: "percentage", discountValue: 15, minOrderAmount: 50, expiryDate: "2027-12-31", isActive: true }
  ],
  walletTransactions: [
    { id: "wt-1", userId: "u-cust-1", amount: 500, type: "credit", description: "Initial Load", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "wt-2", userId: "u-cust-1", amount: 145, type: "debit", description: "Payment Order ord-1002", createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: "wt-3", userId: "u-delv-1", amount: 150, type: "credit", description: "Delivery Payoff & Tips", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  chatMessages: [
    { id: "m-1", senderId: "u-cust-1", senderName: "Alex Johnson", receiverId: "u-sell-1", message: "Hi! Does the Matte Black model ship with a carrying case included?", createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: "m-2", senderId: "u-sell-1", senderName: "Marcus Sterling", receiverId: "u-cust-1", message: "Hello! Yes, it comes with an EVA hardcase and a braided USB-C cable.", createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() }
  ],
  systemSettings: {
    allowAutoAssign: true,
    deliveryFeePerKm: 1.5,
    platformCommissionPercent: 10
  }
};

// Database read/write helpers
function readDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw) as DatabaseSchema;
    }
  } catch (err) {
    console.error("DB reading failed, using seeds", err);
  }
  // Write seed data if not present
  writeDB(SEED_DATA);
  return SEED_DATA;
}

function writeDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("DB writing failed", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware to auto-seed / load database on request
  app.use((req, res, next) => {
    // Ensuring file exists and is populated
    readDB();
    next();
  });

  // -------------------------------------------------------------
  // API ROUTING
  // -------------------------------------------------------------

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Database Reset Endpoint (for testing/cleanup)
  app.post("/api/reset", (req, res) => {
    writeDB(SEED_DATA);
    res.json({ message: "Database re-seeded successfully." });
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email.trim().toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: "Invalid email or credentials." });
    }
    // Simulation: accept any login to match flexible preview, assigning the matched user
    res.json({ 
      token: `simulated-jwt-token-for-${user.id}`,
      user 
    });
  });

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { name, email, phone, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "Name, email, and role are required fields." });
    }

    const db = readDB();
    const existing = db.users.find(u => u.email === email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "A user with this email address already exists." });
    }

    const newUserId = `u-gen-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name,
      email: email.trim().toLowerCase(),
      phone: phone || "",
      role: role as any,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
      isVerified: true
    };

    db.users.push(newUser);

    // Bootstrap profiles depending on roles
    if (role === 'seller') {
      const storeId = `s-gen-${Date.now()}`;
      db.sellers.push({
        id: storeId,
        userId: newUserId,
        storeName: `${name}'s Store`,
        description: "Your brand new store waiting to showcase items.",
        logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=80&h=80&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=800&h=200&q=80",
        address: "E-Commerce Market Hub, Main St",
        isApproved: false, // Needs Admin approval
        rating: 5.0
      });
    } else if (role === 'delivery') {
      const driverId = `dp-gen-${Date.now()}`;
      db.deliveryPartners.push({
        id: driverId,
        userId: newUserId,
        vehicleType: "bike",
        vehicleNumber: `DRV-${Date.now().toString().slice(-4)}`,
        isOnline: true,
        isApproved: false, // Needs Admin approval
        currentLocation: { lat: 37.7749, lng: -122.4194 },
        walletBalance: 0,
        rating: 5.0
      });
    }

    writeDB(db);
    res.status(201).json({
      token: `simulated-jwt-token-for-${newUserId}`,
      user: newUser
    });
  });

  // Products: Get All with Filters
  app.get("/api/products", (req, res) => {
    const { category, search, sellerId, sort } = req.query;
    const db = readDB();
    let list = db.products;

    if (category && category !== "All") {
      list = list.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (search) {
      const query = (search as string).toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    if (sellerId) {
      list = list.filter(p => p.sellerId === sellerId);
    }

    // Apply sorting
    if (sort === 'price-low') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }

    res.json(list);
  });

  // Products: Create
  app.post("/api/products", (req, res) => {
    const { sellerId, name, description, category, brand, price, originalPrice, stock, variants, specifications, images } = req.body;
    
    if (!sellerId || !name || !price || stock === undefined) {
      return res.status(400).json({ error: "Missing required product fields." });
    }

    const db = readDB();
    const seller = db.sellers.find(s => s.userId === sellerId || s.id === sellerId);
    if (!seller) {
      return res.status(400).json({ error: "Valid seller profile not found." });
    }

    const newProduct: Product = {
      id: `p-gen-${Date.now()}`,
      sellerId: seller.id,
      sellerStoreName: seller.storeName,
      name,
      description,
      category: category || "General",
      brand: brand || "Generic",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&h=400&q=80"],
      variants: variants || [],
      stock: Number(stock),
      rating: 5.0,
      reviewCount: 0,
      specifications: specifications || {},
      isApproved: seller.isApproved ? true : false, // Auto-approve if seller is approved, otherwise admin moderated
    };

    db.products.push(newProduct);
    writeDB(db);
    res.status(201).json(newProduct);
  });

  // Products: Bulk Upload Simulator (CSV/JSON style)
  app.post("/api/products/bulk", (req, res) => {
    const { sellerId, products } = req.body;
    if (!sellerId || !Array.isArray(products)) {
      return res.status(400).json({ error: "Seller ID and array of products required." });
    }
    const db = readDB();
    const seller = db.sellers.find(s => s.userId === sellerId || s.id === sellerId);
    if (!seller) {
      return res.status(400).json({ error: "Valid seller profile not found." });
    }

    const imported: Product[] = [];
    products.forEach((p, idx) => {
      const newProduct: Product = {
        id: `p-gen-${Date.now()}-${idx}`,
        sellerId: seller.id,
        sellerStoreName: seller.storeName,
        name: p.name || "Bulk Product " + idx,
        description: p.description || "No description provided.",
        category: p.category || "General",
        brand: p.brand || "Generic",
        price: Number(p.price || 99),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        images: p.images || ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&h=400&q=80"],
        variants: p.variants || [],
        stock: Number(p.stock || 10),
        rating: 5.0,
        reviewCount: 0,
        specifications: p.specifications || {},
        isApproved: true
      };
      db.products.push(newProduct);
      imported.push(newProduct);
    });

    writeDB(db);
    res.json({ message: `Successfully imported ${imported.length} products.`, products: imported });
  });

  // Products: Update Stock / Inventory
  app.patch("/api/products/:id/stock", (req, res) => {
    const { stock } = req.body;
    if (stock === undefined) {
      return res.status(400).json({ error: "Stock quantity required." });
    }
    const db = readDB();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    product.stock = Number(stock);
    writeDB(db);
    res.json(product);
  });

  // Coupons: Validate
  app.get("/api/coupons/validate", (req, res) => {
    const { code, amount } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    const db = readDB();
    const coupon = db.coupons.find(c => c.code.toUpperCase() === (code as string).toUpperCase() && c.isActive);
    
    if (!coupon) {
      return res.status(400).json({ error: "Invalid or expired coupon code." });
    }

    const orderAmount = Number(amount || 0);
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ error: `Coupon requires a minimum order amount of $${coupon.minOrderAmount}.` });
    }

    res.json(coupon);
  });

  // Wallet: Get Balance & Transactions
  app.get("/api/wallet/:userId", (req, res) => {
    const db = readDB();
    const txs = db.walletTransactions.filter(t => t.userId === req.params.userId);
    const balance = txs.reduce((acc, t) => {
      return t.type === 'credit' ? acc + t.amount : acc - t.amount;
    }, 0);
    res.json({ balance, transactions: txs });
  });

  // Wallet: Add Balance
  app.post("/api/wallet/:userId/load", (req, res) => {
    const { amount, paymentMethod } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "A positive load amount is required." });
    }

    const db = readDB();
    const transaction: WalletTransaction = {
      id: `wt-gen-${Date.now()}`,
      userId: req.params.userId,
      amount: Number(amount),
      type: 'credit',
      description: `Loaded funds via ${paymentMethod || 'Credit Card'}`,
      createdAt: new Date().toISOString()
    };

    db.walletTransactions.push(transaction);
    writeDB(db);
    res.json(transaction);
  });

  // Wallet: Request Withdrawal (for Sellers & Drivers)
  app.post("/api/wallet/:userId/withdraw", (req, res) => {
    const { amount, bankDetails } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "A positive withdrawal amount is required." });
    }

    const db = readDB();
    // Compute current balance
    const txs = db.walletTransactions.filter(t => t.userId === req.params.userId);
    const balance = txs.reduce((acc, t) => t.type === 'credit' ? acc + t.amount : acc - t.amount, 0);

    if (balance < amount) {
      return res.status(400).json({ error: "Insufficient wallet funds available for withdrawal." });
    }

    const transaction: WalletTransaction = {
      id: `wt-gen-${Date.now()}`,
      userId: req.params.userId,
      amount: Number(amount),
      type: 'debit',
      description: `Withdrawal Request to bank: ${bankDetails || 'Default Account'} (Status: Processing)`,
      createdAt: new Date().toISOString()
    };

    db.walletTransactions.push(transaction);
    writeDB(db);
    res.json({ message: "Withdrawal request received and is being processed.", transaction });
  });

  // Orders: Place Order
  app.post("/api/orders", (req, res) => {
    const { customerId, customerName, items, totalAmount, discountAmount, couponCode, shippingAddress, paymentMethod } = req.body;
    
    if (!customerId || !items || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ error: "Incomplete order specifications." });
    }

    const db = readDB();

    // Verify stock and deduct
    for (const item of items) {
      const product = db.products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productName} no longer exists.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Only ${product.stock} left.` });
      }
      product.stock -= item.quantity;
    }

    // Auto-assign delivery partner if online and verified
    const availableDriver = db.deliveryPartners.find(d => d.isOnline && d.isApproved);
    const driverUser = availableDriver ? db.users.find(u => u.id === availableDriver.userId) : null;

    // Check if wallet payment is used and verify funds
    if (paymentMethod === "Wallet") {
      const txs = db.walletTransactions.filter(t => t.userId === customerId);
      const balance = txs.reduce((acc, t) => t.type === 'credit' ? acc + t.amount : acc - t.amount, 0);
      if (balance < totalAmount) {
        return res.status(400).json({ error: "Insufficient wallet funds. Please top up or use COD / UPI." });
      }

      // Deduct funds from customer wallet
      db.walletTransactions.push({
        id: `wt-gen-${Date.now()}-pay`,
        userId: customerId,
        amount: Number(totalAmount),
        type: 'debit',
        description: `Paid for Order placement`,
        createdAt: new Date().toISOString()
      });
    }

    const orderId = `ord-${1000 + db.orders.length + 1}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Delivery validation OTP

    const newOrder: Order = {
      id: orderId,
      customerId,
      customerName,
      items,
      totalAmount: Number(totalAmount),
      deliveryCharge: 5.00,
      discountAmount: Number(discountAmount || 0),
      couponCode,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      status: 'Pending',
      deliveryPartnerId: availableDriver?.id,
      deliveryPartnerName: driverUser?.name || "Auto assigning Partner...",
      deliveryOTP: otp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.orders.push(newOrder);
    writeDB(db);

    res.status(201).json(newOrder);
  });

  // Orders: Get list for specific Customer, Seller, or Delivery Partner
  app.get("/api/orders", (req, res) => {
    const { customerId, sellerId, deliveryPartnerId } = req.query;
    const db = readDB();
    let list = db.orders;

    if (customerId) {
      list = list.filter(o => o.customerId === customerId);
    } else if (deliveryPartnerId) {
      list = list.filter(o => o.deliveryPartnerId === deliveryPartnerId);
    } else if (sellerId) {
      // Return orders containing products from this seller
      list = list.filter(o => 
        o.items.some(item => {
          const prod = db.products.find(p => p.id === item.productId);
          return prod && prod.sellerId === sellerId;
        })
      );
    }

    res.json(list);
  });

  // Orders: Update status
  app.patch("/api/orders/:id/status", (req, res) => {
    const { status, otp, returnReason } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Order status is required." });
    }

    const db = readDB();
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Verify OTP if driver delivers order
    if (status === "Delivered" && order.deliveryPartnerId) {
      if (otp && order.deliveryOTP && order.deliveryOTP !== otp.trim()) {
        return res.status(400).json({ error: "Invalid verification OTP. Delivery authorization failed." });
      }
      order.paymentStatus = 'Paid'; // Handover implies complete payment
      
      // Credit driver wallet with delivery payoff
      const driver = db.deliveryPartners.find(dp => dp.id === order.deliveryPartnerId);
      if (driver) {
        db.walletTransactions.push({
          id: `wt-driver-${Date.now()}`,
          userId: driver.userId,
          amount: 5.00, // Fixed delivery commission
          type: 'credit',
          description: `Delivery payout for order ${order.id}`,
          createdAt: new Date().toISOString()
        });
      }

      // Credit Seller account with order revenue minus 10% system commission
      order.items.forEach(item => {
        const product = db.products.find(p => p.id === item.productId);
        if (product) {
          const sellerProfile = db.sellers.find(s => s.id === product.sellerId);
          if (sellerProfile) {
            const itemEarnings = (item.price * item.quantity) * 0.9; // 10% commission
            db.walletTransactions.push({
              id: `wt-seller-${Date.now()}`,
              userId: sellerProfile.userId,
              amount: itemEarnings,
              type: 'credit',
              description: `Sales revenue for order ${order.id} (Commission applied)`,
              createdAt: new Date().toISOString()
            });
          }
        }
      });
    }

    if (status === "Returned") {
      order.returnReason = returnReason || "No specific reason provided.";
    }

    order.status = status as OrderStatus;
    order.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(order);
  });

  // Reviews: Submit review
  app.post("/api/reviews", (req, res) => {
    const { productId, customerId, customerName, rating, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: "Product rating and feedback comment are required." });
    }

    const db = readDB();
    const product = db.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const isVerified = db.orders.some(o => 
      o.customerId === customerId && 
      o.status === "Delivered" && 
      o.items.some(i => i.productId === productId)
    );

    const newReview: Review = {
      id: `r-gen-${Date.now()}`,
      productId,
      customerId: customerId || "u-guest",
      customerName: customerName || "Anonymous Customer",
      rating: Number(rating),
      comment,
      isVerifiedPurchase: isVerified,
      isModerated: true, // Auto moderated as approved for display ease
      createdAt: new Date().toISOString()
    };

    db.reviews.push(newReview);

    // Re-calculate product ratings average
    const prodReviews = db.reviews.filter(r => r.productId === productId);
    const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    product.rating = Number(avg.toFixed(1));
    product.reviewCount = prodReviews.length;

    writeDB(db);
    res.status(201).json(newReview);
  });

  // Reviews: Get list for specific product
  app.get("/api/reviews/:productId", (req, res) => {
    const db = readDB();
    const list = db.reviews.filter(r => r.productId === req.params.productId && r.isModerated);
    res.json(list);
  });

  // Chats: Retrieve messages thread between two users
  app.get("/api/chat/thread", (req, res) => {
    const { userA, userB } = req.query;
    if (!userA || !userB) {
      return res.status(400).json({ error: "Both userA and userB are required." });
    }

    const db = readDB();
    const thread = db.chatMessages.filter(m => 
      (m.senderId === userA && m.receiverId === userB) ||
      (m.senderId === userB && m.receiverId === userA)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(thread);
  });

  // Chats: Send message
  app.post("/api/chat", (req, res) => {
    const { senderId, senderName, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: "Missing sender, receiver, or message." });
    }

    const db = readDB();
    const newMessage: ChatMessage = {
      id: `m-gen-${Date.now()}`,
      senderId,
      senderName: senderName || "User",
      receiverId,
      message,
      createdAt: new Date().toISOString()
    };

    db.chatMessages.push(newMessage);
    writeDB(db);
    res.status(201).json(newMessage);
  });

  // ADMIN: Get Dashboard Analytics overview
  app.get("/api/admin/analytics", (req, res) => {
    const db = readDB();
    
    const totalSales = db.orders
      .filter(o => o.status === "Delivered")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const platformEarnings = totalSales * 0.10; // 10% platform fee

    const activeCustomers = db.users.filter(u => u.role === 'customer').length;
    const activeSellers = db.sellers.length;
    const activeDrivers = db.deliveryPartners.length;

    res.json({
      revenue: totalSales,
      platformEarnings,
      orderCount: db.orders.length,
      customerCount: activeCustomers,
      sellerCount: activeSellers,
      driverCount: activeDrivers,
      pendingProductApprovals: db.products.filter(p => !p.isApproved).length,
      pendingSellerApprovals: db.sellers.filter(s => !s.isApproved).length
    });
  });

  // ADMIN: Get Sellers and approve/reject
  app.get("/api/admin/sellers", (req, res) => {
    const db = readDB();
    res.json(db.sellers);
  });

  app.patch("/api/admin/sellers/:id/approve", (req, res) => {
    const { approve } = req.body;
    const db = readDB();
    const seller = db.sellers.find(s => s.id === req.params.id);
    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found." });
    }
    seller.isApproved = !!approve;
    writeDB(db);
    res.json(seller);
  });

  // ADMIN: Get Drivers and approve/reject
  app.get("/api/admin/drivers", (req, res) => {
    const db = readDB();
    res.json(db.deliveryPartners);
  });

  app.patch("/api/admin/drivers/:id/approve", (req, res) => {
    const { approve } = req.body;
    const db = readDB();
    const driver = db.deliveryPartners.find(d => d.id === req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver profile not found." });
    }
    driver.isApproved = !!approve;
    writeDB(db);
    res.json(driver);
  });

  // ADMIN: Approve/Reject Product Listing
  app.patch("/api/admin/products/:id/approve", (req, res) => {
    const { approve } = req.body;
    const db = readDB();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    product.isApproved = !!approve;
    writeDB(db);
    res.json(product);
  });

  // -------------------------------------------------------------
  // VITE & STATIC FILES SERVING (FALLBACK)
  // -------------------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Multi-Vendor Server] Listening on http://localhost:${PORT}`);
  });
}

startServer();

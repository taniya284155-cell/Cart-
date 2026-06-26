/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Product, Order, WalletTransaction, ChatMessage } from '../types';
import { 
  Plus, Upload, Shield, Layers, FileText, Check, CheckCircle2, ChevronRight, MessageSquare, 
  Wallet, DollarSign, Package, ShoppingBag, Send, AlertCircle, X, Edit2, RotateCcw
} from 'lucide-react';

interface SellerViewProps {
  currentUser: User;
  products: Product[];
  orders: Order[];
  fetchProducts: () => void;
  fetchOrders: () => void;
}

export const SellerView: React.FC<SellerViewProps> = ({
  currentUser,
  products,
  orders,
  fetchProducts,
  fetchOrders
}) => {
  // Navigation tabs: 'dashboard', 'products', 'orders', 'chat'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'chat'>('dashboard');

  // Wallet and withdrawal
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTxs, setWalletTxs] = useState<WalletTransaction[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawErr, setWithdrawErr] = useState('');

  // Seller store info
  const [storeProfile, setStoreProfile] = useState<any>(null);

  // New Product Form
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    brand: '',
    price: '',
    originalPrice: '',
    stock: '',
    variants: [] as { name: string; price: number; stock: number; sku: string }[],
    specifications: {} as { [key: string]: string },
    images: [] as string[]
  });
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newVarStock, setNewVarStock] = useState('');
  const [newVarSku, setNewVarSku] = useState('');

  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const [imageUrl, setImageUrl] = useState('');

  const [formErr, setFormErr] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Bulk Import Form
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkErr, setBulkErr] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  // Chat/Messaging
  const [activeChatCustId, setActiveChatCustId] = useState<string | null>(null);
  const [activeChatCustName, setActiveChatCustName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [allThreads, setAllThreads] = useState<{ id: string; name: string }[]>([]);

  // Load Wallet details
  const fetchWallet = async () => {
    try {
      const res = await fetch(`/api/wallet/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
        setWalletTxs(data.transactions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Find Seller Profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/admin/sellers');
      if (res.ok) {
        const list = await res.json();
        const found = list.find((s: any) => s.userId === currentUser.id);
        setStoreProfile(found);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchProfile();
  }, [currentUser.id]);

  // Load chat threads lists
  useEffect(() => {
    // Collect unique customer ids from orders or server chat history simulation
    const uniqueThreads = [
      { id: 'u-cust-1', name: 'Alex Johnson' }
    ];
    setAllThreads(uniqueThreads);
  }, [orders]);

  // Active Chat thread
  useEffect(() => {
    let interval: any;
    if (activeChatCustId) {
      const getChat = () => {
        fetch(`/api/chat/thread?userA=${currentUser.id}&userB=${activeChatCustId}`)
          .then(res => res.json())
          .then(data => setChatMessages(data))
          .catch(e => console.error(e));
      };
      getChat();
      interval = setInterval(getChat, 3000);
    }
    return () => clearInterval(interval);
  }, [activeChatCustId, currentUser.id]);

  // Add Product Variant
  const handleAddVariant = () => {
    if (!newVarName || !newVarPrice || !newVarStock) return;
    setNewProduct(prev => ({
      ...prev,
      variants: [...prev.variants, {
        name: newVarName,
        price: Number(newVarPrice),
        stock: Number(newVarStock),
        sku: newVarSku || `SKU-${Date.now().toString().slice(-4)}`
      }]
    }));
    setNewVarName('');
    setNewVarPrice('');
    setNewVarStock('');
    setNewVarSku('');
  };

  // Add specification
  const handleAddSpec = () => {
    if (!specKey || !specValue) return;
    setNewProduct(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [specKey]: specValue
      }
    }));
    setSpecKey('');
    setSpecValue('');
  };

  // Add image URL
  const handleAddImage = () => {
    if (!imageUrl) return;
    setNewProduct(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }));
    setImageUrl('');
  };

  // Submit product creation
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    setFormSuccess(false);

    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      setFormErr('Product name, price, and initial stock are mandatory fields.');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: currentUser.id,
          name: newProduct.name,
          description: newProduct.description,
          category: newProduct.category,
          brand: newProduct.brand,
          price: Number(newProduct.price),
          originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
          stock: Number(newProduct.stock),
          variants: newProduct.variants,
          specifications: newProduct.specifications,
          images: newProduct.images
        })
      });

      if (res.ok) {
        setFormSuccess(true);
        setNewProduct({
          name: '',
          description: '',
          category: 'Electronics',
          brand: '',
          price: '',
          originalPrice: '',
          stock: '',
          variants: [],
          specifications: {},
          images: []
        });
        setIsAddingProduct(false);
        fetchProducts();
      } else {
        const err = await res.json();
        setFormErr(err.error || 'Server rejected product submission.');
      }
    } catch (e) {
      setFormErr('Connection failed.');
    }
  };

  // Submit withdrawal
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErr('');
    setWithdrawMsg('');

    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    if (Number(withdrawAmount) > walletBalance) {
      setWithdrawErr('Withdrawal amount cannot exceed available balance.');
      return;
    }

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(withdrawAmount), bankDetails })
      });

      if (res.ok) {
        setWithdrawMsg('Withdrawal processed and dispatched to bank pipeline.');
        setWithdrawAmount('');
        setBankDetails('');
        fetchWallet();
      } else {
        const err = await res.json();
        setWithdrawErr(err.error || 'Could not process withdrawal.');
      }
    } catch (e) {
      setWithdrawErr('Connection error.');
    }
  };

  // Submit bulk upload JSON
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkErr('');
    setBulkSuccess('');

    try {
      const parsed = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsed)) {
        setBulkErr('JSON content must be a valid array of product configurations.');
        return;
      }

      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: currentUser.id,
          products: parsed
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBulkSuccess(data.message || 'Bulk products imported successfully.');
        setBulkJsonText('');
        fetchProducts();
      } else {
        const err = await res.json();
        setBulkErr(err.error || 'Invalid bulk payload rejected by backend.');
      }
    } catch (e) {
      setBulkErr('Failed to parse text as valid JSON. Ensure schema brackets match.');
    }
  };

  // Process order state ("Packed", "Shipped")
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send message chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !activeChatCustId) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: storeProfile?.storeName || currentUser.name,
          receiverId: activeChatCustId,
          message: newChatMessage.trim()
        })
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages(prev => [...prev, msg]);
        setNewChatMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter products for this seller
  const sellerProducts = products.filter(p => p.sellerId === storeProfile?.id);
  
  // Filter orders for this seller
  const sellerOrders = orders.filter(o => 
    o.items.some(item => {
      const p = products.find(prod => prod.id === item.productId);
      return p && p.sellerId === storeProfile?.id;
    })
  );

  // Compute stats
  const totalSalesRevenue = sellerOrders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => {
      const itemsCost = o.items
        .filter(item => {
          const p = products.find(prod => prod.id === item.productId);
          return p && p.sellerId === storeProfile?.id;
        })
        .reduce((s, item) => s + (item.price * item.quantity), 0);
      return sum + itemsCost;
    }, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Seller Portal Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-100 py-3.5 px-4 sticky top-[53px] z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-950 p-2 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                {storeProfile?.storeName || 'Merchant Console'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Store ID: <span className="text-slate-300 font-bold">{storeProfile?.id || 's-pending'}</span> • Status:{' '}
                <span className={`font-bold ${storeProfile?.isApproved ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {storeProfile?.isApproved ? 'Approved & Live' : 'Pending Verification'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('dashboard'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Console Home
            </button>
            <button
              onClick={() => { setActiveTab('products'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                activeTab === 'products' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              My Inventory
            </button>
            <button
              onClick={() => { setActiveTab('orders'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer relative ${
                activeTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Incoming Orders
              {sellerOrders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                  {sellerOrders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('chat'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                activeTab === 'chat' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Client Chat
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Wallet Balance</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">${walletBalance.toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-600 mt-1">✓ Secured by escrow ledger</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Dispatched Sales</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">${totalSalesRevenue.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">After 10% commission fee</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Products Listed</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">{sellerProducts.length}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{sellerProducts.filter(p => !p.isApproved).length} pending approval</p>
                </div>
                <div className="bg-sky-50 p-2.5 rounded-xl text-sky-600">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Active Orders</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {sellerOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Pending delivery partner verification</p>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Wallet Withdrawal section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Withdraw Store Revenue</h3>
                  <p className="text-xs text-slate-400 mt-1">Submit a payment disbursement request to transfer your wallet balance to your bank account.</p>
                </div>

                <form onSubmit={handleWithdrawal} className="mt-5 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1">Amount ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1">Bank Routing & Account Details</label>
                    <input
                      type="text"
                      required
                      placeholder="Chase Bank Routing: XXXXX, Acct: XXXXX"
                      value={bankDetails}
                      onChange={(e) => setBankDetails(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {withdrawErr && (
                    <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{withdrawErr}</span>
                    </div>
                  )}

                  {withdrawMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{withdrawMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Request Disbursement
                  </button>
                </form>
              </div>

              {/* Security Escrow explanation & policies */}
              <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-200 text-sm tracking-tight">Security & Settlement Escrow Policy</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    To prevent fraud and maintain strict adherence to user-oriented refunds, our multi-vendor platform implements an automatic 14-day escrow block on high-value digital orders.
                  </p>
                  <div className="space-y-3 mt-4 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex justify-between">
                      <span className="text-slate-400">Escrow standard:</span>
                      <span className="font-bold text-amber-500">14 Days</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex justify-between">
                      <span className="text-slate-400">Withdrawal speed:</span>
                      <span className="font-bold text-amber-500">2-4 Business Days</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[10px] font-mono mt-4 text-center text-slate-500">
                  APEX TRANSACTION AUDIT LOG: v1.0.2 SECURE
                </div>
              </div>

            </div>

          </div>
        )}

        {/* INVENTORY MANAGEMENT TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-950">Active Store Catalog</h3>
                <p className="text-xs text-slate-400 mt-1">Upload products, edit variants, manage stock quantities, or bulk upload catalog configurations.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Bulk Upload</span>
                </button>
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>List New Product</span>
                </button>
              </div>
            </div>

            {/* List products in custom table style */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono font-bold uppercase tracking-wider">
                      <th className="p-4">Product Details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 font-mono">Price</th>
                      <th className="p-4 font-mono">In Stock</th>
                      <th className="p-4">Approval Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sellerProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 flex items-center gap-3">
                          <img src={p.images[0]} className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                          <div>
                            <span className="font-bold text-slate-800 block line-clamp-1">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">SKU: {p.id}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-600">{p.category}</td>
                        <td className="p-4 font-bold font-mono text-slate-900">${p.price}</td>
                        <td className="p-4 font-mono">
                          <span className={`font-bold ${p.stock <= 5 ? 'text-rose-500' : 'text-slate-700'}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border uppercase ${
                            p.isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {p.isApproved ? 'Approved' : 'Pending Moderation'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                const newStock = prompt('Enter new stock quantity:', String(p.stock));
                                if (newStock !== null) {
                                  const parsed = parseInt(newStock);
                                  if (!isNaN(parsed)) {
                                    fetch(`/api/products/${p.id}/stock`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ stock: parsed })
                                    }).then(res => { if (res.ok) fetchProducts(); });
                                  }
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Update stock volume"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {sellerProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-mono italic">
                          No items listed in your store catalogue yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* INCOMING ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950">Consolidated Order Requests</h3>
              <p className="text-xs text-slate-400 mt-1">Review received customer orders, print packing labels, and coordinate handover with courier agents.</p>
            </div>

            <div className="space-y-4">
              {sellerOrders.map((order) => {
                const isPending = order.status === 'Pending';
                const isConfirmed = order.status === 'Confirmed';
                const isPacked = order.status === 'Packed';
                const isShipped = order.status === 'Shipped';
                const isCompleted = order.status === 'Delivered';
                const isCancelled = order.status === 'Cancelled';

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 py-3 px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 font-medium">
                        <span className="text-slate-400">Order ID: <span className="font-mono font-bold text-slate-800">{order.id}</span></span>
                        <span className="text-slate-400">Recipient: <span className="font-bold text-slate-800">{order.shippingAddress.fullName}</span></span>
                        <span className="text-slate-400">Date: <span className="font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</span></span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold border uppercase ${
                        isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isCancelled ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="divide-y divide-slate-100 flex-1 w-full max-w-xl">
                        {order.items
                          .filter(item => {
                            const p = products.find(prod => prod.id === item.productId);
                            return p && p.sellerId === storeProfile?.id;
                          })
                          .map((item) => (
                            <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs font-medium">
                              <div className="flex items-center gap-3">
                                <img src={item.productImage} className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                                <div>
                                  <h4 className="font-bold text-slate-800">{item.productName}</h4>
                                  <p className="text-[10px] text-slate-400">Qty: {item.quantity} {item.variantName ? `(${item.variantName})` : ''}</p>
                                </div>
                              </div>
                              <span className="font-bold font-mono text-slate-900">${item.price * item.quantity}</span>
                            </div>
                          ))}
                      </div>

                      {/* Action buttons to advance logistics */}
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {isPending && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Confirmed')}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer flex-1 md:flex-none"
                          >
                            Accept Order
                          </button>
                        )}
                        {isConfirmed && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Packed')}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-2 px-3 rounded-lg text-xs cursor-pointer flex-1 md:flex-none"
                          >
                            Mark Packed
                          </button>
                        )}
                        {isPacked && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer flex-1 md:flex-none"
                          >
                            Dispatch (Handover)
                          </button>
                        )}
                        {!isCompleted && !isCancelled && !isShipped && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-2 px-3 rounded-lg text-xs border border-rose-100 cursor-pointer flex-1 md:flex-none"
                          >
                            Cancel Order
                          </button>
                        )}

                        {isShipped && (
                          <span className="text-[11px] text-slate-400 font-mono italic">In courier transit</span>
                        )}
                        {isCompleted && (
                          <span className="text-[11px] text-emerald-600 font-mono font-bold flex items-center gap-1">✓ Completed</span>
                        )}
                        {isCancelled && (
                          <span className="text-[11px] text-rose-600 font-mono font-bold flex items-center gap-1">✕ Cancelled</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {sellerOrders.length === 0 && (
                <div className="p-12 bg-white border border-slate-200 text-center rounded-2xl">
                  <p className="text-slate-400 text-sm font-mono italic">No customer orders received yet.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* CLIENT CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
            
            {/* Sidebar list of active customer conversations */}
            <div className="border-r border-slate-200 bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wide block mb-3">Customer Chats</span>
              <div className="space-y-1.5">
                {allThreads.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      setActiveChatCustId(th.id);
                      setActiveChatCustName(th.name);
                    }}
                    className={`w-full p-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      activeChatCustId === th.id
                        ? 'bg-amber-100 text-slate-900 border border-amber-200'
                        : 'bg-white hover:bg-slate-100 border border-slate-100 text-slate-600'
                    }`}
                  >
                    <span>{th.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Main Chat thread */}
            <div className="md:col-span-2 flex flex-col justify-between p-4 bg-white h-full">
              {activeChatCustId ? (
                <>
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-850">{activeChatCustName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Prospect Client Thread</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md">Online</span>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[300px]">
                    {chatMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-slate-400 mb-0.5">{msg.senderName}</span>
                          <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                            isMe 
                              ? 'bg-slate-900 text-slate-100 rounded-br-none shadow-sm' 
                              : 'bg-slate-100 text-slate-850 rounded-bl-none border border-slate-200'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono mt-0.5">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Reply to client query..."
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex-1 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      className="bg-slate-950 hover:bg-slate-850 text-white rounded-xl p-2.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-24 flex-1">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-400 text-xs italic font-mono">Select a client conversation thread from the sidebar.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* FORM MODAL: LIST NEW PRODUCT */}
      {isAddingProduct && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 mb-4">
              <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <span>List New Marketplace Item</span>
              </h3>
              <button onClick={() => setIsAddingProduct(false)} className="p-1 hover:bg-slate-50 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apollo Smartwatch X"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize key benefits, battery lifespan, warranties..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Groceries">Groceries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Market Price ($) *</label>
                  <input
                    type="number"
                    required
                    placeholder="250"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Base Inventory Stock *</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              {/* Sub Images Url creator */}
              <div>
                <label className="block text-slate-500 mb-1">Add Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-lg cursor-pointer"
                  >
                    Add Photo
                  </button>
                </div>
                {newProduct.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newProduct.images.map((img, idx) => (
                      <span key={idx} className="bg-slate-100 px-2 py-1 rounded-md text-[10px] flex items-center gap-1">
                        <span className="truncate max-w-[150px]">{img}</span>
                        <button type="button" onClick={() => setNewProduct(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="text-rose-500">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Specs Builder */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="block font-bold text-slate-700 mb-2">Specifications Key-Values</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Property (e.g. Weight)"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 240g)"
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-lg cursor-pointer"
                  >
                    Include Spec
                  </button>
                </div>
                {Object.keys(newProduct.specifications).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(newProduct.specifications).map(([k, v]) => (
                      <div key={k} className="bg-white p-2 rounded-md border border-slate-100 flex items-center justify-between text-[11px]">
                        <span>{k}: <strong>{v}</strong></span>
                        <button type="button" onClick={() => {
                          const updated = { ...newProduct.specifications };
                          delete updated[k];
                          setNewProduct({ ...newProduct, specifications: updated });
                        }} className="text-rose-500">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              {formErr && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formErr}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-5 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  List Active Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL SHEET */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-4">
              <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-1.5">
                <Upload className="w-5 h-5 text-amber-500" />
                <span>Bulk CSV/JSON Import</span>
              </h3>
              <button onClick={() => setIsBulkImportOpen(false)} className="p-1 hover:bg-slate-50 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wide block">Paste Bulk Products JSON Array:</span>
              <textarea
                rows={10}
                required
                value={bulkJsonText}
                onChange={(e) => setBulkJsonText(e.target.value)}
                placeholder={`[
  {
    "name": "Super Speaker Delta",
    "description": "High bass waterproof speaker",
    "category": "Electronics",
    "brand": "Delta",
    "price": 120,
    "stock": 50
  }
]`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-hidden"
              />

              {bulkErr && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{bulkErr}</span>
                </div>
              )}

              {bulkSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{bulkSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkImportOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Parse & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

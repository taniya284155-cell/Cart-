/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Order, User, Coupon, Review, ChatMessage } from '../types';
import { 
  Search, ShoppingCart, Heart, MapPin, Tag, Star, ArrowRight, Check, CheckCircle2, 
  MessageSquare, User as UserIcon, Wallet, ChevronRight, X, Clock, Package, Truck, 
  Plus, Minus, ArrowUpRight, Send, AlertCircle, FileText
} from 'lucide-react';

interface CustomerViewProps {
  currentUser: User;
  products: Product[];
  orders: Order[];
  onOrderPlaced: () => void;
  fetchOrders: () => void;
  fetchProducts: () => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  currentUser,
  products,
  orders,
  onOrderPlaced,
  fetchOrders,
  fetchProducts
}) => {
  // Navigation & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Cart State
  const [cart, setCart] = useState<{ product: Product; variant: any; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  
  // Checkout Details
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: currentUser.name,
    street: '235 Pine Lane, Apartment 4B',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94104',
    phone: currentUser.phone || '+15550199'
  });
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Wallet' | 'COD'>('UPI');
  const [checkoutError, setCheckoutError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Wishlist State
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadAmount, setLoadAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  // Reviews States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Chat Panel State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatSellerId, setActiveChatSellerId] = useState<string | null>(null);
  const [activeChatStoreName, setActiveChatStoreName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Tabs for Customer panel
  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'wallet'>('shop');

  // Categories list
  const categories = ['All', 'Electronics', 'Apparel', 'Home & Living', 'Groceries'];

  // Load Wallet
  const fetchWallet = async () => {
    try {
      const res = await fetch(`/api/wallet/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [currentUser.id]);

  // Load reviews when product is clicked
  useEffect(() => {
    if (selectedProduct) {
      fetch(`/api/reviews/${selectedProduct.id}`)
        .then(res => res.json())
        .then(data => setReviews(data))
        .catch(err => console.error(err));
      // Auto select first variant if exists
      if (selectedProduct.variants && selectedProduct.variants.length > 0) {
        setSelectedVariant(selectedProduct.variants[0]);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [selectedProduct]);

  // Load Chat messages
  useEffect(() => {
    let interval: any;
    if (isChatOpen && activeChatSellerId) {
      const getChat = () => {
        fetch(`/api/chat/thread?userA=${currentUser.id}&userB=${activeChatSellerId}`)
          .then(res => res.json())
          .then(data => setChatMessages(data))
          .catch(e => console.error(e));
      };
      getChat();
      interval = setInterval(getChat, 3000);
    }
    return () => clearInterval(interval);
  }, [isChatOpen, activeChatSellerId, currentUser.id]);

  // Wallet load submit
  const handleLoadWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadAmount || Number(loadAmount) <= 0) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(loadAmount), paymentMethod: 'Card' })
      });
      if (res.ok) {
        await fetchWallet();
        setLoadAmount('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWalletLoading(false);
    }
  };

  // Chat send message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !activeChatSellerId) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId: activeChatSellerId,
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

  // Add review
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          customerId: currentUser.id,
          customerName: currentUser.name,
          rating: newRating,
          comment: newComment
        })
      });
      if (res.ok) {
        const addedReview = await res.json();
        setReviews(prev => [addedReview, ...prev]);
        setNewComment('');
        setNewRating(5);
        fetchProducts(); // Refresh average rating
      } else {
        const err = await res.json();
        setReviewError(err.error || 'Could not post review.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setAppliedCoupon(null);
    const subtotal = cart.reduce((sum, item) => sum + (item.variant ? item.variant.price : item.product.price) * item.quantity, 0);
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode.trim()}&amount=${subtotal}`);
      if (res.ok) {
        const coupon = await res.json();
        setAppliedCoupon(coupon);
      } else {
        const err = await res.json();
        setCouponError(err.error || 'Invalid coupon.');
      }
    } catch (err) {
      setCouponError('Network error verifying coupon.');
    }
  };

  // Add to Cart
  const addToCart = (product: Product, variant: any) => {
    const existing = cart.find(item => item.product.id === product.id && (!variant || item.variant?.id === variant.id));
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id && (!variant || item.variant?.id === variant.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, variant, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  // Toggle wishlist
  const toggleWishlist = (pId: string) => {
    if (wishlist.includes(pId)) {
      setWishlist(wishlist.filter(id => id !== pId));
    } else {
      setWishlist([...wishlist, pId]);
    }
  };

  // Calculate Cart Pricing
  const subtotal = cart.reduce((sum, item) => sum + (item.variant ? item.variant.price : item.product.price) * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 5.00 : 0;
  const discount = appliedCoupon 
    ? (appliedCoupon.discountType === 'percentage' 
        ? (subtotal * appliedCoupon.discountValue / 100) 
        : appliedCoupon.discountValue)
    : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

  // Submit Checkout
  const handlePlaceOrder = async () => {
    setCheckoutError('');
    if (paymentMethod === 'Wallet' && walletBalance < grandTotal) {
      setCheckoutError('Insufficient wallet balance. Please add funds first.');
      return;
    }

    const orderItems = cart.map(c => ({
      productId: c.product.id,
      productName: c.product.name,
      productImage: c.product.images[0],
      variantId: c.variant?.id,
      variantName: c.variant?.name,
      price: c.variant ? c.variant.price : c.product.price,
      quantity: c.quantity
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          customerName: currentUser.name,
          items: orderItems,
          totalAmount: grandTotal,
          discountAmount: discount,
          couponCode: appliedCoupon?.code,
          shippingAddress,
          paymentMethod
        })
      });

      if (res.ok) {
        const created = await res.json();
        setOrderSuccess(created.id);
        setCart([]);
        setAppliedCoupon(null);
        setCouponCode('');
        setIsCartOpen(false);
        setIsCheckingOut(false);
        onOrderPlaced();
        fetchWallet();
        fetchProducts(); // Refresh remaining stock levels
      } else {
        const err = await res.json();
        setCheckoutError(err.error || 'Failed to place order.');
      }
    } catch (err) {
      setCheckoutError('Network error placing order.');
    }
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return p.isApproved && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Banner / Header Bar */}
      <div className="bg-emerald-600 text-white py-3 px-4 text-xs font-semibold flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 animate-bounce" />
          <span>Use coupon <span className="underline font-mono">MEGA50</span> for flat $50 off on orders above $200! Or <span className="underline font-mono">SAVE15</span> for 15% off!</span>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-200" /> Deliver to: <span className="font-bold">San Francisco, 94104</span></span>
        </div>
      </div>

      {/* Customer Sub Navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sticky top-[53px] z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Internal Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 md:border-0 pb-2 md:pb-0">
            <button
              onClick={() => { setActiveTab('shop'); setSelectedProduct(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'shop' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Shop Gallery
            </button>
            <button
              onClick={() => { setActiveTab('orders'); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold relative transition-colors cursor-pointer ${
                activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Orders
              {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold animate-pulse">
                  {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('wallet'); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'wallet' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet (${walletBalance.toFixed(2)})</span>
            </button>
          </div>

          {/* Search Box & Cart Trigger */}
          {activeTab === 'shop' && !selectedProduct && (
            <div className="flex items-center gap-2 flex-1 md:max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search headphones, shoes, matcha, duffle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Cart Icon trigger */}
          <button
            id="btn-customer-cart"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors relative cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="font-semibold">My Cart</span>
            {cart.length > 0 && (
              <span className="bg-emerald-500 text-slate-950 rounded-full font-bold text-xs px-2 py-0.5 ml-1">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <div>
            {!selectedProduct ? (
              <>
                {/* Category Pill Filters */}
                <div className="flex flex-wrap items-center gap-1.5 mb-6">
                  <span className="text-xs font-semibold text-slate-400 font-mono uppercase mr-2 tracking-wide">Category:</span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => {
                    const isWishlisted = wishlist.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        id={`product-${product.id}`}
                        className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col h-full"
                      >
                        <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs hover:bg-white text-slate-600 p-2 rounded-full shadow-xs transition-colors cursor-pointer"
                          >
                            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                          </button>
                          {product.isBestSeller && (
                            <span className="absolute bottom-3 left-3 bg-amber-500 text-slate-950 font-mono font-black uppercase text-[9px] px-2 py-0.5 rounded-md shadow-xs">
                              Best Seller
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>{product.brand}</span>
                              <span className="font-mono text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded-sm">{product.category}</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                              {product.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-slate-950">${product.price}</span>
                                {product.originalPrice && (
                                  <span className="text-xs text-slate-400 line-through">${product.originalPrice}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                                <span className="text-[10px] text-slate-400">({product.reviewCount})</span>
                              </div>
                            </div>

                            <button
                              id={`view-prod-${product.id}`}
                              onClick={() => setSelectedProduct(product)}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                      <p className="text-slate-400 text-sm font-mono">No approved products match your parameters.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* PRODUCT DETAILS MODAL VIEW */
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold mb-6 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to Gallery</span>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Photo Gallery & Actions */}
                  <div>
                    <div className="aspect-video w-full rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedProduct.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {selectedProduct.images.map((img, idx) => (
                          <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <img src={img} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat with seller trigger */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Merchant Partner</p>
                        <p className="text-sm font-bold text-slate-800">{selectedProduct.sellerStoreName}</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveChatSellerId(selectedProduct.sellerId);
                          setActiveChatStoreName(selectedProduct.sellerStoreName);
                          setIsChatOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-100 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat Partner</span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing, Specifications and Buying */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          {selectedProduct.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Brand: {selectedProduct.brand}</span>
                      </div>

                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        {selectedProduct.name}
                      </h2>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-sm font-bold">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span>{selectedProduct.rating}</span>
                        </div>
                        <span className="text-xs text-slate-400">{selectedProduct.reviewCount} customer reviews</span>
                      </div>

                      <div className="mt-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-950">
                            ${selectedVariant ? selectedVariant.price : selectedProduct.price}
                          </span>
                          {selectedProduct.originalPrice && (
                            <span className="text-sm text-slate-400 line-through">${selectedProduct.originalPrice}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Inclusive of all local platform charges and custom handling.</p>
                      </div>

                      <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                        {selectedProduct.description}
                      </p>

                      {/* Product Variants if present */}
                      {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <div className="mt-5">
                          <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wide block mb-2">Select Style / Options:</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.variants.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => setSelectedVariant(v)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                  selectedVariant?.id === v.id
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {v.name} (${v.price})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Specifications List */}
                      {Object.keys(selectedProduct.specifications).length > 0 && (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wide block mb-3">Technical Specifications:</span>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                              <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col">
                                <span className="font-semibold text-slate-400">{key}</span>
                                <span className="text-slate-800 font-medium mt-0.5">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stock Alert & Add to Cart button */}
                    <div className="mt-8 pt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3 text-xs font-mono">
                        <span>Availability:</span>
                        <span className={selectedProduct.stock > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                          {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock} items)` : 'Out of Stock'}
                        </span>
                      </div>

                      <button
                        id="btn-add-to-cart"
                        onClick={() => addToCart(selectedProduct, selectedVariant)}
                        disabled={selectedProduct.stock <= 0}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add selected to cart</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* REVIEWS SECTION */}
                <div className="mt-12 pt-8 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Customer Reviews & Ratings</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Review Form */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-fit">
                      <h4 className="text-sm font-bold text-slate-800 mb-4">Post Your Feedback</h4>
                      <form onSubmit={handleAddReview} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Rating</label>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() => setNewRating(star)}
                                className="cursor-pointer"
                              >
                                <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Review Message</label>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            required
                            rows={3}
                            placeholder="Help other users by sharing your experience..."
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {reviewError && (
                          <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{reviewError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Submit Review
                        </button>
                      </form>
                    </div>

                    {/* List Reviews */}
                    <div className="lg:col-span-2 space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{r.customerName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {r.isVerifiedPurchase && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 italic leading-relaxed">
                            "{r.comment}"
                          </p>
                        </div>
                      ))}

                      {reviews.length === 0 && (
                        <p className="text-slate-400 text-xs italic font-mono text-center py-8">Be the first to review this product!</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* MY ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Orders History</h2>
            
            <div className="space-y-4">
              {orders.filter(o => o.customerId === currentUser.id).map((order) => {
                const isCompleted = order.status === 'Delivered';
                const isCancelled = order.status === 'Cancelled';
                
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 py-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        <span className="text-slate-400">Order ID: <span className="font-mono font-bold text-slate-800">{order.id}</span></span>
                        <span className="text-slate-400">Date: <span className="font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</span></span>
                        <span className="text-slate-400">Payment: <span className="font-bold text-slate-800">{order.paymentMethod} ({order.paymentStatus})</span></span>
                      </div>
                      
                      {/* Order Status Badge */}
                      <span className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] uppercase border ${
                        isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isCancelled ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <img src={item.productImage} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                              <div>
                                <h4 className="text-sm font-bold text-slate-800">{item.productName}</h4>
                                <p className="text-xs text-slate-400">
                                  {item.variantName ? `${item.variantName} • ` : ''} Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900">${item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total and Shipping summary */}
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                        <div className="max-w-md">
                          <p className="font-bold text-slate-400 uppercase font-mono tracking-wide text-[9px] mb-1">Shipping Destination:</p>
                          <p className="text-slate-700 font-medium leading-tight">
                            {order.shippingAddress.fullName} • {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 font-medium">Grand Total: <span className="text-base font-bold text-slate-950 ml-1">${order.totalAmount}</span></p>
                        </div>
                      </div>

                      {/* Live delivery tracking visualization */}
                      {!isCancelled && (
                        <div className="mt-5 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <Truck className="w-4 h-4 animate-bounce text-emerald-600" />
                              <span>Live Transit Logistics Tracking</span>
                            </span>
                            {order.deliveryOTP && !isCompleted && (
                              <span className="bg-slate-900 text-white font-mono text-xs px-2.5 py-1 rounded-md">
                                Delivery OTP: <span className="font-black text-amber-400 tracking-wider">{order.deliveryOTP}</span>
                              </span>
                            )}
                          </div>

                          {/* Progression steps */}
                          <div className="grid grid-cols-4 gap-2 relative mt-4">
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                            
                            {[
                              { label: 'Pending', activeStatuses: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'] },
                              { label: 'Packed', activeStatuses: ['Packed', 'Shipped', 'Out for Delivery', 'Delivered'] },
                              { label: 'Shipped', activeStatuses: ['Shipped', 'Out for Delivery', 'Delivered'] },
                              { label: 'Delivered', activeStatuses: ['Delivered'] }
                            ].map((step, idx) => {
                              const isActive = step.activeStatuses.includes(order.status);
                              return (
                                <div key={idx} className="z-10 flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                                    isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    {isActive ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                  </div>
                                  <span className={`text-[10px] font-bold mt-1.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Courier partner details */}
                          {order.deliveryPartnerName && (
                            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-medium">
                              <span>Courier Executive: <span className="font-bold text-slate-900">{order.deliveryPartnerName}</span></span>
                              <span>Target: <span className="underline">Standard Delivery Zone 1</span></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {orders.filter(o => o.customerId === currentUser.id).length === 0 && (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                  <p className="text-slate-400 text-sm font-mono">You haven't placed any orders yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Wallet Overview & Loader */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Available balance</span>
                <p className="text-4xl font-black text-slate-950 font-mono">${walletBalance.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-2">Instantly pay during checkout without relying on credit card approval loops.</p>
              </div>

              <form onSubmit={handleLoadWallet} className="mt-6 space-y-4">
                <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wide block">Add Funds Instantly:</span>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    value={loadAmount}
                    onChange={(e) => setLoadAmount(e.target.value)}
                    placeholder="100.00"
                    min="1"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={walletLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {walletLoading ? 'Processing Payment...' : 'Load Wallet'}
                </button>
              </form>
            </div>

            {/* Wallet Usage Benefits info */}
            <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="font-extrabold text-base text-emerald-300 tracking-tight">Apex Wallet Privileges</h3>
                <p className="text-xs text-emerald-200/80 leading-relaxed mt-2">
                  When checking out with the Apex Wallet, order processing commission is fully waived, and refunds are instantly returned back to your ledger in case of cancellation.
                </p>
                <ul className="text-xs text-emerald-100/90 space-y-2 mt-4 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant checkout</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No transaction fees</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Secured ledger guarantees</li>
                </ul>
              </div>
              <div className="bg-emerald-900/60 p-3 rounded-lg border border-emerald-800/80 text-[10px] font-mono mt-4">
                SECURE END-TO-END CRYPTO-VALIDATED LEDGER
              </div>
            </div>

            {/* Quick Wallet transaction records placeholder logic (could load from state ledger) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Secured Ledger Transactions</h3>
              <div className="flex-1 overflow-y-auto space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-700">Initial Setup Load</p>
                    <p className="text-[10px] text-slate-400">Completed Sandbox Ledger</p>
                  </div>
                  <span className="font-bold font-mono text-emerald-600">+$500.00</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-700">Order ord-1002 Payment</p>
                    <p className="text-[10px] text-slate-400">Deducted Wallet Checkout</p>
                  </div>
                  <span className="font-bold font-mono text-rose-500">-$145.00</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* SECURED CHECKOUT PROCESS SHEET */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-1.5">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <span>Secure Shopping Bag</span>
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart contents listing */}
              <div className="divide-y divide-slate-100 py-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <img src={item.product.images[0]} className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.product.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.variant ? item.variant.name : 'Standard'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 bg-slate-50 border border-slate-100 rounded-md w-fit px-1.5 py-0.5">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                setCart(cart.map((c, i) => i === idx ? { ...c, quantity: c.quantity - 1 } : c));
                              } else {
                                setCart(cart.filter((c, i) => i !== idx));
                              }
                            }}
                            className="text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-800 font-mono">{item.quantity}</span>
                          <button
                            onClick={() => {
                              setCart(cart.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1 } : c));
                            }}
                            className="text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      ${(item.variant ? item.variant.price : item.product.price) * item.quantity}
                    </span>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 text-xs font-mono">Your shopping cart is currently empty.</p>
                  </div>
                )}
              </div>

              {/* Coupon code logic */}
              {cart.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs flex-1 uppercase font-mono tracking-wider focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                  {couponError && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-emerald-600 text-[10px] mt-1 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Coupon applied successfully: -${discount} off!</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Calculations & Checkout action */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-4 mt-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono">${subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Charges</span>
                    <span className="font-mono">${deliveryFee}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promo Discount</span>
                      <span className="font-mono">-${discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Grand Total</span>
                    <span className="font-mono text-base">${grandTotal}</span>
                  </div>
                </div>

                {!isCheckingOut ? (
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl mt-4 text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Secured Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wide">Secured Checkout Fields</h4>
                    
                    {/* Shipping Address Inputs */}
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Recipient Name"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Zip Code"
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Phone number"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>

                    {/* Payment selection */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wide block mb-1.5">Payment Method:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'UPI', label: 'UPI / PhonePe' },
                          { id: 'Card', label: 'Credit/Debit Card' },
                          { id: 'Wallet', label: `Apex Wallet ($${walletBalance})` },
                          { id: 'COD', label: 'Cash on Delivery (COD)' }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                              paymentMethod === m.id
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {checkoutError && (
                      <p className="text-rose-500 text-xs font-semibold p-2.5 bg-rose-50 rounded-lg border border-rose-100 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>{checkoutError}</span>
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCheckingOut(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs flex-1 cursor-pointer"
                      >
                        Back to Bag
                      </button>
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2.5 rounded-xl text-xs flex-1 cursor-pointer shadow-xs"
                      >
                        Place Order (${grandTotal})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAT PANEL SHEET SLIDEOUT */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full flex flex-col justify-between shadow-2xl p-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-md text-emerald-700">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{activeChatStoreName}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Instant Merchant Chat Service</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1">
              {chatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-slate-400 mb-0.5">{msg.senderName}</span>
                    <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                      isMe 
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono mt-0.5">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                );
              })}
              {chatMessages.length === 0 && (
                <div className="py-16 text-center text-slate-400 text-xs italic font-mono">
                  No active conversations. Ask the merchant any pre-sales queries!
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex-1 focus:outline-hidden"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-2.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* POPUP ALERT ORDER PLACED SUCCESSFULLY */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Your order <span className="font-mono font-bold text-slate-800">{orderSuccess}</span> has been dispatched to merchant processing lanes. Track transition stats in 'My Orders'.
            </p>
            <button
              onClick={() => {
                setOrderSuccess(null);
                setActiveTab('orders');
              }}
              className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl mt-5 w-full cursor-pointer"
            >
              Track Order Progress
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

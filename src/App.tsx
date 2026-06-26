/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User, UserRole, Product, Order } from './types';
import { RoleSwitcher } from './components/RoleSwitcher';
import { CustomerView } from './components/CustomerView';
import { SellerView } from './components/SellerView';
import { DeliveryView } from './components/DeliveryView';
import { AdminView } from './components/AdminView';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial catalog & roles
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const list = await res.json();
        setProducts(list);
      }
    } catch (e) {
      console.error("Failed to load products index", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const list = await res.json();
        setOrders(list);
      }
    } catch (e) {
      console.error("Failed to load orders history", e);
    }
  };

  const bootstrapUsers = async () => {
    try {
      // Simulate login for u-cust-1 first to start the tour session gracefully
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'customer@example.com', password: 'password' })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setCurrentRole(data.user.role);
      }

      // Fetch all seed users so we can switch between perspectives easily in the switcher bar
      // By reading seeds directly or mimicking via list
      setAllUsers([
        { id: "u-cust-1", email: "customer@example.com", name: "Alex Johnson", role: "customer", phone: "+15550199", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true },
        { id: "u-sell-1", email: "seller@example.com", name: "Marcus Sterling", role: "seller", phone: "+15550288", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true },
        { id: "u-delv-1", email: "delivery@example.com", name: "Ryder Swift", role: "delivery", phone: "+15550377", avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true },
        { id: "u-adm-1", email: "admin@example.com", name: "Sloane Administrator", role: "admin", phone: "+15550466", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true },
        { id: "u-super-1", email: "superadmin@example.com", name: "Genevieve Chief", role: "superadmin", phone: "+15550555", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80", isVerified: true }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    bootstrapUsers();
  }, []);

  // Syncing / Polling loop for active multi-vendor interactions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts();
      fetchOrders();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Action: Switch User perspective
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
  };

  // Action: System Reset DB (Clear custom sandbox records)
  const handleResetDB = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        await fetchProducts();
        await fetchOrders();
        await bootstrapUsers();
      }
    } catch (e) {
      console.error("System re-seeding failed", e);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 font-mono">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs">Loading E-Commerce Ecosystem Sandbox...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Dynamic Interactive Role Switcher Bar */}
      <RoleSwitcher
        currentRole={currentRole}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onResetDB={handleResetDB}
        isResetting={isResetting}
      />

      {/* Conditional view rendering depending on switched user profile */}
      <div className="flex-1">
        {currentRole === 'customer' && (
          <CustomerView
            currentUser={currentUser}
            products={products}
            orders={orders}
            onOrderPlaced={() => { fetchOrders(); fetchProducts(); }}
            fetchOrders={fetchOrders}
            fetchProducts={fetchProducts}
          />
        )}

        {currentRole === 'seller' && (
          <SellerView
            currentUser={currentUser}
            products={products}
            orders={orders}
            fetchProducts={fetchProducts}
            fetchOrders={fetchOrders}
          />
        )}

        {currentRole === 'delivery' && (
          <DeliveryView
            currentUser={currentUser}
            orders={orders}
            fetchOrders={fetchOrders}
          />
        )}

        {(currentRole === 'admin' || currentRole === 'superadmin') && (
          <AdminView
            currentUser={currentUser}
            products={products}
            orders={orders}
            fetchProducts={fetchProducts}
            fetchOrders={fetchOrders}
          />
        )}
      </div>
    </div>
  );
}

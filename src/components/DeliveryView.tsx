/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Order, WalletTransaction } from '../types';
import { 
  Check, CheckCircle2, Navigation, MapPin, Truck, Shield, DollarSign, Wallet, Clock, 
  Map, User as UserIcon, LogOut, CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';

interface DeliveryViewProps {
  currentUser: User;
  orders: Order[];
  fetchOrders: () => void;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  currentUser,
  orders,
  fetchOrders
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTxs, setWalletTxs] = useState<WalletTransaction[]>([]);

  // Delivery OTP verification form
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);
  const [deliveryOTP, setDeliveryOTP] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Load profile and wallet stats
  const fetchProfileAndStats = async () => {
    try {
      const res = await fetch('/api/admin/drivers');
      if (res.ok) {
        const list = await res.json();
        const found = list.find((d: any) => d.userId === currentUser.id);
        setProfile(found);
        if (found) {
          setIsOnline(found.isOnline);
        }
      }

      const walletRes = await fetch(`/api/wallet/${currentUser.id}`);
      if (walletRes.ok) {
        const data = await walletRes.json();
        setWalletBalance(data.balance);
        setWalletTxs(data.transactions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, [currentUser.id]);

  // Handle Online/Offline Status Switch
  const toggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    // Simulating endpoint persistence by updating the client view
    if (profile) {
      profile.isOnline = nextState;
    }
  };

  // Complete Delivery via Customer Verification OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess(false);

    if (!activeDeliveryId || !deliveryOTP) return;

    try {
      const res = await fetch(`/api/orders/${activeDeliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Delivered', 
          otp: deliveryOTP.trim() 
        })
      });

      if (res.ok) {
        setOtpSuccess(true);
        setDeliveryOTP('');
        setActiveDeliveryId(null);
        fetchOrders();
        fetchProfileAndStats(); // Reload wallet balance after commission payout
      } else {
        const err = await res.json();
        setOtpError(err.error || 'Verification failed. Double check customer delivery code.');
      }
    } catch (e) {
      setOtpError('Logistics connection failed.');
    }
  };

  // Orders currently assigned to this delivery agent
  const assignedOrders = orders.filter(o => o.deliveryPartnerId === profile?.id);
  
  // Active deliveries (not delivered/cancelled)
  const activeDeliveries = assignedOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  
  // Completed delivery history
  const completedHistory = assignedOrders.filter(o => o.status === 'Delivered');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Delivery Dashboard Banner */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-100 py-4 px-4 sticky top-[53px] z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 text-slate-950 p-2.5 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Driver Operations Portal: {currentUser.name}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Vehicle: <span className="text-slate-200 font-bold">{profile?.vehicleNumber || 'Pending'} ({profile?.vehicleType})</span> • Badge:{' '}
                <span className={`font-bold ${profile?.isApproved ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {profile?.isApproved ? 'Verified & Active' : 'Pending Verification'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Online / Offline switch */}
            <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-xs font-bold text-slate-300 font-mono">Status: {isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              <button
                onClick={toggleOnline}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                  isOnline ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>

            <button 
              onClick={fetchProfileAndStats}
              className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh ledger feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* STATS TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Delivery Earnings</span>
              <p className="text-3xl font-black text-slate-950 font-mono mt-0.5">${walletBalance.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-600 mt-1">✓ Instantly spendable in merchant store</p>
            </div>
            <div className="bg-sky-50 text-sky-600 p-3 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Active Cargo Tasks</span>
              <p className="text-3xl font-black text-slate-950 font-mono mt-0.5">{activeDeliveries.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">Requiring OTP verification handover</p>
            </div>
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
              <Navigation className="w-6 h-6 animate-bounce" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Completed Shipments</span>
              <p className="text-3xl font-black text-slate-950 font-mono mt-0.5">{completedHistory.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">Clean courier ledger verification</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ACTIVE COURIER TASKS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              <span>Assigned Consignments</span>
            </h3>

            {activeDeliveries.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Consignment ID</span>
                    <span className="text-sm font-bold font-mono text-slate-800">{order.id}</span>
                  </div>
                  <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                    {order.status}
                  </span>
                </div>

                {/* Shipping Details */}
                <div className="space-y-4 text-xs font-medium">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wide mb-1">Customer Details</p>
                      <p className="font-bold text-slate-850">{order.shippingAddress.fullName}</p>
                      <p className="text-slate-500 mt-0.5">{order.shippingAddress.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wide mb-1">Drop Location</p>
                      <p className="text-slate-700">{order.shippingAddress.street}</p>
                      <p className="text-slate-500 mt-0.5">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                    </div>
                  </div>

                  {/* Consignment Items */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wide block mb-2">Package Items</span>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                          <span className="text-slate-700 font-bold">{item.productName} <span className="text-slate-400 text-[10px] font-normal">x{item.quantity}</span></span>
                          <span className="font-mono text-slate-500 text-[11px]">Fragile Cargo</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complete Handover Action */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-between">
                    <span className="text-[11px] text-slate-500">Ready to drop? Submit the OTP provided by the recipient.</span>
                    <button
                      onClick={() => {
                        setActiveDeliveryId(order.id);
                        setOtpError('');
                      }}
                      className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Complete Handover Verification
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activeDeliveries.length === 0 && (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-mono">No active deliveries pending handover.</p>
              </div>
            )}
          </div>

          {/* HISTORICAL LEDGER SHIPMENTS */}
          <div>
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span>Historical Shipment Logs</span>
            </h3>

            <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
              {completedHistory.map((order) => (
                <div key={order.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-medium">
                  <div>
                    <span className="font-mono font-bold block text-slate-800">{order.id}</span>
                    <span className="text-[10px] text-slate-400 block">{order.shippingAddress.fullName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 font-bold block">+$5.00</span>
                    <span className="text-[9px] text-slate-400 block">Payout Completed</span>
                  </div>
                </div>
              ))}

              {completedHistory.length === 0 && (
                <p className="text-slate-400 text-xs italic font-mono text-center py-6">No historical shipments recorded in this sandbox database.</p>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* OTP SUBMISSION MODAL */}
      {activeDeliveryId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">OTP Consignment Verification</h3>
              <p className="text-xs text-slate-400 mt-1">Enter the 4-digit verification code provided by the customer to complete this delivery.</p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                type="text"
                required
                maxLength={4}
                placeholder="e.g. 5512"
                value={deliveryOTP}
                onChange={(e) => setDeliveryOTP(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center font-mono font-black text-lg tracking-widest focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />

              {otpError && (
                <p className="text-rose-500 text-xs font-semibold p-2 bg-rose-50 rounded-lg text-center flex items-center justify-center gap-1.5 border border-rose-100">
                  <AlertCircle className="w-4 h-4" />
                  <span>{otpError}</span>
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDeliveryId(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex-1 cursor-pointer"
                >
                  Verify Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

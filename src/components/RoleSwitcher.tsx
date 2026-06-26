/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserRole } from '../types';
import { Shield, ShoppingBag, Store, Truck, Crown, RefreshCw } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  currentUser: User | null;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  onResetDB: () => void;
  isResetting: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  currentUser,
  allUsers,
  onSwitchUser,
  onResetDB,
  isResetting
}) => {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'customer': return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'seller': return <Store className="w-4 h-4 text-amber-500" />;
      case 'delivery': return <Truck className="w-4 h-4 text-sky-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-rose-500" />;
      case 'superadmin': return <Crown className="w-4 h-4 text-violet-500" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'customer': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'seller': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'delivery': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'admin': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'superadmin': return 'bg-violet-50 text-violet-700 border-violet-200';
    }
  };

  return (
    <div id="role-switcher-bar" className="bg-slate-900 text-slate-100 border-b border-slate-800 py-3 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-md font-mono text-xs font-bold tracking-widest shadow-inner">
            APEX
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-100">
              E-Commerce Multi-Vendor Ecosystem
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Live Role: <span className="capitalize font-bold text-slate-200">{currentRole}</span> ({currentUser?.name})
            </p>
          </div>
        </div>

        {/* Roles Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono hidden lg:inline mr-1">Switch Perspective:</span>
          <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            {allUsers.map((user) => {
              const isActive = currentUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  id={`btn-switch-${user.role}`}
                  onClick={() => onSwitchUser(user)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {getRoleIcon(user.role)}
                  <span className="capitalize hidden sm:inline">{user.role}</span>
                </button>
              );
            })}
          </div>

          <button
            id="btn-system-reset"
            onClick={onResetDB}
            disabled={isResetting}
            title="Re-seed & restart sample simulation database"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors disabled:opacity-50 ml-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Reset DB</span>
          </button>
        </div>
      </div>
    </div>
  );
};

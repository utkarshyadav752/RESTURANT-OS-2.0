import React, { useState } from 'react';
import { 
  LayoutDashboard, Receipt, Table as TableIcon, ChefHat, 
  ClipboardList, Utensils, Package, FlaskConical, Truck, 
  Trash2, Users, DollarSign, TrendingUp, Settings, 
  LogOut, Bell, Shield, Sparkles, Calendar,
  Menu as MenuIcon, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BranchSwitcher } from './BranchSwitcher.tsx';
import { AICopilotDrawer } from '../ai/AICopilotDrawer.tsx';
import { InteractiveOnboardingWizard } from '../wizard/InteractiveOnboardingWizard.tsx';
import { SpatialBackground3D } from '../3d/SpatialBackground3D.tsx';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isCopilotOpen?: boolean;
  setIsCopilotOpen?: (open: boolean) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<Props> = ({ 
  activeTab, 
  onSelectTab, 
  isCopilotOpen: externalCopilotOpen,
  setIsCopilotOpen: externalSetIsCopilotOpen,
  children 
}) => {
  const { user, restaurant, logout, hasPermission } = useAuth();
  const [internalCopilotOpen, setInternalCopilotOpen] = useState(false);
  const isCopilotOpen = externalCopilotOpen !== undefined ? externalCopilotOpen : internalCopilotOpen;
  const setIsCopilotOpen = externalSetIsCopilotOpen || setInternalCopilotOpen;

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Navigation items with role-based filtering
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, perm: 'reports.view' },
    { id: 'huddle', label: 'Daily Huddle AI', icon: <Sparkles className="w-4 h-4 text-amber-400" />, perm: 'reports.view' },
    { id: 'team', label: 'Staff Progress Tracker', icon: <Users className="w-4 h-4" />, perm: 'reports.view' },
    { id: 'pos', label: 'Smart POS', icon: <Receipt className="w-4 h-4" />, perm: 'orders.create' },
    { id: 'tables', label: 'Floor & Tables', icon: <TableIcon className="w-4 h-4" />, perm: 'orders.view' },
    { id: 'kitchen', label: 'Kitchen (KDS)', icon: <ChefHat className="w-4 h-4" />, perm: 'orders.view' },
    { id: 'orders', label: 'Orders & Billing', icon: <ClipboardList className="w-4 h-4" />, perm: 'payments.view' },
    { id: 'menu', label: 'Menu & Recipes', icon: <FlaskConical className="w-4 h-4" />, perm: 'menu.view' },
    { id: 'inventory', label: 'Inventory Ledger', icon: <Package className="w-4 h-4" />, perm: 'inventory.view' },
    { id: 'purchases', label: 'Purchases & Vendors', icon: <Truck className="w-4 h-4" />, perm: 'inventory.purchase' },
    { id: 'wastage', label: 'Wastage Center', icon: <Trash2 className="w-4 h-4" />, perm: 'inventory.view' },
    { id: 'customers', label: 'Customers CRM', icon: <Users className="w-4 h-4" />, perm: 'reports.view' },
    { id: 'profit', label: 'Profit Intelligence', icon: <DollarSign className="w-4 h-4" />, perm: 'analytics.view' },
    { id: 'forecast', label: 'AI Demand Forecast', icon: <TrendingUp className="w-4 h-4" />, perm: 'ai.view' },
    { id: 'scheduling', label: 'Smart Shift Scheduling', icon: <Calendar className="w-4 h-4 text-emerald-400" />, perm: 'reports.view' },
    { id: 'settings', label: 'Settings & Security', icon: <Settings className="w-4 h-4" />, perm: 'settings.manage' },
  ];

  const notifications = [
    { id: 1, title: 'Low Stock Alert', time: '10m ago', text: 'Farm Plum Tomatoes down to 6.2 kg (Critical)' },
    { id: 2, title: 'Recipe Drift Flag', time: '25m ago', text: 'Boneless chicken consumption +25.3% over recipe BOM' },
    { id: 3, title: 'Tomorrow Purchase Plan', time: '1h ago', text: 'AI recommendation: 22kg Chicken order ready for review' },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col antialiased selection:bg-amber-500/20 selection:text-amber-200">
      
      {/* 3D Spatial Background Canvas (RiskLens Topology) */}
      <SpatialBackground3D opacity={0.35} />

      {/* Top Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-30 sticky top-0 shadow-lg">
        
        {/* Left Brand + Mobile menu trigger + Branch Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>RestaurantOS</span>
                <span className="text-[9px] uppercase font-bold px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {restaurant?.name || 'Zafran Bistro'}
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Multi-Branch Selector */}
          <BranchSwitcher />
        </div>

        {/* Right Action Tools: Role Indicator, AI Copilot, Notifications, Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Active Role Clearance Badge (Strict RBAC - Logout required to change role) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-300 shadow-sm isometric-badge">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline text-slate-400">Role:</span>
            <span>{user?.role}</span>
          </div>

          {/* AI Copilot Drawer Trigger */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="px-3 py-1.5 btn-3d btn-3d-amber rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>AI Copilot</span>
          </button>

          {/* Setup Wizard Trigger */}
          <button
            onClick={() => setIsWizardOpen(true)}
            className="hidden xl:flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl btn-3d btn-3d-slate"
          >
            Wizard Guide
          </button>

          {/* Notifications Drawer Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl card-3d-elevated bg-slate-900 border border-slate-700 shadow-2xl z-50 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                  <span>Operational Notifications</span>
                  <span className="text-[10px] text-amber-400 font-mono">3 Unread</span>
                </div>
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex justify-between text-slate-300 font-semibold mb-0.5">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Distinct Logout Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs overflow-hidden border border-amber-500/30">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0) || 'U'
              )}
            </div>
            <div className="hidden xl:block text-left mr-1">
              <div className="text-xs font-bold text-white leading-tight">{user?.name}</div>
              <div className="text-[10px] text-slate-400 leading-tight">{user?.email}</div>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-3d btn-3d-rose text-xs font-bold cursor-pointer"
              title="Logout session (Strict Login: Logout to let another staff member log in)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className={`w-60 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between py-4 px-3 shrink-0 transition-transform z-20 ${
          isMobileMenuOpen ? 'fixed inset-y-16 left-0 shadow-2xl block' : 'hidden lg:flex'
        }`}>
          <div className="space-y-1 overflow-y-auto pr-1">
            <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
              Restaurant Operations
            </span>
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <span className={`${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom AI Status & Health */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-300">RestaurantOS AI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400">
                Connected to POS recipe consumption & stock ledger.
              </p>
            </div>
          </div>
        </aside>

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>

      {/* Omnipresent AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigateToTab={(tab) => {
          onSelectTab(tab);
          setIsCopilotOpen(false);
        }}
      />

      {/* Interactive Restaurant Onboarding Wizard */}
      <InteractiveOnboardingWizard
        isOpen={isWizardOpen}
        onComplete={() => setIsWizardOpen(false)}
        onSkip={() => setIsWizardOpen(false)}
      />

    </div>
  );
};

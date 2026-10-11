import { createInitialSeedData } from '../../server/data/seed.ts';
import { 
  User, Table, MenuItem, InventoryItem, 
  Order, KOT, WastageEntry, Customer, LoyaltyProgramConfig, 
  WeeklyScheduleData, DailyHuddleData, DemandForecast
} from '../types/index.ts';

const STORAGE_KEY = 'restaurantos_local_db_v2';

export interface LocalDatabase {
  organization: any;
  restaurant: any;
  branches: any[];
  users: User[];
  tables: Table[];
  suppliers: any[];
  inventoryItems: InventoryItem[];
  inventoryBatches: any[];
  menuItems: MenuItem[];
  recipes: any[];
  stockLedger: any[];
  wastageEntries: WastageEntry[];
  activeKOTs: KOT[];
  activeOrders: Order[];
  demandForecasts: DemandForecast[];
  purchaseRecommendations: any[];
  recipeDriftSignals: any[];
  auditLogs: any[];
  activeSessions: any[];
  staffInvitations: any[];
  customers: Customer[];
  loyaltyConfig: LoyaltyProgramConfig;
}

// Initial demo credentials
export const DEMO_CREDENTIALS: Record<string, string> = {
  'owner@restaurantos.io': 'Owner@123',
  'manager@restaurantos.io': 'Manager@123',
  'cashier@restaurantos.io': 'Cashier@123',
  'waiter@restaurantos.io': 'Waiter@123',
  'kitchen@restaurantos.io': 'Kitchen@123',
  'inventory@restaurantos.io': 'Inventory@123',
  'accountant@restaurantos.io': 'Accountant@123',
};

class ClientDataStore {
  private db: LocalDatabase;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): LocalDatabase {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.users && parsed.users.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[RestaurantOS] Error loading local database:', e);
    }

    return this.createFreshDatabase();
  }

  public createFreshDatabase(): LocalDatabase {
    const seed = createInitialSeedData();
    const fresh: LocalDatabase = {
      ...seed,
      customers: [
        {
          id: 'cust_1',
          restaurant_id: seed.restaurant.id,
          name: 'Vikram Malhotra',
          phone: '+91 98111 22334',
          email: 'vikram.m@gmail.com',
          tier: 'GOLD',
          loyalty_points: 950,
          lifetime_points_earned: 1200,
          lifetime_points_redeemed: 250,
          total_spent: 38400,
          visit_count: 18,
          first_visit: '2025-02-10T12:00:00Z',
          last_visit: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          favorite_items: ['Butter Chicken', 'Garlic Naan', 'Dal Makhani'],
          avg_spend_per_visit: 2133,
          days_since_last_visit: 2,
          churn_risk: 'LOW',
          visit_history: [],
          points_ledger: [],
          personalized_discounts: [],
        },
        {
          id: 'cust_2',
          restaurant_id: seed.restaurant.id,
          name: 'Ananya Sharma',
          phone: '+91 98222 33445',
          email: 'ananya.s@outlook.com',
          tier: 'SILVER',
          loyalty_points: 420,
          lifetime_points_earned: 520,
          lifetime_points_redeemed: 100,
          total_spent: 16800,
          visit_count: 9,
          first_visit: '2025-03-01T14:00:00Z',
          last_visit: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          favorite_items: ['Paneer Tikka', 'Virgin Mojito'],
          avg_spend_per_visit: 1866,
          days_since_last_visit: 5,
          churn_risk: 'LOW',
          visit_history: [],
          points_ledger: [],
          personalized_discounts: [],
        },
        {
          id: 'cust_3',
          restaurant_id: seed.restaurant.id,
          name: 'Rohan Mehra',
          phone: '+91 98333 44556',
          email: 'rohan.m@yahoo.com',
          tier: 'PLATINUM',
          loyalty_points: 1650,
          lifetime_points_earned: 2100,
          lifetime_points_redeemed: 450,
          total_spent: 64200,
          visit_count: 26,
          first_visit: '2025-01-20T19:00:00Z',
          last_visit: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          favorite_items: ['Zafran Special Biryani', 'Cocktail Pitcher'],
          avg_spend_per_visit: 2469,
          days_since_last_visit: 1,
          churn_risk: 'LOW',
          visit_history: [],
          points_ledger: [],
          personalized_discounts: [],
        }
      ],
      loyaltyConfig: {
        points_per_rupee: 0.02,
        rupee_per_point_redemption: 1.0,
        min_points_to_redeem: 100,
        welcome_points: 50,
        tier_thresholds: {
          bronze: 0,
          silver: 300,
          gold: 800,
          platinum: 1400,
        },
        tier_multipliers: {
          bronze: 1.0,
          silver: 1.25,
          gold: 1.5,
          platinum: 2.0,
        },
      }
    };

    this.save(fresh);
    return fresh;
  }

  private save(data?: LocalDatabase): void {
    if (data) {
      this.db = data;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      }
    } catch (e) {
      console.warn('[RestaurantOS] Could not persist to localStorage:', e);
    }
  }

  public getDatabase(): LocalDatabase {
    return this.db;
  }

  public resetDatabase(): LocalDatabase {
    return this.createFreshDatabase();
  }

  public extractUserIdFromToken(tokenString?: string | null): string | null {
    if (!tokenString) return null;
    const clean = tokenString.replace(/^Bearer\s+/i, '').trim();
    if (clean.startsWith('token_')) {
      const body = clean.slice('token_'.length);
      const lastUnderscore = body.lastIndexOf('_');
      return lastUnderscore > 0 ? body.slice(0, lastUnderscore) : body;
    }
    return clean || null;
  }

  // --- Router & Request Dispatcher ---
  public handleRequest(method: string, endpoint: string, body?: any, tokenHeader?: string | null): { status: number; data: any } {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cleanUrl = url.replace(/^\/api\/v1/, '').replace(/^\/v1/, '').replace(/^\/api/, '');
    const pathOnly = cleanUrl.split('?')[0];
    const queryString = cleanUrl.includes('?') ? cleanUrl.split('?')[1] : '';
    const params = new URLSearchParams(queryString);

    // ==========================================
    // 1. AUTHENTICATION & SESSION ENDPOINTS
    // ==========================================

    if (pathOnly === '/auth/login' && method === 'POST') {
      const { identifier, password } = body || {};
      if (!identifier || !password) {
        return { status: 400, data: { error: 'Please enter your email or phone and password.' } };
      }

      const cleanIdent = identifier.trim().toLowerCase();
      const user = this.db.users.find(u => 
        u.email.toLowerCase() === cleanIdent || 
        u.mobile.replace(/\s+/g, '') === identifier.replace(/\s+/g, '')
      );

      if (!user) {
        return { status: 401, data: { error: 'Invalid email/phone or password.' } };
      }

      const expectedPassword = DEMO_CREDENTIALS[user.email] || 'Pass@1234';
      if (password !== expectedPassword && password !== 'demo' && password !== 'Admin@123' && password !== 'Pass@1234') {
        return { status: 401, data: { error: 'Invalid email/phone or password.' } };
      }

      // Check 2FA
      if (user.is_2fa_enabled && (user.role === 'OWNER' || user.role === 'ACCOUNTANT')) {
        return {
          status: 200,
          data: {
            requires_2fa: true,
            user_id: user.id,
            email: user.email,
            mobile: user.mobile,
            message: 'Two-factor authentication required. Demo code: 123456.',
          }
        };
      }

      user.last_login_at = new Date().toISOString();
      this.save();

      return {
        status: 200,
        data: {
          token: `token_${user.id}_${Date.now()}`,
          user,
          organization: this.db.organization,
          restaurant: this.db.restaurant,
          branches: this.db.branches,
        }
      };
    }

    if (pathOnly === '/auth/verify-2fa' && method === 'POST') {
      const { userId, code } = body || {};
      const user = this.db.users.find(u => u.id === userId) || this.db.users[0];
      if (!code || (code !== '123456' && code.length !== 6)) {
        return { status: 400, data: { error: 'Invalid 2FA code. Demo code is 123456.' } };
      }

      user.last_login_at = new Date().toISOString();
      this.save();

      return {
        status: 200,
        data: {
          token: `token_${user.id}_${Date.now()}`,
          user,
          organization: this.db.organization,
          restaurant: this.db.restaurant,
          branches: this.db.branches,
        }
      };
    }

    if (pathOnly === '/auth/send-otp' && method === 'POST') {
      const { phone } = body || {};
      if (!phone || phone.length < 8) {
        return { status: 400, data: { error: 'Please enter a valid mobile number.' } };
      }
      return {
        status: 200,
        data: {
          success: true,
          message: `OTP sent successfully to ${phone}. Demo testing code: 123456`,
          expires_in_seconds: 120,
          demo_otp: '123456',
        }
      };
    }

    if (pathOnly === '/auth/verify-otp' && method === 'POST') {
      const { phone, otp } = body || {};
      if (!phone || !otp) {
        return { status: 400, data: { error: 'Phone and OTP are required.' } };
      }
      if (otp !== '123456') {
        return { status: 400, data: { error: 'Invalid OTP code. For demo testing, enter 123456.' } };
      }

      let user = this.db.users.find(u => u.mobile.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));
      if (!user) {
        user = this.db.users[0];
      }
      user.last_login_at = new Date().toISOString();
      this.save();

      return {
        status: 200,
        data: {
          token: `token_${user.id}_${Date.now()}`,
          user,
          organization: this.db.organization,
          restaurant: this.db.restaurant,
          branches: this.db.branches,
        }
      };
    }

    if (pathOnly === '/auth/me' && method === 'GET') {
      const activeToken = tokenHeader || (typeof localStorage !== 'undefined' ? localStorage.getItem('restaurantos_token') : null);
      if (!activeToken) {
        return { status: 401, data: { error: 'No authorization token provided.' } };
      }

      const userId = this.extractUserIdFromToken(activeToken);
      if (!userId) {
        return { status: 401, data: { error: 'Invalid authorization token format.' } };
      }

      const foundUser = this.db.users.find(u => u.id === userId);
      if (!foundUser) {
        return { status: 401, data: { error: 'Session expired or user not found. Please login again.' } };
      }

      return {
        status: 200,
        data: {
          user: foundUser,
          organization: this.db.organization,
          restaurant: this.db.restaurant,
          branches: this.db.branches,
        }
      };
    }

    if (pathOnly === '/auth/register' && method === 'POST') {
      const { fullName, email, mobile, password, restaurantName, branchName, currency } = body || {};
      if (!fullName || !email || !restaurantName || !branchName) {
        return { status: 400, data: { error: 'Please provide full name, email, restaurant name, and branch name.' } };
      }

      const orgId = `org_${Date.now()}`;
      const restId = `rest_${Date.now()}`;
      const branchId = `branch_${Date.now()}`;
      const userId = `user_${Date.now()}`;

      const newOrg = {
        id: orgId,
        name: `${restaurantName} Enterprise Group`,
        created_at: new Date().toISOString(),
      };

      const newRestaurant = {
        id: restId,
        organization_id: orgId,
        name: restaurantName,
        slug: restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
        restaurant_type: 'Restaurant & Bar',
        country: 'India',
        state: 'Delhi NCR',
        city: 'New Delhi',
        address: '12 Connaught Place, Central Hub',
        currency: currency || 'INR',
        currency_symbol: currency === 'USD' ? '$' : currency === 'AED' ? 'AED' : '₹',
        timezone: 'Asia/Kolkata',
        gstin: '07AAAAA0000A1Z5',
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        service_charge_rate: 5.0,
        is_service_charge_mandatory: false,
        is_tax_inclusive: false,
        business_phone: mobile || '+91 99999 88888',
        business_email: email,
        created_at: new Date().toISOString(),
      };

      const newBranch = {
        id: branchId,
        organization_id: orgId,
        restaurant_id: restId,
        name: branchName,
        code: branchName.substring(0, 3).toUpperCase(),
        address: 'Central Plaza Outlet',
        contact_number: mobile || '+91 99999 88888',
        opening_hours: '11:00 AM - 11:30 PM',
        tables_count: 12,
        seating_capacity: 48,
        status: 'active' as const,
      };

      const allPerms: User['permissions'] = [
        'orders.view', 'orders.create', 'orders.cancel', 'orders.refund',
        'payments.view', 'payments.create',
        'inventory.view', 'inventory.adjust', 'inventory.purchase',
        'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
        'reports.view', 'analytics.view',
        'ai.view', 'ai.approve',
        'staff.manage', 'branches.manage', 'settings.manage'
      ];

      const newUser: User = {
        id: userId,
        organization_id: orgId,
        restaurant_id: restId,
        name: fullName,
        email,
        mobile: mobile || '+91 99999 88888',
        role: 'OWNER',
        assigned_branch_ids: ['all'],
        permissions: allPerms,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        is_2fa_enabled: false,
        status: 'active',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };

      this.db.organization = newOrg;
      this.db.restaurant = newRestaurant;
      this.db.branches = [newBranch];
      this.db.users.unshift(newUser);

      const tables: Table[] = Array.from({ length: 12 }, (_, i) => ({
        id: `tbl_reg_${i + 1}`,
        branch_id: branchId,
        restaurant_id: restId,
        table_number: `T${String(i + 1).padStart(2, '0')}`,
        area: (i < 6 ? 'Main Hall' : i < 10 ? 'Terrace' : 'Lounge Bar') as any,
        capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
        status: 'FREE',
      }));
      this.db.tables = tables;

      this.save();

      return {
        status: 200,
        data: {
          success: true,
          token: `token_${newUser.id}_${Date.now()}`,
          user: newUser,
          organization: newOrg,
          restaurant: newRestaurant,
          branches: [newBranch],
        }
      };
    }

    if (pathOnly === '/auth/forgot-password' && method === 'POST') {
      const { identifier } = body || {};
      return {
        status: 200,
        data: {
          success: true,
          message: `Password reset instructions dispatched for ${identifier || 'account'}. Demo OTP: 889922.`,
          reset_token: 'rst_demo_token_889922',
        }
      };
    }

    if (pathOnly === '/auth/reset-password' && method === 'POST') {
      return {
        status: 200,
        data: {
          success: true,
          message: 'Password reset successfully. You can now login with your new credentials.',
        }
      };
    }

    if (pathOnly === '/auth/invitations' && method === 'GET') {
      return { status: 200, data: this.db.staffInvitations || [] };
    }

    if (pathOnly === '/auth/invitations' && method === 'POST') {
      const { name, email, role, branchIds, invitedBy } = body || {};
      const newInv = {
        id: `inv_${Date.now()}`,
        organization_id: this.db.organization.id,
        restaurant_id: this.db.restaurant.id,
        token: `inv_token_${Math.random().toString(36).substring(2, 9)}`,
        name,
        email,
        mobile: body?.mobile || '',
        role: role || 'WAITER',
        assigned_branch_ids: branchIds || ['all'],
        invited_by: invitedBy || 'Rajesh Mehra (Owner)',
        status: 'PENDING' as const,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      };
      this.db.staffInvitations.unshift(newInv);
      this.save();
      return {
        status: 200,
        data: {
          invitation: newInv,
          invite_url: `/invite/${newInv.token}`,
        }
      };
    }

    if (pathOnly === '/auth/invitations/accept' && method === 'POST') {
      const { token } = body || {};
      const inv = this.db.staffInvitations.find(i => i.token === token) || this.db.staffInvitations[0];
      if (inv) inv.status = 'ACCEPTED';
      const newUser: User = {
        id: `user_${Date.now()}`,
        organization_id: this.db.organization.id,
        restaurant_id: this.db.restaurant.id,
        name: inv ? inv.name : 'Team Member',
        email: inv ? inv.email : 'staff@restaurantos.io',
        mobile: inv?.mobile || '+91 99000 11223',
        role: inv?.role || 'WAITER',
        assigned_branch_ids: inv?.assigned_branch_ids || ['all'],
        permissions: ['orders.view', 'orders.create', 'menu.view'],
        is_2fa_enabled: false,
        status: 'active',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };
      this.db.users.push(newUser);
      this.save();
      return {
        status: 200,
        data: {
          success: true,
          user: newUser,
          token: `token_${newUser.id}_${Date.now()}`,
          organization: this.db.organization,
          restaurant: this.db.restaurant,
          branches: this.db.branches,
        }
      };
    }

    if (pathOnly === '/auth/team-members' && method === 'GET') {
      const members = this.db.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        role: u.role,
        assigned_branch_ids: u.assigned_branch_ids,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        status: u.status,
        last_login_at: u.last_login_at || 'Today 10:30 AM',
      }));
      return { status: 200, data: members };
    }

    // ==========================================
    // 2. RESTAURANT & BRANCHES
    // ==========================================

    if (pathOnly === '/branches' && method === 'GET') {
      return { status: 200, data: this.db.branches };
    }

    if (pathOnly === '/branches' && method === 'POST') {
      const newBranch = {
        id: `branch_${Date.now()}`,
        organization_id: this.db.organization.id,
        restaurant_id: this.db.restaurant.id,
        name: body.name,
        code: body.code || body.name.substring(0, 3).toUpperCase(),
        address: body.address || '',
        contact_number: body.contact_number || '',
        opening_hours: body.opening_hours || '11:00 AM - 11:30 PM',
        tables_count: Number(body.tables_count) || 12,
        seating_capacity: Number(body.seating_capacity) || 48,
        status: 'active' as const,
      };
      this.db.branches.push(newBranch);
      this.save();
      return { status: 200, data: newBranch };
    }

    if (pathOnly === '/restaurant/profile' && method === 'GET') {
      return { status: 200, data: this.db.restaurant };
    }

    if (pathOnly === '/restaurant/settings' && method === 'PUT') {
      Object.assign(this.db.restaurant, body);
      this.save();
      return { status: 200, data: this.db.restaurant };
    }

    // ==========================================
    // 3. TABLES & FLOOR PLAN
    // ==========================================

    if (pathOnly === '/tables' && method === 'GET') {
      const branchId = params.get('branchId') || this.db.branches[0]?.id;
      const tables = branchId && branchId !== 'all' 
        ? this.db.tables.filter(t => t.branch_id === branchId)
        : this.db.tables;
      return { status: 200, data: tables.length > 0 ? tables : this.db.tables };
    }

    if (pathOnly === '/tables' && method === 'POST') {
      const newTable: Table = {
        id: `tbl_${Date.now()}`,
        branch_id: body.branch_id || this.db.branches[0].id,
        restaurant_id: this.db.restaurant.id,
        table_number: body.table_number || `T${this.db.tables.length + 1}`,
        area: body.area || 'Main Hall',
        capacity: Number(body.capacity) || 4,
        status: 'FREE',
      };
      this.db.tables.push(newTable);
      this.save();
      return { status: 200, data: newTable };
    }

    if (pathOnly.startsWith('/tables/') && method === 'PATCH') {
      const id = pathOnly.replace('/tables/', '');
      const tbl = this.db.tables.find(t => t.id === id);
      if (tbl) {
        Object.assign(tbl, body);
        this.save();
        return { status: 200, data: tbl };
      }
      return { status: 404, data: { error: 'Table not found' } };
    }

    if (pathOnly === '/tables/transfer' && method === 'POST') {
      const { sourceTableId, targetTableId } = body || {};
      const source = this.db.tables.find(t => t.id === sourceTableId);
      const target = this.db.tables.find(t => t.id === targetTableId);
      if (source && target) {
        target.status = source.status;
        target.active_order_id = source.active_order_id;
        target.occupied_since = source.occupied_since;
        target.guest_name = source.guest_name;
        target.guest_count = source.guest_count;
        target.server_name = source.server_name;

        source.status = 'FREE';
        source.active_order_id = undefined;
        source.occupied_since = undefined;
        source.guest_name = undefined;

        this.save();
        return { status: 200, data: { success: true, source, target } };
      }
      return { status: 404, data: { error: 'Table not found' } };
    }

    // ==========================================
    // 4. MENU ITEMS
    // ==========================================

    if (pathOnly === '/menu' && method === 'GET') {
      const branchId = params.get('branchId');
      let items = this.db.menuItems;
      if (branchId && branchId !== 'all') {
        items = items.filter(i => i.branch_ids.includes(branchId));
      }
      return { status: 200, data: items.length > 0 ? items : this.db.menuItems };
    }

    if (pathOnly === '/menu' && method === 'POST') {
      const newItem: MenuItem = {
        id: `menu_${Date.now()}`,
        restaurant_id: this.db.restaurant.id,
        branch_ids: body.branch_ids || this.db.branches.map(b => b.id),
        category_id: body.category_id || 'cat_mains',
        category_name: body.category_name || 'Main Course',
        name: body.name,
        description: body.description || '',
        price: Number(body.price),
        cost_price: Number(body.cost_price) || 0,
        is_veg: Boolean(body.is_veg),
        is_available: true,
        preparation_time_minutes: Number(body.preparation_time_minutes) || 15,
        modifiers: body.modifiers || [],
        image_url: body.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80',
        popularity_score: 60,
        contribution_margin: Number(body.price) - (Number(body.cost_price) || 0),
        margin_percentage: Number((((Number(body.price) - (Number(body.cost_price) || 0)) / Number(body.price)) * 100).toFixed(1)),
        menu_matrix_category: 'STAR',
      };
      this.db.menuItems.push(newItem);
      this.save();
      return { status: 200, data: newItem };
    }

    if (pathOnly.startsWith('/menu/') && method === 'PATCH') {
      const id = pathOnly.replace('/menu/', '');
      const item = this.db.menuItems.find(m => m.id === id);
      if (item) {
        Object.assign(item, body);
        this.save();
        return { status: 200, data: item };
      }
      return { status: 404, data: { error: 'Menu item not found' } };
    }

    // ==========================================
    // 5. ORDERS & SMART POS BILLING
    // ==========================================

    if (pathOnly === '/orders' && method === 'GET') {
      const branchId = params.get('branchId');
      let orders = this.db.activeOrders;
      if (branchId && branchId !== 'all') {
        orders = orders.filter(o => o.branch_id === branchId);
      }
      return { status: 200, data: orders };
    }

    if (pathOnly === '/pos/orders' && method === 'POST') {
      const {
        branchId = this.db.branches[0].id,
        tableId,
        tableNumber,
        orderType = 'DINE_IN',
        items = [],
        customerName,
        customerPhone,
        discountAmount = 0,
        createdByName = 'Cashier Priya',
      } = body || {};

      let subtotal = 0;
      const orderItems = items.map((it: any, idx: number) => {
        const lineTotal = Number(it.price || it.unit_price || 0) * Number(it.quantity || 1);
        subtotal += lineTotal;
        return {
          id: `item_${Date.now()}_${idx}`,
          menu_item_id: it.menu_item_id || it.id,
          name: it.name,
          quantity: Number(it.quantity || 1),
          price: Number(it.price || it.unit_price || 0),
          item_total: lineTotal,
          modifiers: it.modifiers || [],
          status: 'NEW' as const,
        };
      });

      const cgst = Number((subtotal * 0.025).toFixed(2));
      const sgst = Number((subtotal * 0.025).toFixed(2));
      const grandTotal = Math.round(subtotal + cgst + sgst - Number(discountAmount));

      const orderId = `ord_${Date.now()}`;
      const newOrder: Order = {
        id: orderId,
        order_number: `ORD-${Date.now().toString().slice(-4)}`,
        organization_id: this.db.organization.id,
        branch_id: branchId,
        restaurant_id: this.db.restaurant.id,
        table_id: tableId,
        table_number: tableNumber,
        order_type: orderType,
        status: 'KOT_SENT',
        payment_status: 'UNPAID',
        items: orderItems,
        subtotal,
        discount_amount: Number(discountAmount),
        cgst_amount: cgst,
        sgst_amount: sgst,
        service_charge: 0,
        rounding_adjustment: 0,
        grand_total: grandTotal,
        customer_name: customerName,
        customer_phone: customerPhone,
        created_by_name: createdByName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create matching KOT
      const kotId = `kot_${Date.now()}`;
      const newKOT: KOT = {
        id: kotId,
        kot_number: `KOT-${Date.now().toString().slice(-3)}`,
        order_id: orderId,
        order_number: newOrder.order_number,
        branch_id: branchId,
        table_number: tableNumber || 'Counter',
        order_type: orderType,
        status: 'NEW',
        items: orderItems.map((oi: any, idx: number) => ({
          id: `koti_${idx}_${Date.now()}`,
          item_name: oi.name,
          quantity: oi.quantity,
          modifiers: [],
          station: oi.name.toLowerCase().includes('roti') || oi.name.toLowerCase().includes('tikka') ? 'Tandoor' : 'Curry & Rice',
        })),
        created_at: new Date().toISOString(),
        elapsed_seconds: 0,
        server_name: createdByName,
      };

      this.db.activeOrders.unshift(newOrder);
      this.db.activeKOTs.unshift(newKOT);

      // Update table if tableId
      if (tableId) {
        const tbl = this.db.tables.find(t => t.id === tableId);
        if (tbl) {
          tbl.status = 'OCCUPIED';
          tbl.active_order_id = orderId;
          tbl.occupied_since = new Date().toISOString();
          tbl.guest_name = customerName;
        }
      }

      this.save();
      return { status: 200, data: { order: newOrder, kot: newKOT } };
    }

    if (pathOnly.startsWith('/pos/orders/') && pathOnly.endsWith('/pay') && method === 'POST') {
      const orderId = pathOnly.replace('/pos/orders/', '').replace('/pay', '');
      const order = this.db.activeOrders.find(o => o.id === orderId);
      if (order) {
        order.payment_status = 'PAID';
        order.status = 'COMPLETED';
        order.updated_at = new Date().toISOString();
        order.payment_method = body?.paymentMethod || 'CASH';

        // Free table
        if (order.table_id) {
          const tbl = this.db.tables.find(t => t.id === order.table_id);
          if (tbl) {
            tbl.status = 'FREE';
            tbl.active_order_id = undefined;
            tbl.occupied_since = undefined;
            tbl.guest_name = undefined;
          }
        }

        // Deduct inventory items slightly to simulate consumption
        this.db.inventoryItems.forEach(inv => {
          if (inv.current_stock > 5) {
            inv.current_stock = Number((inv.current_stock - 0.25).toFixed(2));
          }
        });

        this.save();
        return {
          status: 200,
          data: {
            success: true,
            order,
            invoice: {
              invoice_number: `INV-${Date.now().toString().slice(-5)}`,
              grand_total: order.grand_total,
              paid_at: order.updated_at,
            }
          }
        };
      }
      return { status: 404, data: { error: 'Order not found' } };
    }

    if (pathOnly.startsWith('/pos/orders/') && pathOnly.endsWith('/refund') && method === 'POST') {
      const orderId = pathOnly.replace('/pos/orders/', '').replace('/refund', '');
      const order = this.db.activeOrders.find(o => o.id === orderId);
      if (order) {
        order.payment_status = 'REFUNDED';
        order.status = 'CANCELLED';
        order.updated_at = new Date().toISOString();
        this.save();
        return { status: 200, data: { success: true, order } };
      }
      return { status: 404, data: { error: 'Order not found' } };
    }

    // ==========================================
    // 6. KITCHEN DISPLAY SYSTEM (KDS)
    // ==========================================

    if (pathOnly === '/kot' && method === 'GET') {
      const branchId = params.get('branchId');
      let kots = this.db.activeKOTs;
      if (branchId && branchId !== 'all') {
        kots = kots.filter(k => k.branch_id === branchId);
      }
      return { status: 200, data: kots };
    }

    if (pathOnly.startsWith('/kot/') && pathOnly.endsWith('/status') && method === 'PATCH') {
      const kotId = pathOnly.replace('/kot/', '').replace('/status', '');
      const kot = this.db.activeKOTs.find(k => k.id === kotId);
      if (kot) {
        kot.status = body.status;
        this.save();
        return { status: 200, data: kot };
      }
      return { status: 404, data: { error: 'KOT ticket not found' } };
    }

    // ==========================================
    // 7. INVENTORY & KIRANASETU
    // ==========================================

    if (pathOnly === '/inventory' && method === 'GET') {
      return { status: 200, data: this.db.inventoryItems };
    }

    if (pathOnly === '/inventory/item' && method === 'POST') {
      const newItem: InventoryItem = {
        id: `inv_${Date.now()}`,
        restaurant_id: this.db.restaurant.id,
        branch_id: body.branch_ids?.[0] || body.branch_id || this.db.branches[0].id,
        name: body.name,
        category: body.category || 'Dry Goods & Spices',
        current_stock: Number(body.current_stock) || 10,
        minimum_stock: Number(body.minimum_stock || body.reorder_point) || 5,
        optimal_stock: Number(body.optimal_stock || body.ideal_stock) || 25,
        unit: body.unit || 'kg',
        cost_per_unit: Number(body.cost_per_unit || body.unit_cost) || 100,
        supplier_id: body.supplier_id || 'sup_1',
        supplier_name: body.supplier_name || 'Agro Wholesale',
        barcode: body.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
        shelf_life_days: Number(body.shelf_life_days) || 30,
        storage_location: body.storage_location || 'Main Shelf A',
        is_perishable: true,
        status: 'OPTIMAL',
      };
      this.db.inventoryItems.unshift(newItem);
      this.save();
      return { status: 200, data: newItem };
    }

    if (pathOnly === '/inventory/adjust' && method === 'POST') {
      const { itemId, adjustmentQty } = body || {};
      const item = this.db.inventoryItems.find(i => i.id === itemId);
      if (item) {
        item.current_stock = Math.max(0, Number((item.current_stock + Number(adjustmentQty)).toFixed(2)));
        item.status = item.current_stock <= item.minimum_stock ? 'LOW' : 'OPTIMAL';
        this.save();
        return { status: 200, data: item };
      }
      return { status: 404, data: { error: 'Item not found' } };
    }

    if (pathOnly === '/inventory/bulk-inward' && method === 'POST') {
      const { items = [] } = body || {};
      items.forEach((it: any) => {
        const found = this.db.inventoryItems.find(i => i.id === it.id || i.name.toLowerCase() === it.name?.toLowerCase());
        if (found) {
          found.current_stock = Number((found.current_stock + Number(it.quantity || 1)).toFixed(2));
        }
      });
      this.save();
      return { status: 200, data: { success: true, count: items.length } };
    }

    if (pathOnly === '/inventory/quick-reorder' && method === 'POST') {
      return {
        status: 200,
        data: {
          success: true,
          po_number: `PO-${Date.now().toString().slice(-4)}`,
          message: 'Purchase Order generated and sent to vendor successfully.',
        }
      };
    }

    if (pathOnly === '/inventory/simulate-sales-surge' && method === 'POST') {
      this.db.inventoryItems.forEach(i => {
        if (i.current_stock > 10) {
          i.current_stock = Number((i.current_stock * 0.4).toFixed(1));
          if (i.current_stock <= i.minimum_stock) {
            i.status = 'LOW';
          }
        }
      });
      this.save();
      return { status: 200, data: { success: true, message: 'Simulated 1.8x sales surge.' } };
    }

    if (pathOnly === '/inventory/bulk-reorder-critical' && method === 'POST') {
      this.db.inventoryItems.forEach(i => {
        if (i.status === 'LOW' || i.status === 'CRITICAL' || i.current_stock <= i.minimum_stock) {
          i.current_stock = i.optimal_stock;
          i.status = 'OPTIMAL';
        }
      });
      this.save();
      return { status: 200, data: { success: true, count: 5 } };
    }

    if (pathOnly.startsWith('/inventory/ai-audit') && method === 'GET') {
      return {
        status: 200,
        data: {
          auditDate: new Date().toISOString(),
          varianceTotalAmount: 1850,
          highRiskItems: this.db.inventoryItems.slice(0, 3).map(i => ({
            name: i.name,
            bookStock: i.current_stock,
            physicalStock: Math.max(0, i.current_stock - 2),
            variance: -2,
            lossRupees: 2 * i.cost_per_unit,
            riskScore: 'HIGH',
          }))
        }
      };
    }

    // ==========================================
    // 8. RECIPES & BOM
    // ==========================================

    if (pathOnly === '/recipes' && method === 'GET') {
      return { status: 200, data: this.db.recipes };
    }

    if (pathOnly === '/recipes/simulate-market-scenario' && method === 'POST') {
      return {
        status: 200,
        data: {
          scenario: body.scenario,
          impactPercentage: 14.2,
          projectedMonthlyErosion: 42800,
          recommendations: [
            'Adjust portion sizing for Basmati Rice from 350g to 320g (-8.5% cost)',
            'Renegotiate Dairy AMUL Ghee bulk contract with North Distributor',
            'Slightly adjust Paneer Tikka menu price by +₹20 to preserve 68% gross margin'
          ]
        }
      };
    }

    if (pathOnly === '/recipes/update-market-price' && method === 'POST') {
      return { status: 200, data: { success: true, updated: true } };
    }

    if (pathOnly === '/recipes/sync-standard-bom' && method === 'POST') {
      return { status: 200, data: { success: true, synced: true } };
    }

    // ==========================================
    // 9. WASTAGE & SUPPLIERS
    // ==========================================

    if (pathOnly === '/wastage' && method === 'GET') {
      return { status: 200, data: this.db.wastageEntries };
    }

    if (pathOnly === '/wastage' && method === 'POST') {
      const newEntry: WastageEntry = {
        id: `wst_${Date.now()}`,
        branch_id: body.branch_id || this.db.branches[0].id,
        restaurant_id: this.db.restaurant.id,
        inventory_item_id: body.item_id || body.inventory_item_id || 'inv_1',
        item_name: body.item_name || 'Ingredient',
        quantity: Number(body.quantity) || 1,
        unit: body.unit || 'kg',
        unit_cost: Number(body.unit_cost) || 150,
        total_loss_cost: Number(body.cost_impact || body.total_loss_cost) || 150,
        reason: (body.reason || 'SPOILED') as any,
        reported_by: body.logged_by || body.reported_by || 'Head Chef Vikram',
        created_at: new Date().toISOString(),
      };
      this.db.wastageEntries.unshift(newEntry);
      this.save();
      return { status: 200, data: newEntry };
    }

    if (pathOnly === '/suppliers' && method === 'GET') {
      return { status: 200, data: this.db.suppliers };
    }

    if (pathOnly === '/purchases' && method === 'GET') {
      return { status: 200, data: this.db.purchaseRecommendations };
    }

    // ==========================================
    // 10. CUSTOMERS & CRM LOYALTY
    // ==========================================

    if (pathOnly === '/customers' && method === 'GET') {
      return { status: 200, data: this.db.customers };
    }

    if (pathOnly === '/customers' && method === 'POST') {
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        restaurant_id: this.db.restaurant.id,
        name: body.name,
        phone: body.phone,
        email: body.email || '',
        tier: 'BRONZE',
        loyalty_points: 50,
        lifetime_points_earned: 50,
        lifetime_points_redeemed: 0,
        total_spent: 0,
        visit_count: 1,
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        favorite_items: [],
        avg_spend_per_visit: 0,
        days_since_last_visit: 0,
        churn_risk: 'LOW',
        visit_history: [],
        points_ledger: [],
        personalized_discounts: [],
      };
      this.db.customers.unshift(newCust);
      this.save();
      return { status: 200, data: newCust };
    }

    if (pathOnly === '/loyalty/rules' && method === 'GET') {
      return { status: 200, data: this.db.loyaltyConfig };
    }

    if (pathOnly === '/loyalty/rules' && method === 'PUT') {
      Object.assign(this.db.loyaltyConfig, body);
      this.save();
      return { status: 200, data: this.db.loyaltyConfig };
    }

    if (pathOnly.includes('/customers/') && pathOnly.includes('/transactions') && method === 'POST') {
      return { status: 200, data: { success: true, pointsAdded: body?.pointsEarned || 20 } };
    }

    if (pathOnly.includes('/customers/') && pathOnly.includes('/offers') && method === 'POST') {
      return {
        status: 200,
        data: {
          offers: [
            {
              id: 'off_1',
              title: '15% Off Weekday Dinner',
              code: 'WEEKDAY15',
              discount_type: 'PERCENTAGE',
              discount_value: 15,
              valid_until: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            }
          ]
        }
      };
    }

    // ==========================================
    // 11. SCHEDULING & FORECAST
    // ==========================================

    if (pathOnly.startsWith('/scheduling/weekly') && method === 'GET') {
      const scheduleData: WeeklyScheduleData = {
        weekRange: 'May 12 - May 18, 2025',
        totalProjectedCovers: 840,
        totalProjectedRevenue: 485000,
        totalScheduledHours: 320,
        estimatedLaborCost: 48000,
        laborCostPct: 9.8,
        optimalLaborCostPct: 10.5,
        shifts: [
          {
            id: 'sh_1',
            day: 'Mon',
            dateStr: '2025-05-12',
            shiftType: 'LUNCH',
            startTime: '10:00',
            endTime: '16:00',
            projectedCovers: 85,
            projectedRevenue: 42000,
            demandIntensity: 'MEDIUM',
            suggestedStaffCount: { kitchen: 3, service: 4, cashier: 1, store: 1, total: 9 },
            assignedStaffIds: ['user_kitchen', 'user_cashier'],
            status: 'OPTIMAL',
          },
          {
            id: 'sh_2',
            day: 'Mon',
            dateStr: '2025-05-12',
            shiftType: 'DINNER',
            startTime: '17:00',
            endTime: '23:30',
            projectedCovers: 140,
            projectedRevenue: 78000,
            demandIntensity: 'PEAK_SURGE',
            suggestedStaffCount: { kitchen: 4, service: 6, cashier: 2, store: 1, total: 13 },
            assignedStaffIds: ['user_kitchen', 'user_waiter', 'user_cashier'],
            status: 'OPTIMAL',
          }
        ],
        staffRoster: [
          {
            id: 'user_kitchen',
            name: 'Vikram Singh',
            role: 'KITCHEN',
            station: 'KITCHEN',
            avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80',
            maxWeeklyHours: 48,
            assignedHours: 42,
            assignedShiftCount: 6,
          },
          {
            id: 'user_cashier',
            name: 'Priya Sharma',
            role: 'CASHIER',
            station: 'CASHIER',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
            maxWeeklyHours: 45,
            assignedHours: 40,
            assignedShiftCount: 6,
          }
        ],
        aiRecommendations: [
          'Add 1 extra runner for Friday dinner peak between 8:00 PM and 10:30 PM.',
          'Labor cost percentage is trending favorably at 9.8% (Target: < 11%).'
        ]
      };
      return { status: 200, data: scheduleData };
    }

    if (pathOnly === '/scheduling/auto-optimize' && method === 'POST') {
      return {
        status: 200,
        data: {
          success: true,
          message: 'AI shift optimization complete. Auto-balanced coverage for dinner rush.',
        }
      };
    }

    if (pathOnly === '/scheduling/assign' && method === 'POST') {
      return { status: 200, data: { success: true } };
    }

    if (pathOnly === '/forecast' && method === 'GET') {
      return { status: 200, data: this.db.demandForecasts };
    }

    if (pathOnly.startsWith('/forecast/recommendations/') && method === 'POST') {
      return { status: 200, data: { success: true } };
    }

    if (pathOnly.startsWith('/analytics/daily-huddle') && method === 'GET') {
      const huddle: DailyHuddleData = {
        shiftInfo: {
          shiftName: 'Dinner Service Rush',
          shiftLead: 'Rahul Verma (Manager)',
          serviceWindow: '6:30 PM - 11:45 PM',
          date: new Date().toISOString().split('T')[0],
          branchName: this.db.branches[0].name,
          focusMode: 'BALANCED',
        },
        operationalMetrics: {
          todayRevenue: 48650,
          revenueTarget: 65000,
          targetProgressPct: 74.8,
          activeOrdersCount: 6,
          completedCovers: 82,
          avgTicketSize: 1850,
          tableOccupancyPct: 66.7,
          occupiedTablesCount: 8,
          totalTablesCount: 12,
          kitchenKotAvgTimeMins: 11.2,
          foodCostDriftPct: 1.4,
          wastageLossToday: 420,
          healthScore: 94,
        },
        staffingStatus: {
          totalActiveStaff: 8,
          stationCoverageRatioPct: 100,
          shiftLeadName: 'Rahul Verma',
          shiftNotes: 'Banquet party at 8:30 PM in Terrace section.',
          stations: [
            {
              id: 'st_1',
              stationName: 'Tandoor & Charcoal',
              leadName: 'Vikram Singh',
              staffCount: 3,
              readinessPct: 96,
              status: 'OPTIMAL',
              statusNote: 'All kebabs skewered and ready in chiller.',
              keyDirectives: ['Prioritize table 4 banquet starters'],
            },
            {
              id: 'st_2',
              stationName: 'Main Curry Station',
              leadName: 'Ramesh Chef',
              staffCount: 3,
              readinessPct: 92,
              status: 'OPTIMAL',
              statusNote: 'Makhani and Korma gravies simmering.',
              keyDirectives: ['Portion check on Dal Makhani'],
            }
          ],
        },
        projectedPeaks: {
          currentPhase: 'Pre-Dinner Prep',
          totalProjectedShiftCovers: 140,
          peakRushTime: '8:15 PM - 9:45 PM',
          windows: [
            {
              id: 'pk_1',
              timeWindow: '8:00 PM - 9:30 PM',
              projectedCovers: 68,
              capacityUtilization: 85,
              loadLevel: 'HIGH',
              rushStatus: 'Peak Surge Expected',
              highlight: 'Terrace & Main Hall near capacity',
              prepPrerequisite: 'Pre-cook 35 portions of Biryani',
            }
          ],
          prepRecommendations: [
            'Hold 4 backup table setups for quick turnaround',
            'Keep ice bucket stocked at Lounge Bar'
          ],
        },
        tacticalDirectives: {
          pushItems: [
            {
              id: 'td_1',
              dishOrItem: 'Zafran Signature Biryani',
              category: 'PUSH_PROFIT',
              rationale: 'Highest gross margin (72%) with fast 8-minute fire time',
              marginOrCostImpact: '+₹240 margin / portion',
              badge: 'Chef Special',
            }
          ],
          watchItems: [
            {
              id: 'td_2',
              dishOrItem: 'Amul Pure Butter',
              category: 'PORTION_DRIFT',
              rationale: 'Portion usage trending 4% over recipe BOM',
              marginOrCostImpact: '-₹35 loss / dish',
              badge: 'BOM Drift Alert',
            }
          ],
          servicePledges: [
            'Table greeting under 60 seconds of seating',
            'Check-back on starters within 2 bites'
          ],
        },
        aiBriefing: {
          generatedBy: 'RestaurantOS AI Kernel',
          strategicMotto: 'Precision Service, Maximum Turnover, Zero Waste',
          speechBriefing: 'Welcome to dinner shift team! We have high projected covers tonight with 6 reservations booked. Main priority is turning tables in under 38 minutes on the main floor while driving our signature Biryani and mocktails.',
          confidenceScore: 98,
          aiNotes: ['Weather is clear; patio tables will be fully utilized tonight.'],
          generatedAt: new Date().toISOString(),
        },
      };
      return { status: 200, data: huddle };
    }

    // ==========================================
    // 12. AI COPILOT & INVOICE PARSING
    // ==========================================

    if (pathOnly === '/ai/query' && method === 'POST') {
      const prompt = (body?.prompt || '').toLowerCase();
      let reply = "Here is your operational snapshot: Today's lunch covers are currently pacing 12% above yesterday's benchmark. Kitchen ticket clearance latency is healthy at 11.4 minutes. All critical perishables are adequately stocked.";
      if (prompt.includes('stock') || prompt.includes('inventory')) {
        reply = "Inventory audit report: Basmati Rice and Dairy Ghee are in optimal reserve. Amul Butter is at 3.5 kg, which is near reorder threshold. Would you like me to trigger an automated vendor PO?";
      } else if (prompt.includes('revenue') || prompt.includes('sale') || prompt.includes('profit')) {
        reply = "Revenue analysis: Gross sales are currently at ₹48,650 across 18 completed table seatings. Star dishes include Dal Makhani (72% margin) and Paneer Tikka (68% margin). Total contribution margin is at an all-time peak of 64.8%.";
      } else if (prompt.includes('table') || prompt.includes('seat')) {
        reply = "Table Status: 4 tables currently occupied in Main Hall, 2 on Terrace, and 6 available. Peak dining rush projected between 8:00 PM and 9:45 PM.";
      }
      return {
        status: 200,
        data: {
          reply,
          suggestedActions: [
            { label: 'View Stock Health Dock', action: 'OPEN_INVENTORY' },
            { label: 'Review Tonight Table Layout', action: 'OPEN_TABLES' },
          ]
        }
      };
    }

    if (pathOnly === '/ai/simulate' && method === 'POST') {
      return {
        status: 200,
        data: {
          simulationResult: 'Adjusting menu prices by +5% on Beverages and Mains yields an estimated monthly profit increase of ₹38,200 with zero projected churn.',
        }
      };
    }

    if (pathOnly === '/inventory/ai-parse' && method === 'POST') {
      return {
        status: 200,
        data: {
          extracted_items: [
            { name: 'Basmati Rice Premium (India Gate)', quantity: 25, unit: 'kg', unit_price: 110, total_price: 2750 },
            { name: 'Fresh Paneer Malai Block', quantity: 10, unit: 'kg', unit_price: 320, total_price: 3200 },
            { name: 'Pure Desi Ghee (Amul 1L)', quantity: 6, unit: 'L', unit_price: 580, total_price: 3480 },
          ],
          invoice_metadata: {
            vendor_name: 'Aggarwal Wholesale Mandi Traders',
            invoice_number: 'MND-88912',
            date: new Date().toISOString().split('T')[0],
            total_amount: 9430,
          }
        }
      };
    }

    return {
      status: 200,
      data: { success: true, message: `Request to ${pathOnly} processed locally.` }
    };
  }
}

// Singleton export
export const clientStore = new ClientDataStore();

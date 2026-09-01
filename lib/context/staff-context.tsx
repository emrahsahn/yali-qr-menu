"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { OrderSession, CartItem, WaiterCall, Table } from "@/lib/types/database"
import { mockTables } from "@/lib/supabase/mock-data"
import { auditLogger } from "@/lib/services/audit-logger"

export interface WaiterProfile {
  id: string;
  name: string;
  avatarColor: string;
  pinCode: string;
  isActive: boolean;
  venue?: 'restaurant' | 'cafe' | 'club' | 'seafood';
  role?: 'waiter' | 'barista' | 'chef' | 'manager';
}

export const DEFAULT_WAITERS: WaiterProfile[] = [
  // Restaurant Staff
  { id: "w1", name: "Hüseyin", avatarColor: "bg-rose-500 text-white", pinCode: "1453", isActive: true, venue: "restaurant", role: "waiter" },
  { id: "w2", name: "Ahmet", avatarColor: "bg-blue-500 text-white", pinCode: "2024", isActive: true, venue: "restaurant", role: "waiter" },
  { id: "w3", name: "Zeynep", avatarColor: "bg-amber-500 text-white", pinCode: "3907", isActive: true, venue: "restaurant", role: "waiter" },
  { id: "w4", name: "Can", avatarColor: "bg-emerald-500 text-white", pinCode: "4821", isActive: true, venue: "restaurant", role: "waiter" },
  // Cafe Staff
  { id: "w5", name: "Mert", avatarColor: "bg-amber-600 text-white", pinCode: "1010", isActive: true, venue: "cafe", role: "barista" },
  { id: "w6", name: "Deniz", avatarColor: "bg-orange-500 text-white", pinCode: "2020", isActive: true, venue: "cafe", role: "barista" },
  // Club Staff
  { id: "w7", name: "Burak", avatarColor: "bg-purple-600 text-white", pinCode: "3030", isActive: true, venue: "club", role: "waiter" },
  { id: "w8", name: "Selin", avatarColor: "bg-pink-600 text-white", pinCode: "4040", isActive: true, venue: "club", role: "waiter" },
  // Seafood Staff
  { id: "w9", name: "Kaan", avatarColor: "bg-teal-600 text-white", pinCode: "5050", isActive: true, venue: "seafood", role: "waiter" },
  { id: "w10", name: "Elif", avatarColor: "bg-indigo-600 text-white", pinCode: "6060", isActive: true, venue: "seafood", role: "waiter" }
];

interface StaffContextType {
  waiters: WaiterProfile[];
  activeWaiter: WaiterProfile | null;
  isLocked: boolean;
  loginWithPin: (pin: string) => { success: boolean; waiter?: WaiterProfile; error?: string };
  lockSession: () => void;
  addWaiter: (name: string, pinCode: string, color?: string, venue?: WaiterProfile['venue'], role?: WaiterProfile['role']) => { success: boolean; error?: string };
  deleteWaiter: (id: string) => void;
  updateWaiterPin: (id: string, newPin: string) => { success: boolean; error?: string };
  toggleWaiterActive: (id: string) => void;
  assignedTableIds: string[];
  tableAssignments: { [tableId: string]: string[] }; // tableId -> ['Hüseyin', 'Ahmet']
  toggleTableAssignment: (tableId: string) => void;
  orders: OrderSession[];
  waiterCalls: WaiterCall[];
  updateOrderStatus: (sessionId: string, newStatus: OrderSession['status']) => Promise<void>;
  updateOrderCartItems: (sessionId: string, newCartItems: CartItem[]) => void;
  createWaiterOrder: (tableId: string, items: CartItem[], autoConfirm?: boolean) => Promise<OrderSession | null>;
  resolveWaiterCall: (callId: string) => void;
  refreshStaffData: () => Promise<void>;
  allTables: Table[];
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [waiters, setWaiters] = useState<WaiterProfile[]>(DEFAULT_WAITERS);
  const [activeWaiter, setActiveWaiterState] = useState<WaiterProfile | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [tableAssignments, setTableAssignments] = useState<{ [tableId: string]: string[] }>({});
  const [orders, setOrders] = useState<OrderSession[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [allTables, setAllTables] = useState<Table[]>([]);

  // Sound alert trigger
  const playAlertSound = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const AudioCtx = window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5 note
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }
  }, []);

  // Save/Load helpers
  const saveWaiters = (updatedWaiters: WaiterProfile[]) => {
    setWaiters(updatedWaiters);
    if (typeof window !== "undefined") {
      localStorage.setItem("yali_staff_list_v2", JSON.stringify(updatedWaiters));
    }
  };

  // Restore staff & active session on mount
  useEffect(() => {
    let active = true;
    // Deferred to a microtask so the first paint matches SSR (no hydration
    // mismatch) and no state updates cascade synchronously in the effect body.
    Promise.resolve().then(() => {
      if (!active || typeof window === "undefined") return;

      let currentWaiters = DEFAULT_WAITERS;
      const savedStaff = localStorage.getItem("yali_staff_list_v2");
      if (savedStaff) {
        try {
          const parsed = JSON.parse(savedStaff);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentWaiters = parsed;
            setWaiters(parsed);
          }
        } catch {}
      }

      // Check if session exists in sessionStorage (per browser tab)
      const savedWaiterId = sessionStorage.getItem("yali_active_waiter_id");
      if (savedWaiterId) {
        const matched = currentWaiters.find(w => w.id === savedWaiterId && w.isActive);
        if (matched) {
          setActiveWaiterState(matched);
          setIsLocked(false);
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // PIN Login function
  const loginWithPin = (pin: string): { success: boolean; waiter?: WaiterProfile; error?: string } => {
    const trimmedPin = pin.trim();
    if (trimmedPin.length !== 4) {
      return { success: false, error: "PIN kodu 4 haneli olmalıdır." };
    }

    const matched = waiters.find(w => w.pinCode === trimmedPin);
    if (!matched) {
      return { success: false, error: "Geçersiz PIN kodu! Lütfen tekrar deneyin." };
    }

    if (!matched.isActive) {
      return { success: false, error: `'${matched.name}' adlı personelin hesabı pasife alınmıştır.` };
    }

    setActiveWaiterState(matched);
    setIsLocked(false);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("yali_active_waiter_id", matched.id);
    }

    auditLogger.log({
      waiterName: matched.name,
      actionType: 'WAITER_ADDED',
      details: `${matched.name} PIN doğrulaması ile oturum açtı.`,
      venue: matched.venue
    });

    return { success: true, waiter: matched };
  };

  // Lock Session (Shift Handover / Security Lock)
  const lockSession = () => {
    setActiveWaiterState(null);
    setIsLocked(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("yali_active_waiter_id");
    }
  };

  const AVATAR_COLORS = [
    "bg-rose-500 text-white",
    "bg-blue-500 text-white",
    "bg-amber-500 text-white",
    "bg-emerald-500 text-white",
    "bg-purple-600 text-white",
    "bg-indigo-600 text-white",
    "bg-teal-600 text-white",
    "bg-pink-600 text-white",
    "bg-orange-600 text-white"
  ];

  // Admin: Add Staff Member with PIN
  const addWaiter = (
    name: string,
    pinCode: string,
    color?: string,
    venue: WaiterProfile['venue'] = 'restaurant',
    role: WaiterProfile['role'] = 'waiter'
  ): { success: boolean; error?: string } => {
    const trimmedName = name.trim();
    const trimmedPin = pinCode.trim();

    if (!trimmedName) {
      return { success: false, error: "Personel adı boş bırakılamaz." };
    }
    if (!/^\d{4}$/.test(trimmedPin)) {
      return { success: false, error: "PIN kodu tam 4 haneli rakamlardan oluşmalıdır." };
    }
    if (waiters.some(w => w.pinCode === trimmedPin)) {
      return { success: false, error: "Bu PIN kodu başka bir personele aittir. Lütfen farklı bir PIN belirleyin." };
    }

    const newWaiter: WaiterProfile = {
      id: "w_" + Math.random().toString(36).substring(2, 9),
      name: trimmedName,
      pinCode: trimmedPin,
      isActive: true,
      venue,
      role,
      avatarColor: color || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };

    const updated = [...waiters, newWaiter];
    saveWaiters(updated);

    auditLogger.log({
      waiterName: activeWaiter?.name || "Admin",
      actionType: 'WAITER_ADDED',
      details: `Sisteme yeni personel '${trimmedName}' (PIN: ${trimmedPin}) eklendi.`,
      venue
    });

    return { success: true };
  };

  // Admin: Delete Staff Member
  const deleteWaiter = (id: string) => {
    const target = waiters.find(w => w.id === id);
    if (!target) return;

    if (waiters.length <= 1) {
      return;
    }

    const updated = waiters.filter(w => w.id !== id);
    saveWaiters(updated);

    // Clean up table assignments
    if (typeof window !== "undefined") {
      const savedAssig = localStorage.getItem("yali_table_assignments");
      if (savedAssig) {
        try {
          const parsed = JSON.parse(savedAssig);
          const cleaned: { [key: string]: string[] } = {};
          Object.keys(parsed).forEach(tId => {
            cleaned[tId] = (parsed[tId] || []).filter((n: string) => n !== target.name);
          });
          localStorage.setItem("yali_table_assignments", JSON.stringify(cleaned));
          setTableAssignments(cleaned);
        } catch {}
      }
    }

    if (activeWaiter?.id === id) {
      lockSession();
    }

    auditLogger.log({
      waiterName: activeWaiter?.name || "Admin",
      actionType: 'WAITER_DELETED',
      details: `'${target.name}' personeli sistemden silindi.`,
      venue: target.venue
    });
  };

  // Admin: Update / Reset Staff PIN
  const updateWaiterPin = (id: string, newPin: string): { success: boolean; error?: string } => {
    const trimmedPin = newPin.trim();
    if (!/^\d{4}$/.test(trimmedPin)) {
      return { success: false, error: "PIN kodu 4 haneli rakam olmalıdır." };
    }
    if (waiters.some(w => w.id !== id && w.pinCode === trimmedPin)) {
      return { success: false, error: "Bu PIN kodu zaten başka bir personele atanmış." };
    }

    const target = waiters.find(w => w.id === id);
    const updated = waiters.map(w => w.id === id ? { ...w, pinCode: trimmedPin } : w);
    saveWaiters(updated);

    if (activeWaiter?.id === id) {
      setActiveWaiterState(prev => prev ? { ...prev, pinCode: trimmedPin } : null);
    }

    auditLogger.log({
      waiterName: activeWaiter?.name || "Admin",
      actionType: 'WAITER_ADDED',
      details: `'${target?.name}' personelinin PIN kodu güncellendi.`,
      venue: target?.venue
    });

    return { success: true };
  };

  // Admin: Toggle Staff Active / Inactive
  const toggleWaiterActive = (id: string) => {
    const target = waiters.find(w => w.id === id);
    if (!target) return;

    const newStatus = !target.isActive;
    const updated = waiters.map(w => w.id === id ? { ...w, isActive: newStatus } : w);
    saveWaiters(updated);

    if (activeWaiter?.id === id && !newStatus) {
      lockSession();
    }

    auditLogger.log({
      waiterName: activeWaiter?.name || "Admin",
      actionType: 'WAITER_ADDED',
      details: `'${target.name}' personeli ${newStatus ? 'aktif' : 'pasif'} duruma getirildi.`
    });
  };

  // Load assignments and tables
  const loadTablesAndAssignments = useCallback(async () => {
    let currentTables = mockTables;
    try {
      const res = await fetch("/api/tables?venue=restaurant");
      const data = await res.json();
      if (data.tables && data.tables.length > 0) {
        currentTables = data.tables;
      }
    } catch {}
    setAllTables(currentTables);

    // Load table assignments from localStorage in Mock Mode
    if (typeof window !== "undefined") {
      const savedAssig = localStorage.getItem("yali_table_assignments");
      if (savedAssig) {
        try {
          setTableAssignments(JSON.parse(savedAssig));
        } catch {}
      } else {
        // Initial default assignments for demo
        const defaultAssig: { [key: string]: string[] } = {
          [currentTables[0]?.id || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d']: ["Hüseyin"],
          [currentTables[1]?.id || 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e']: ["Hüseyin", "Ahmet"],
          [currentTables[2]?.id || 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f']: ["Ahmet"],
          [currentTables[3]?.id || 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a']: ["Zeynep"],
          [currentTables[4]?.id || 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b']: ["Hüseyin"]
        };
        setTableAssignments(defaultAssig);
        localStorage.setItem("yali_table_assignments", JSON.stringify(defaultAssig));
      }
    }
  }, []);

  // Load Orders across all active tables
  const loadOrders = useCallback(() => {
    if (typeof window === "undefined") return;

    const loadedOrders: OrderSession[] = [];
    const loadedCalls: WaiterCall[] = [];

    // Scan localStorage for active mock sessions and calls across tables
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("yali_session_")) {
        const tableId = key.replace("yali_session_", "");
        try {
          const session: OrderSession = JSON.parse(localStorage.getItem(key) || "");
          if (session && session.status !== "closed") {
            // Find table info
            const tableObj = allTables.find(t => t.id === tableId) || mockTables.find(t => t.id === tableId);
            session.table_name = tableObj?.masa_adi || `Masa ${tableObj?.masa_no || 1}`;
            session.table_no = tableObj?.masa_no || 1;
            
            // Find assigned waiters for this table
            session.assigned_waiters = tableAssignments[tableId] || [];

            // Load cart items for this table
            const cartRaw = localStorage.getItem(`yali_cart_${tableId}`);
            if (cartRaw) {
              const cartItems: CartItem[] = JSON.parse(cartRaw);
              session.cart_items = cartItems.filter(ci => ci.session_id === session.id);
            }

            loadedOrders.push(session);
          }
        } catch {}
      } else if (key && key.startsWith("yali_call_")) {
        try {
          const call: WaiterCall = JSON.parse(localStorage.getItem(key) || "");
          if (call && call.status === "pending") {
            // Enrich display name if the writer (customer tab) didn't know it
            if (!call.table_name) {
              const tableObj = allTables.find(t => t.id === call.table_id) || mockTables.find(t => t.id === call.table_id);
              call.table_name = tableObj?.masa_adi || `Masa ${tableObj?.masa_no || 1}`;
            }
            loadedCalls.push(call);
          }
        } catch {}
      }
    }

    setOrders(loadedOrders);
    setWaiterCalls(loadedCalls);
  }, [allTables, tableAssignments]);

  useEffect(() => {
    let active = true;
    // Deferred initial fetch: keeps the effect body free of synchronous
    // state updates while preserving the load-on-mount behavior.
    Promise.resolve().then(() => {
      if (active) loadTablesAndAssignments();
    });
    return () => {
      active = false;
    };
  }, [loadTablesAndAssignments]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadOrders();
    });
    return () => {
      active = false;
    };
  }, [loadOrders]);

  // Realtime Broadcast Channel Listener for Staff Panel
  useEffect(() => {
    if (typeof window === "undefined") return;

    const staffBc = new BroadcastChannel("yali_staff_events");
    staffBc.onmessage = (event) => {
      const { type } = event.data;
      if (type === "NEW_ORDER" || type === "STATUS_UPDATE" || type === "ASSIGNMENT_CHANGE") {
        loadTablesAndAssignments();
        loadOrders();
        if (type === "NEW_ORDER") {
          playAlertSound();
        }
      } else if (type === "WAITER_CALLED") {
        // The customer tab persists the call under `yali_call_<id>`;
        // here we just refresh the list and alert the staff.
        playAlertSound();
        loadOrders();
      }
    };

    // Also poll every 3 seconds for instant response across tabs in mock mode
    const interval = setInterval(() => {
      loadOrders();
    }, 3000);

    return () => {
      staffBc.close();
      clearInterval(interval);
    };
  }, [loadOrders, loadTablesAndAssignments, playAlertSound]);

  // Toggle table assignment for active waiter
  const toggleTableAssignment = (tableId: string) => {
    if (!activeWaiter) return;

    setTableAssignments(prev => {
      const currentList = prev[tableId] || [];
      const isAssigned = currentList.includes(activeWaiter.name);
      
      let newList: string[];
      if (isAssigned) {
        newList = currentList.filter(name => name !== activeWaiter.name);
      } else {
        newList = [...currentList, activeWaiter.name];
      }

      const updatedAssignments = {
        ...prev,
        [tableId]: newList
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("yali_table_assignments", JSON.stringify(updatedAssignments));
        
        // Broadcast assignment change
        const staffBc = new BroadcastChannel("yali_staff_events");
        staffBc.postMessage({ type: "ASSIGNMENT_CHANGE", payload: updatedAssignments });
        staffBc.close();
      }

      const tableObj = allTables.find(t => t.id === tableId) || mockTables.find(t => t.id === tableId);
      const tName = tableObj?.masa_adi || `Masa ${tableObj?.masa_no || 1}`;

      auditLogger.log({
        waiterName: activeWaiter.name,
        actionType: 'TABLE_ASSIGNED',
        details: `${tName} masasının sorumluluğunu ${isAssigned ? 'bıraktı' : 'üstlendi'}.`,
        tableName: tName
      });

      return updatedAssignments;
    });
  };

  // Update order status (pending_approval -> confirmed -> closed)
  const updateOrderStatus = async (sessionId: string, newStatus: OrderSession['status']) => {
    const orderToUpdate = orders.find(o => o.id === sessionId);
    if (!orderToUpdate) return;

    const tableId = orderToUpdate.table_id;
    const sessionKey = `yali_session_${tableId}`;

    const updatedSession: OrderSession = {
      ...orderToUpdate,
      status: newStatus
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(sessionKey, JSON.stringify(updatedSession));

      // Broadcast to customer page realtime channel
      const customerBc = new BroadcastChannel(`yali_realtime_${tableId}`);
      customerBc.postMessage({ type: "SESSION_UPDATE", payload: updatedSession });
      customerBc.close();

      // Broadcast to staff panel channel
      const staffBc = new BroadcastChannel("yali_staff_events");
      staffBc.postMessage({ type: "STATUS_UPDATE", payload: updatedSession });
      staffBc.close();
    }

    const orderTotal = (orderToUpdate.cart_items || []).reduce((acc, i) => acc + (i.product?.fiyat || 0) * i.adet, 0);

    auditLogger.log({
      waiterName: activeWaiter?.name || "Görevli",
      actionType: newStatus === 'confirmed' ? 'ORDER_APPROVED' : 'ORDER_CLOSED',
      details: newStatus === 'confirmed'
        ? `${orderToUpdate.table_name} masasının siparişini onayladı ve mutfağa gönderdi.`
        : `${orderToUpdate.table_name} masasının hesabını aldı ve oturumu kapattı.`,
      tableName: orderToUpdate.table_name,
      amount: orderTotal,
      venue: 'restaurant'
    });

    loadOrders();
  };

  const updateOrderCartItems = (sessionId: string, newCartItems: CartItem[]) => {
    const orderToUpdate = orders.find(o => o.id === sessionId);
    if (!orderToUpdate) return;

    const tableId = orderToUpdate.table_id;
    const cartKey = `yali_cart_${tableId}`;

    if (typeof window !== "undefined") {
      localStorage.setItem(cartKey, JSON.stringify(newCartItems));

      // Broadcast to customer table channel
      const customerBc = new BroadcastChannel(`yali_realtime_${tableId}`);
      customerBc.postMessage({ type: "CART_UPDATE", payload: newCartItems });
      customerBc.close();

      // Broadcast to staff panel channel
      const staffBc = new BroadcastChannel("yali_staff_events");
      staffBc.postMessage({ type: "STATUS_UPDATE", payload: { ...orderToUpdate, cart_items: newCartItems } });
      staffBc.close();
    }

    const newTotal = newCartItems.reduce((acc, i) => acc + (i.product?.fiyat || 0) * i.adet, 0);

    auditLogger.log({
      waiterName: activeWaiter?.name || "Görevli",
      actionType: 'ORDER_EDITED',
      details: `${orderToUpdate.table_name} siparişinde ürün güncellemesi yaptı (${newCartItems.length} çeşit ürün).`,
      tableName: orderToUpdate.table_name,
      amount: newTotal
    });

    loadOrders();
  };

  // Create or append order taken directly by a waiter (POS Mode)
  const createWaiterOrder = async (
    tableId: string,
    items: CartItem[],
    autoConfirm: boolean = true
  ): Promise<OrderSession | null> => {
    if (!tableId || items.length === 0 || !activeWaiter) return null;

    const tableObj = allTables.find(t => t.id === tableId) || mockTables.find(t => t.id === tableId);
    const tableName = tableObj?.masa_adi || `Masa ${tableObj?.masa_no || 1}`;
    const tableNo = tableObj?.masa_no || 1;

    let targetSessionId = "";
    let finalSession: OrderSession;
    let finalCartItems: CartItem[] = [];

    // Check if table already has an active session
    const existingSessionKey = `yali_session_${tableId}`;
    let existingSession: OrderSession | null = null;

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(existingSessionKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.status !== "closed") {
            existingSession = parsed;
          }
        } catch {}
      }

      if (existingSession) {
        // Append items to existing session
        targetSessionId = existingSession.id;
        const currentCartRaw = localStorage.getItem(`yali_cart_${tableId}`);
        const currentCart: CartItem[] = currentCartRaw ? JSON.parse(currentCartRaw) : [];

        // Assign current session ID to new items
        const preparedNewItems = items.map(item => ({
          ...item,
          id: item.id || ("pos_item_" + Math.random().toString(36).substring(2, 9)),
          session_id: targetSessionId
        }));

        // Merge cart items
        finalCartItems = [...currentCart];
        preparedNewItems.forEach(newItem => {
          const matchIndex = finalCartItems.findIndex(
            ci => ci.product_id === newItem.product_id && (ci.not_text || "") === (newItem.not_text || "")
          );
          if (matchIndex > -1) {
            finalCartItems[matchIndex].adet += newItem.adet;
          } else {
            finalCartItems.push(newItem);
          }
        });

        // Ensure assigned waiters list includes this active waiter
        const currentWaiters = existingSession.assigned_waiters || [];
        const updatedWaiters = currentWaiters.includes(activeWaiter.name)
          ? currentWaiters
          : [...currentWaiters, activeWaiter.name];

        finalSession = {
          ...existingSession,
          status: autoConfirm ? "confirmed" : existingSession.status,
          tur_no: (existingSession.tur_no || 1) + 1,
          assigned_waiters: updatedWaiters
        };
      } else {
        // Create brand new session
        targetSessionId = "sess_" + Math.random().toString(36).substring(2, 9);
        const preparedItems = items.map(item => ({
          ...item,
          id: item.id || ("pos_item_" + Math.random().toString(36).substring(2, 9)),
          session_id: targetSessionId
        }));
        finalCartItems = preparedItems;

        finalSession = {
          id: targetSessionId,
          table_id: tableId,
          table_name: tableName,
          table_no: tableNo,
          tur_no: 1,
          status: autoConfirm ? "confirmed" : "pending_approval",
          created_at: new Date().toISOString(),
          assigned_waiters: [activeWaiter.name],
          cart_items: finalCartItems
        };
      }

      // Save to localStorage
      localStorage.setItem(existingSessionKey, JSON.stringify(finalSession));
      localStorage.setItem(`yali_cart_${tableId}`, JSON.stringify(finalCartItems));

      // Broadcast to customer table realtime channel
      const customerBc = new BroadcastChannel(`yali_realtime_${tableId}`);
      customerBc.postMessage({ type: "SESSION_UPDATE", payload: finalSession });
      customerBc.postMessage({ type: "CART_UPDATE", payload: finalCartItems });
      customerBc.close();

      // Broadcast to staff panel channel
      const staffBc = new BroadcastChannel("yali_staff_events");
      staffBc.postMessage({ type: "NEW_ORDER", payload: finalSession });
      staffBc.close();
    } else {
      return null;
    }

    const orderTotal = items.reduce((acc, i) => acc + (i.product?.fiyat || 0) * i.adet, 0);

    auditLogger.log({
      waiterName: activeWaiter.name,
      actionType: 'ORDER_APPROVED',
      details: `${tableName} için garson tarafından doğrudan ${items.length} çeşit sipariş alındı ve mutfağa iletildi.`,
      tableName: tableName,
      amount: orderTotal,
      venue: 'restaurant'
    });

    loadOrders();
    playAlertSound();

    return finalSession;
  };

  const resolveWaiterCall = (callId: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`yali_call_${callId}`);
      loadOrders();
    }
  };

  const assignedTableIds = activeWaiter
    ? Object.keys(tableAssignments).filter(tId =>
        (tableAssignments[tId] || []).includes(activeWaiter.name)
      )
    : [];

  return (
    <StaffContext.Provider value={{
      waiters,
      activeWaiter,
      isLocked,
      loginWithPin,
      lockSession,
      addWaiter,
      deleteWaiter,
      updateWaiterPin,
      toggleWaiterActive,
      assignedTableIds,
      tableAssignments,
      toggleTableAssignment,
      orders,
      waiterCalls,
      updateOrderStatus,
      updateOrderCartItems,
      createWaiterOrder,
      resolveWaiterCall,
      refreshStaffData: async () => { loadOrders(); },
      allTables
    }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return context;
}

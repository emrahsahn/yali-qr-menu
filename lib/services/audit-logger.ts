export type AuditActionType =
  | 'ORDER_APPROVED'
  | 'ORDER_EDITED'
  | 'ORDER_CLOSED'
  | 'TABLE_ASSIGNED'
  | 'WAITER_ADDED'
  | 'WAITER_DELETED'
  | 'CALL_RESOLVED'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'PRODUCT_STATUS_CHANGED'
  | 'CATEGORY_ADDED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_DELETED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  waiterName: string;
  actionType: AuditActionType;
  details: string;
  tableName?: string;
  amount?: number;
  venue?: string;
}

const STORAGE_KEY = 'yali_audit_logs_v2';

const INITIAL_MOCK_LOGS: AuditLogEntry[] = [
  // Restaurant Logs
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    waiterName: "Hüseyin",
    actionType: "ORDER_APPROVED",
    details: "Dış 1 masasının siparişini onayladı ve mutfağa gönderdi.",
    tableName: "Dış 1",
    amount: 660,
    venue: "restaurant"
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    waiterName: "Ahmet",
    actionType: "ORDER_EDITED",
    details: "VIP 3 masasının siparişine 1x San Sebastian Cheesecake ekledi.",
    tableName: "VIP 3",
    amount: 210,
    venue: "restaurant"
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    waiterName: "Hüseyin",
    actionType: "ORDER_CLOSED",
    details: "Dış 2 masasının hesabını aldı ve oturumu kapattı.",
    tableName: "Dış 2",
    amount: 1140,
    venue: "restaurant"
  },
  {
    id: "log_4",
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(), // 40 mins ago
    waiterName: "Zeynep",
    actionType: "TABLE_ASSIGNED",
    details: "İç 4 ve İç 5 masalarının sorumluluğunu üstlendi.",
    tableName: "İç 4",
    venue: "restaurant"
  },
  // Cafe Logs
  {
    id: "log_cafe_1",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    waiterName: "Mert",
    actionType: "ORDER_APPROVED",
    details: "Bahçe 2 masasının Flat White ve Kruvasan siparişini hazırladı.",
    tableName: "Bahçe 2",
    amount: 195,
    venue: "cafe"
  },
  {
    id: "log_cafe_2",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    waiterName: "Deniz",
    actionType: "ORDER_CLOSED",
    details: "Bar 1 masasının ödemesini aldı.",
    tableName: "Bar 1",
    amount: 340,
    venue: "cafe"
  },
  // Club Logs
  {
    id: "log_club_1",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    waiterName: "Burak",
    actionType: "ORDER_APPROVED",
    details: "VIP Lounge 1 masasının kokteyl ve şampanya siparişini onayladı.",
    tableName: "VIP Lounge 1",
    amount: 3200,
    venue: "club"
  },
  {
    id: "log_club_2",
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    waiterName: "Selin",
    actionType: "CALL_RESOLVED",
    details: "Loca 4 çağrısını yanıtladı.",
    tableName: "Loca 4",
    venue: "club"
  },
  // Seafood Logs
  {
    id: "log_sea_1",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    waiterName: "Kaan",
    actionType: "ORDER_APPROVED",
    details: "İskele 3 masasının Levrek Izgara ve Kalamar siparişini mutfağa iletti.",
    tableName: "İskele 3",
    amount: 1450,
    venue: "seafood"
  },
  {
    id: "log_sea_2",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    waiterName: "Elif",
    actionType: "ORDER_CLOSED",
    details: "Teras 2 masasının hesabını kapattı.",
    tableName: "Teras 2",
    amount: 2800,
    venue: "seafood"
  }
];

export const auditLogger = {
  getLogs: (): AuditLogEntry[] => {
    if (typeof window === "undefined") return INITIAL_MOCK_LOGS;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_LOGS));
      return INITIAL_MOCK_LOGS;
    }

    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_MOCK_LOGS;
    }
  },

  log: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: "log_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };

    if (typeof window !== "undefined") {
      const logs = auditLogger.getLogs();
      const updated = [newEntry, ...logs].slice(0, 100); // Keep last 100 logs
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Broadcast to staff/admin channels
      try {
        const bc = new BroadcastChannel("yali_staff_events");
        bc.postMessage({ type: "AUDIT_LOG_ADDED", payload: newEntry });
        bc.close();
      } catch {}
    }

    return newEntry;
  }
};

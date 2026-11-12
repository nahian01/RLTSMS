import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_TEAMS,
  INITIAL_CATEGORIES,
  INITIAL_SERVICES,
  INITIAL_ACCOUNTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_CARDS,
  INITIAL_CARD_LOGS,
  INITIAL_CARD_PERMISSIONS,
  INITIAL_VENDORS,
  INITIAL_WORKFLOWS,
  INITIAL_REQUISITIONS,
  INITIAL_PURCHASES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ACCESS_REQUESTS,
  INITIAL_ACCESS_ASSIGNMENTS,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_EMAIL_LOGS,
} from '../../src/data/mockData';
import {
  User,
  Department,
  Team,
  ServiceCategory,
  CatalogueService,
  ApprovalWorkflow,
  Requisition,
  PurchaseRecord,
  ServiceAccount,
  Subscription,
  PaymentCard,
  CardAccessLog,
  CardVisibilityPermission,
  CardRevealAuditLog,
  Vendor,
  AppNotification,
  AuditLog,
  AccessRequest,
  AccountAccessAssignment,
  EmailTemplate,
  EmailDeliveryLog,
} from '../../src/types';

export function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

export interface ServerUser extends User {
  passwordHash: string;
}

export interface ServerState {
  users: ServerUser[];
  departments: Department[];
  teams: Team[];
  categories: ServiceCategory[];
  services: CatalogueService[];
  accounts: ServiceAccount[];
  subscriptions: Subscription[];
  cards: PaymentCard[];
  cardLogs: CardAccessLog[];
  cardPermissions: CardVisibilityPermission[];
  cardRevealLogs: CardRevealAuditLog[];
  vendors: Vendor[];
  workflows: ApprovalWorkflow[];
  requisitions: Requisition[];
  purchases: PurchaseRecord[];
  accessRequests: AccessRequest[];
  accessAssignments: AccountAccessAssignment[];
  emailTemplates: EmailTemplate[];
  emailLogs: EmailDeliveryLog[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  systemSettings: Record<string, any>;
}

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const DEFAULT_PASS_HASH = hashPassword('RiseupLabs@2026', 'riseuplabs_salt_2026');

function createDefaultState(): ServerState {
  const usersWithHash: ServerUser[] = INITIAL_USERS.map((u) => ({
    ...u,
    passwordHash: DEFAULT_PASS_HASH,
  }));

  return {
    users: usersWithHash,
    departments: INITIAL_DEPARTMENTS,
    teams: INITIAL_TEAMS,
    categories: INITIAL_CATEGORIES,
    services: INITIAL_SERVICES,
    accounts: INITIAL_ACCOUNTS,
    subscriptions: INITIAL_SUBSCRIPTIONS,
    cards: INITIAL_CARDS,
    cardLogs: INITIAL_CARD_LOGS,
    cardPermissions: INITIAL_CARD_PERMISSIONS,
    cardRevealLogs: [],
    vendors: INITIAL_VENDORS,
    workflows: INITIAL_WORKFLOWS,
    requisitions: INITIAL_REQUISITIONS,
    purchases: INITIAL_PURCHASES,
    accessRequests: INITIAL_ACCESS_REQUESTS,
    accessAssignments: INITIAL_ACCESS_ASSIGNMENTS,
    emailTemplates: INITIAL_EMAIL_TEMPLATES,
    emailLogs: INITIAL_EMAIL_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    systemSettings: {
      fiscalYearStart: '07',
      currencyDefault: 'USD',
      cardMaskTimeoutSeconds: 30,
      appName: 'RLTSMS',
      companyName: 'Riseup Labs',
    },
  };
}

class Store {
  private state: ServerState;

  constructor() {
    this.state = this.load();
  }

  private load(): ServerState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e: any) {
      console.warn('[Store] Could not read store.json, creating initial state.', e.message);
    }
    const def = createDefaultState();
    this.save(def);
    return def;
  }

  private save(data?: ServerState): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(data || this.state, null, 2), 'utf8');
    } catch (e: any) {
      console.error('[Store] Failed to save store.json:', e.message);
    }
  }

  public getState(): ServerState {
    return this.state;
  }

  public mutate<T>(fn: (state: ServerState) => T): T {
    const result = fn(this.state);
    this.save();
    return result;
  }

  public reset(): void {
    this.state = createDefaultState();
    this.save();
  }
}

export const dbStore = new Store();

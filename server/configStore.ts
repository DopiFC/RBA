import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, 'app-config.json');

export interface AppConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  appsScriptUrl: string;
  updatedAt?: string;
}

const DEFAULT_CONFIG: AppConfig = {
  spreadsheetId: '13t07Qp8vM-znpW23_zqlw1lAAAV08j1gD-4hJCdvOQ0',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/13t07Qp8vM-znpW23_zqlw1lAAAV08j1gD-4hJCdvOQ0/edit?usp=sharing',
  appsScriptUrl: process.env.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxVN0LDgIB5PzS2ValE0TbZINZb2UponE4dZcWsQ-VZoROx1_82ldPY3zBaX3SPgHeM/exec',
};

class ConfigStore {
  private config: AppConfig;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.config = { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (err) {
      console.warn('[ConfigStore] Failed to load config from disk, using defaults:', err);
    }
  }

  public get(): AppConfig {
    return { ...this.config };
  }

  public setAppsScriptUrl(url: string): AppConfig {
    this.config.appsScriptUrl = url.trim();
    this.config.updatedAt = new Date().toISOString();
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ConfigStore] Failed to save config to disk:', err);
    }
    return { ...this.config };
  }
}

export const configStore = new ConfigStore();

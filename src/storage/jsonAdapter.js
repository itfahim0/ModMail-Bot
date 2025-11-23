import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => { });

/**
 * JSON File Adapter for Announcement System
 * Implements the Pluggable Storage Interface
 */
export class JsonStorageAdapter {
    constructor() {
        this.files = {
            optins: path.join(DATA_DIR, 'optins.json'),
            announcements: path.join(DATA_DIR, 'announcements.json'),
            dmlogs: path.join(DATA_DIR, 'dmlogs.json'),
            guildConfig: path.join(DATA_DIR, 'guild_config.json')
        };
        this.locks = new Map(); // Simple in-memory lock
    }

    async init() {
        for (const file of Object.values(this.files)) {
            try {
                await fs.access(file);
            } catch {
                await fs.writeFile(file, JSON.stringify([], null, 2));
            }
        }
        console.log('📦 JSON Storage Adapter Initialized');
    }

    // --- Helper: Atomic Read/Write ---
    async _read(type) {
        try {
            const data = await fs.readFile(this.files[type], 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    async _write(type, data) {
        // Simple mutex to prevent race conditions in single process
        while (this.locks.get(type)) await new Promise(r => setTimeout(r, 10));
        this.locks.set(type, true);
        try {
            const tempFile = `${this.files[type]}.tmp`;
            await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
            await fs.rename(tempFile, this.files[type]);
        } finally {
            this.locks.set(type, false);
        }
    }

    // --- Opt-Ins ---
    async getOptIn(guildId, userId) {
        const list = await this._read('optins');
        return list.find(o => o.guildId === guildId && o.userId === userId);
    }

    async setOptIn(optInObj) {
        const list = await this._read('optins');
        const index = list.findIndex(o => o.guildId === optInObj.guildId && o.userId === optInObj.userId);
        if (index >= 0) {
            list[index] = { ...list[index], ...optInObj, updatedAt: Date.now() };
        } else {
            list.push({ ...optInObj, createdAt: Date.now(), updatedAt: Date.now() });
        }
        await this._write('optins', list);
    }

    async listOptIns(guildId) {
        const list = await this._read('optins');
        return list.filter(o => o.guildId === guildId && o.status === 'active');
    }

    // --- Announcements ---
    async createAnnouncement(announcementObj) {
        const list = await this._read('announcements');
        const newObj = { ...announcementObj, id: Date.now().toString(), status: 'DRAFT', createdAt: Date.now() };
        list.push(newObj);
        await this._write('announcements', list);
        return newObj;
    }

    async getAnnouncement(id) {
        const list = await this._read('announcements');
        return list.find(a => a.id === id);
    }

    async updateAnnouncement(id, patch) {
        const list = await this._read('announcements');
        const index = list.findIndex(a => a.id === id);
        if (index === -1) throw new Error('Announcement not found');

        list[index] = { ...list[index], ...patch, updatedAt: Date.now() };
        await this._write('announcements', list);
        return list[index];
    }

    async listAnnouncements(filter = {}) {
        const list = await this._read('announcements');
        return list.filter(a => {
            let match = true;
            if (filter.status) match = match && a.status === filter.status;
            if (filter.guildId) match = match && a.guildId === filter.guildId;
            return match;
        });
    }

    // --- DM Logs ---
    async appendDmLog(logObj) {
        const list = await this._read('dmlogs');
        list.push({ ...logObj, id: Date.now().toString() + Math.random(), timestamp: Date.now() });
        await this._write('dmlogs', list);
    }

    async getDmLogs(announcementId) {
        const list = await this._read('dmlogs');
        return list.filter(l => l.announcementId === announcementId);
    }
}

export const storage = new JsonStorageAdapter();

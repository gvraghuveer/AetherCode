"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
const sqlite3 = __importStar(require("sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class MemoryService {
    constructor(storagePath) {
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        this.dbPath = path.join(storagePath, 'aethercode.db');
    }
    runAsync(sql, params) {
        return new Promise((resolve, reject) => {
            const callback = (err) => err ? reject(err) : resolve();
            if (params) {
                this.db.run(sql, params, callback);
            }
            else {
                this.db.run(sql, callback);
            }
        });
    }
    allAsync(sql, params) {
        return new Promise((resolve, reject) => {
            const callback = (err, rows) => err ? reject(err) : resolve(rows);
            if (params) {
                this.db.all(sql, params, callback);
            }
            else {
                this.db.all(sql, callback);
            }
        });
    }
    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Database initialization failed:', err);
                    reject(err);
                    return;
                }
                this.createTables().then(resolve).catch(reject);
            });
        });
    }
    async createTables() {
        await this.runAsync(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        path TEXT,
        lastActive TEXT
      )
    `);
        await this.runAsync(`
      CREATE TABLE IF NOT EXISTS tree_nodes (
        id TEXT PRIMARY KEY,
        projectId TEXT,
        type TEXT,
        prompt TEXT,
        solution TEXT,
        errors TEXT,
        metrics TEXT,
        parentId TEXT,
        createdAt TEXT
      )
    `);
        await this.runAsync(`
      CREATE TABLE IF NOT EXISTS error_patterns (
        id TEXT PRIMARY KEY,
        errorType TEXT,
        pattern TEXT UNIQUE,
        frequency INTEGER DEFAULT 1,
        lastSeen TEXT,
        fixStrategy TEXT,
        successRate REAL DEFAULT 0.0
      )
    `);
        await this.runAsync(`
      CREATE TABLE IF NOT EXISTS user_patterns (
        id TEXT PRIMARY KEY,
        patternType TEXT,
        content TEXT,
        frequency INTEGER,
        lastUsed TEXT
      )
    `);
    }
    async saveTreeNode(node) {
        const now = new Date().toISOString();
        await this.runAsync(`INSERT INTO tree_nodes 
       (id, projectId, type, prompt, solution, errors, metrics, parentId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [node.id, node.projectId, node.type, node.prompt, node.solution || null,
            node.errors || null, node.metrics, node.parentId || null, now]);
    }
    async getProjectTree(projectId) {
        const rows = await this.allAsync('SELECT * FROM tree_nodes WHERE projectId = ? ORDER BY createdAt', [projectId]);
        return rows;
    }
    async recordError(errorType, pattern, fixStrategy, success) {
        const now = new Date().toISOString();
        await this.runAsync(`INSERT INTO error_patterns 
       (id, errorType, pattern, lastSeen, fixStrategy, successRate)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(pattern) DO UPDATE SET 
         frequency = frequency + 1,
         lastSeen = ?,
         successRate = (successRate * frequency + ?) / (frequency + 1)`, [`err_${Date.now()}`, errorType, pattern, now, fixStrategy, success ? 1 : 0, now, success ? 1 : 0]);
    }
    async getSimilarErrors(limit = 5) {
        const rows = await this.allAsync('SELECT * FROM error_patterns ORDER BY frequency DESC LIMIT ?', [limit]);
        return rows;
    }
    close() {
        if (this.db)
            this.db.close();
    }
}
exports.MemoryService = MemoryService;
//# sourceMappingURL=sqlite.js.map
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface TreeNode {
  id: string;
  projectId: string;
  type: 'task' | 'decision' | 'error' | 'optimization';
  prompt: string;
  solution?: string;
  errors?: string;
  metrics: string;
  parentId?: string;
  createdAt: string;
}

export interface ErrorPattern {
  id: string;
  errorType: string;
  pattern: string;
  frequency: number;
  lastSeen: string;
  fixStrategy: string;
  successRate: number;
}

export class MemoryService {
  private db!: sqlite3.Database;
  private dbPath: string;

  constructor(storagePath: string) {
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    this.dbPath = path.join(storagePath, 'aethercode.db');
  }

  private runAsync(sql: string, params?: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (err: Error | null) => err ? reject(err) : resolve();
      if (params) {
        this.db.run(sql, params, callback);
      } else {
        this.db.run(sql, callback);
      }
    });
  }

  private allAsync(sql: string, params?: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const callback = (err: Error | null, rows: any[]) => err ? reject(err) : resolve(rows);
      if (params) {
        this.db.all(sql, params, callback);
      } else {
        this.db.all(sql, callback);
      }
    });
  }

  async init(): Promise<void> {
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

  private async createTables(): Promise<void> {
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

  async saveTreeNode(node: Omit<TreeNode, 'createdAt'>): Promise<void> {
    const now = new Date().toISOString();

    await this.runAsync(
      `INSERT INTO tree_nodes 
       (id, projectId, type, prompt, solution, errors, metrics, parentId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [node.id, node.projectId, node.type, node.prompt, node.solution || null, 
       node.errors || null, node.metrics, node.parentId || null, now]
    );
  }

  async getProjectTree(projectId: string): Promise<TreeNode[]> {
    const rows = await this.allAsync(
      'SELECT * FROM tree_nodes WHERE projectId = ? ORDER BY createdAt',
      [projectId]
    );
    return rows as TreeNode[];
  }

  async recordError(errorType: string, pattern: string, fixStrategy: string, success: boolean): Promise<void> {
    const now = new Date().toISOString();

    await this.runAsync(
      `INSERT INTO error_patterns 
       (id, errorType, pattern, lastSeen, fixStrategy, successRate)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(pattern) DO UPDATE SET 
         frequency = frequency + 1,
         lastSeen = ?,
         successRate = (successRate * frequency + ?) / (frequency + 1)`,
      [`err_${Date.now()}`, errorType, pattern, now, fixStrategy, success ? 1 : 0, now, success ? 1 : 0]
    );
  }

  async getSimilarErrors(limit = 5): Promise<ErrorPattern[]> {
    const rows = await this.allAsync(
      'SELECT * FROM error_patterns ORDER BY frequency DESC LIMIT ?',
      [limit]
    );
    return rows as ErrorPattern[];
  }

  close(): void {
    if (this.db) this.db.close();
  }
}
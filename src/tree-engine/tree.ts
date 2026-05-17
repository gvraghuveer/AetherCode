import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid

export interface TreeNodeData {
  id: string;
  type: 'task' | 'decision' | 'error' | 'optimization';
  prompt: string;
  solution?: string;
  errors?: any[];
  metrics: {
    success: number;      // 0-1
    confidence: number;   // 0-1
    mse?: number;
    reward?: number;
  };
  children: string[];
  parentId?: string;
  timestamp: string;
}

export class TreeEngine {
  private nodes: Map<string, TreeNodeData> = new Map();

  createRootTask(prompt: string): string {
    const id = uuidv4();
    this.nodes.set(id, {
      id,
      type: 'task',
      prompt,
      metrics: { success: 0, confidence: 0.8 },
      children: [],
      timestamp: new Date().toISOString()
    });
    return id;
  }

  addChild(parentId: string, type: TreeNodeData['type'], prompt: string): string {
    const parent = this.nodes.get(parentId);
    if (!parent) throw new Error('Parent node not found');

    const id = uuidv4();
    this.nodes.set(id, {
      id,
      type,
      prompt,
      metrics: { success: 0, confidence: 0.7 },
      children: [],
      parentId,
      timestamp: new Date().toISOString()
    });

    parent.children.push(id);
    return id;
  }

  updateNode(id: string, updates: Partial<TreeNodeData>) {
    const node = this.nodes.get(id);
    if (node) {
      Object.assign(node, updates);
      // Auto-calculate reward
      if (updates.metrics) {
        node.metrics.reward = (updates.metrics.success * 0.7) + (updates.metrics.confidence * 0.3);
      }
    }
  }

  getBestPath(rootId: string): TreeNodeData[] {
    const path: TreeNodeData[] = [];
    let current = this.nodes.get(rootId);

    while (current) {
      path.push(current);
      if (current.children.length === 0) break;

      // Select best child by reward/confidence
      let bestChild: string | null = null;
      let bestScore = -1;

      for (const childId of current.children) {
        const child = this.nodes.get(childId);
        if (child) {
          const score = (child.metrics.reward || 0) * child.metrics.confidence;
          if (score > bestScore) {
            bestScore = score;
            bestChild = childId;
          }
        }
      }

      current = bestChild ? this.nodes.get(bestChild) : undefined;
    }
    return path;
  }

  getNode(id: string): TreeNodeData | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): TreeNodeData[] {
    return Array.from(this.nodes.values());
  }

  // Backtracking & Self-Improvement
  backtrackAndImprove(nodeId: string, newSolution: string, successScore: number) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.solution = newSolution;
      node.metrics.success = successScore;
      node.metrics.confidence = Math.min(1, node.metrics.confidence + 0.1);
    }
  }
}
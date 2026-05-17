"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeEngine = void 0;
const uuid_1 = require("uuid"); // npm install uuid @types/uuid
class TreeEngine {
    constructor() {
        this.nodes = new Map();
    }
    createRootTask(prompt) {
        const id = (0, uuid_1.v4)();
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
    addChild(parentId, type, prompt) {
        const parent = this.nodes.get(parentId);
        if (!parent)
            throw new Error('Parent node not found');
        const id = (0, uuid_1.v4)();
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
    updateNode(id, updates) {
        const node = this.nodes.get(id);
        if (node) {
            Object.assign(node, updates);
            // Auto-calculate reward
            if (updates.metrics) {
                node.metrics.reward = (updates.metrics.success * 0.7) + (updates.metrics.confidence * 0.3);
            }
        }
    }
    getBestPath(rootId) {
        const path = [];
        let current = this.nodes.get(rootId);
        while (current) {
            path.push(current);
            if (current.children.length === 0)
                break;
            // Select best child by reward/confidence
            let bestChild = null;
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
    getNode(id) {
        return this.nodes.get(id);
    }
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    // Backtracking & Self-Improvement
    backtrackAndImprove(nodeId, newSolution, successScore) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.solution = newSolution;
            node.metrics.success = successScore;
            node.metrics.confidence = Math.min(1, node.metrics.confidence + 0.1);
        }
    }
}
exports.TreeEngine = TreeEngine;
//# sourceMappingURL=tree.js.map
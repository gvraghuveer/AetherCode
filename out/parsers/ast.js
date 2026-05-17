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
exports.ASTParser = void 0;
const ts = __importStar(require("typescript"));
class ASTParser {
    static analyzeTypeScript(code, fileName = 'file.tsx') {
        const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);
        const metrics = {
            functionCount: 0,
            classCount: 0,
            importCount: 0,
            complexity: 0,
            hasTypes: false,
            linesOfCode: code.split('\n').length
        };
        function visit(node) {
            // Count Functions
            if (ts.isFunctionDeclaration(node) ||
                ts.isArrowFunction(node) ||
                ts.isMethodDeclaration(node)) {
                metrics.functionCount++;
                metrics.complexity += 2; // Rough heuristic
            }
            // Count Classes
            if (ts.isClassDeclaration(node)) {
                metrics.classCount++;
            }
            // Count Imports
            if (ts.isImportDeclaration(node)) {
                metrics.importCount++;
            }
            // Detect Type Usage
            if (ts.isTypeNode(node) ||
                ts.isTypeReferenceNode(node) ||
                ts.isInterfaceDeclaration(node) ||
                ts.isTypeAliasDeclaration(node)) {
                metrics.hasTypes = true;
            }
            // Traverse children
            ts.forEachChild(node, visit);
        }
        visit(sourceFile);
        return metrics;
    }
    static analyzeComplexity(code) {
        const lowerCode = code.toLowerCase();
        if (lowerCode.includes('for (let i = 0') && lowerCode.includes('for (let j = 0')) {
            return {
                time: "O(n²)",
                space: "O(1)",
                notes: "Nested loops detected"
            };
        }
        if (lowerCode.includes('.sort(') || lowerCode.includes('quicksort') || lowerCode.includes('mergesort')) {
            return {
                time: "O(n log n)",
                space: "O(log n)",
                notes: "Sorting algorithm detected"
            };
        }
        if (lowerCode.includes('map(') || lowerCode.includes('filter(') || lowerCode.includes('reduce(')) {
            return {
                time: "O(n)",
                space: "O(n)",
                notes: "Functional array operations"
            };
        }
        return {
            time: "O(n)",
            space: "O(1)",
            notes: "Linear complexity"
        };
    }
}
exports.ASTParser = ASTParser;
//# sourceMappingURL=ast.js.map
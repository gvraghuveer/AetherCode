import * as ts from 'typescript';

export interface ASTMetrics {
  functionCount: number;
  classCount: number;
  importCount: number;
  complexity: number;
  hasTypes: boolean;
  linesOfCode: number;
}

export class ASTParser {
  static analyzeTypeScript(code: string, fileName: string = 'file.tsx'): ASTMetrics {
    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.Latest,
      true
    );

    const metrics: ASTMetrics = {
      functionCount: 0,
      classCount: 0,
      importCount: 0,
      complexity: 0,
      hasTypes: false,
      linesOfCode: code.split('\n').length
    };

    function visit(node: ts.Node) {
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

  static analyzeComplexity(code: string): { 
    time: string; 
    space: string; 
    notes: string 
  } {
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
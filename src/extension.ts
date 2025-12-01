import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const selectionStatus =
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);

  selectionStatus.tooltip = "Selection: lines and characters";
  context.subscriptions.push(selectionStatus);

  const updateStatus = () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      selectionStatus.hide();
      return;
    }

    const selections = editor.selections;
    if (!selections || selections.length === 0) {
      selectionStatus.hide();
      return;
    }

    const single = selections.length === 1 && selections[0].isEmpty;
    if (single) {
      selectionStatus.hide();
      return;
    }

    let totalLines = 0;

    for (const sel of selections) {
      const startLine = sel.start.line;
      const endLine = sel.end.line;
      const lines = Math.abs(endLine - startLine) + 1;
      totalLines += lines;
    }

    const linesText = totalLines === 1 ? "1 line" : `${totalLines} lines`;

    selectionStatus.text = `Sel ${linesText}`;
    selectionStatus.show();
  };

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(updateStatus),
    vscode.window.onDidChangeActiveTextEditor(updateStatus),
    vscode.workspace.onDidChangeTextDocument((_) => updateStatus())
  );

  updateStatus();

  const nextErrordisposable =
    vscode.commands.registerCommand('chimera.nextError', () => nextError(context));
  const alignDisposable =
    vscode.commands.registerCommand('chimera.alignCursors', () => alignCursors());
  const addNumbersToCursorsDisposable =
    vscode.commands.registerCommand('chimera.addNumbersToCursors', () => addNumbersToCursors());
  const cycleCasingDisposable =
    vscode.commands.registerCommand('chimera.cycleCasing', () => cycleCasing());
  const uniqueLinesDisposable =
    vscode.commands.registerCommand('chimera.uniqueLines', () => uniqueLines());
  const reverseLinesDisposable =
    vscode.commands.registerCommand('chimera.reverseLines', () => reverseLines());
  const shuffleLinesDisposable =
    vscode.commands.registerCommand('chimera.shuffleLines', () => shuffleLines());
  const sortLinesDisposable =
    vscode.commands.registerCommand('chimera.sortLines', () => sortLines(false));
  const sortLinesCaseSensitiveDisposable =
    vscode.commands.registerCommand('chimera.sortLinesCaseSensitive', () => sortLines(true));
  const splitArgumentsDisposable =
    vscode.commands.registerCommand('chimera.splitArguments', () => splitArguments());
  const unsplitArgumentsDisposable =
    vscode.commands.registerCommand('chimera.unsplitArguments', () => unsplitArguments());
  const scrollUpFastDisposable =
    vscode.commands.registerCommand('chimera.scrollUpFast', () => scrollFast('up'));
  const scrollDownFastDisposable =
    vscode.commands.registerCommand('chimera.scrollDownFast', () => scrollFast('down'));

  context.subscriptions.push(
    nextErrordisposable,
    alignDisposable,
    addNumbersToCursorsDisposable,
    cycleCasingDisposable,
    uniqueLinesDisposable,
    reverseLinesDisposable,
    shuffleLinesDisposable,
    sortLinesDisposable,
    sortLinesCaseSensitiveDisposable,
    splitArgumentsDisposable,
    unsplitArgumentsDisposable,
    scrollUpFastDisposable,
    scrollDownFastDisposable
  );
}

export const scrollFast = async (direction: 'up' | 'down') => {
  const config = vscode.workspace.getConfiguration('chimera');
  const lineCount = config.get<number>('scrollFastLineCount', 3);

  await vscode.commands.executeCommand('cursorMove', {
    to: direction,
    by: 'line',
    value: lineCount,
    select: false
  });
};

export const nextError = async (context: vscode.ExtensionContext) => {
  const allDiagnostics = vscode.languages.getDiagnostics();
  let errors: { uri: vscode.Uri; diag: vscode.Diagnostic }[] = [];

  for (const [uri, diags] of allDiagnostics) {
    for (const d of diags) {
      if (d.severity === vscode.DiagnosticSeverity.Error) {
        errors.push({ uri, diag: d });
      }
    }
  }

  if (errors.length === 0) {
    vscode.window.showInformationMessage("No errors in workspace.");
    return;
  }

  errors.sort((a, b) => {
    if (a.uri.fsPath !== b.uri.fsPath) {
      return a.uri.fsPath.localeCompare(b.uri.fsPath);
    }
    if (a.diag.range.start.line !== b.diag.range.start.line) {
      return a.diag.range.start.line - b.diag.range.start.line;
    }
    return a.diag.range.start.character - b.diag.range.start.character;
  });

  const lastIndex = context.workspaceState.get<number>('chimera.lastErrorIndex', -1);
  const nextIndex = (lastIndex + 1) % errors.length;

  const err = errors[nextIndex];

  await context.workspaceState.update('chimera.lastErrorIndex', nextIndex);

  const doc = await vscode.workspace.openTextDocument(err.uri);
  const newEditor = await vscode.window.showTextDocument(doc);

  newEditor.revealRange(err.diag.range, vscode.TextEditorRevealType.InCenter);
  newEditor.selection = new vscode.Selection(err.diag.range.start, err.diag.range.start);
};

export const alignCursors = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const selections = editor.selections;
  if (!selections || selections.length < 2) {
    return;
  }

  let maxCol = 0;
  for (const selection of selections) {
    if (selection.active.character > maxCol) {
      maxCol = selection.active.character;
    }
  }

  await editor.edit((editBuilder) => {
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const currentCol = selection.active.character;
      let spacesNeeded = maxCol - currentCol;
      if (spacesNeeded > 0) {
        editBuilder.insert(selection.active, ' '.repeat(spacesNeeded));
      }
    }
  });
};

export const addNumbersToCursors = async (startNumberArg?: number) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const selections = editor.selections;
  if (!selections || selections.length < 2) {
    return;
  }

  let startNumber = 0;
  if (startNumberArg !== undefined) {
    startNumber = startNumberArg;
  } else {
    const startNumberStr = await vscode.window.showInputBox({
      placeHolder: 'Starting number (default: 0)',
      validateInput: (text) => {
        if (!text) {
          return null;
        }
        return isNaN(Number(text)) ? 'Please enter a valid number' : null;
      }
    });

    if (startNumberStr === undefined) {
      return;
    }
    startNumber = startNumberStr ? Number(startNumberStr) : 0;
  }

  await editor.edit((editBuilder) => {
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      editBuilder.replace(selection, "" + (i + startNumber));
    }
  });
};

let originalSelectionsText: string[] = [];
let lastResultSelections: readonly vscode.Selection[] = [];
type CaseType = 'camel' | 'pascal' | 'upper' | 'upperSnake' | 'snake' | 'snakeCamel' | 'snakePascal' | 'kebab' | 'upperKebab' | 'lower';

export const cycleCasing = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const selections = editor.selections;
  if (!selections || selections.length === 0) {
    return;
  }

  const config = vscode.workspace.getConfiguration('chimera');
  const cycleOrder = config.get<CaseType[]>('cycleCasingOrder', [
    'camel', 'pascal', 'upper', 'upperSnake', 'snakePascal', 'snakeCamel', 'kebab', 'upperKebab', 'lower'
  ]);

  let isContinuing = false;
  if (lastResultSelections.length === selections.length) {
    isContinuing = true;
    for (let i = 0; i < selections.length; i++) {
      if (!selections[i].isEqual(lastResultSelections[i])) {
        isContinuing = false;
        break;
      }
    }
  }

  if (!isContinuing) {
    originalSelectionsText = [];
    for (let i = 0; i < selections.length; i++) {
      const currentText = editor.document.getText(selections[i]);
      originalSelectionsText.push(currentText);
    }
  }
  await editor.edit((editBuilder) => {
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      if (selection.isEmpty) {
        continue;
      }
      const originalText = originalSelectionsText[i];
      const currentText = editor.document.getText(selection);
      const currentCase = detectCase(currentText);

      const currentIndex = cycleOrder.indexOf(currentCase);
      const nextIndex = (currentIndex + 1) % cycleOrder.length;
      const nextCase = cycleOrder[nextIndex];

      const converter = caseConverters[nextCase];
      const newText = converter(originalText);

      editBuilder.replace(selection, newText);
    }
  });

  lastResultSelections = [...editor.selections];
};
const detectCase = (text: string): CaseType => {
  if (!text || text.length === 0) {
    return 'lower';
  }

  if (text.includes('-')) {
    if (text === text.toUpperCase() && text !== text.toLowerCase()) {
      return 'upperKebab';
    }
    return 'kebab';
  }

  if (text.includes('_')) {
    if (text === text.toUpperCase() && text !== text.toLowerCase()) {
      return 'upperSnake';
    }
    const hasUpperAfterUnderscore = /_[A-Z]/.test(text);
    if (hasUpperAfterUnderscore) {
      if (/^[A-Z]/.test(text)) {
        return 'snakePascal';
      }
      return 'snakeCamel';
    }
    return 'snake';
  }
  if (text === text.toUpperCase() && text !== text.toLowerCase()) {
    return 'upper';
  }
  if (text === text.toLowerCase()) {
    return 'lower';
  }
  if (/^[A-Z]/.test(text)) {
    return 'pascal';
  }

  return 'camel';
};
const toCamelCase = (text: string): string => {
  const words = text
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/);

  if (words.length === 0) {
    return text;
  }

  return words[0] + words.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
};
const toPascalCase = (text: string): string => {
  const words = text
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/);

  if (words.length === 0) {
    return text;
  }

  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
};
const toUpperSnakeCase = (text: string): string => {
  const words = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/);

  if (words.length === 0) {
    return text;
  }

  return words.join('_').toUpperCase();
};
const toSnakeCase = (text: string): string => {
  const words = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/);

  if (words.length === 0) {
    return text;
  }

  return words.join('_');
};
const toSnakeCamelCase = (text: string): string => {
  const words = text
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/);

  if (words.length === 0) {
    return text;
  }

  return words[0] + words.slice(1).map(word => '_' + word.charAt(0).toUpperCase() + word.slice(1)).join('');
};
const toSnakePascalCase = (text: string): string => {
  const words = text
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/);

  if (words.length === 0) {
    return text;
  }

  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
};
const toKebabCase = (text: string): string => {
  return text
    .replace(/([A-Z])/g, '-$1')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .toLowerCase();
};
const toUpperKebabCase = (text: string): string => {
  return text
    .replace(/([A-Z])/g, '-$1')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .toUpperCase();
};

const caseConverters: Record<CaseType, (text: string) => string> = {
  camel: toCamelCase,
  pascal: toPascalCase,
  upper: (text: string) => text.toUpperCase(),
  upperSnake: toUpperSnakeCase,
  snake: toSnakeCase,
  snakeCamel: toSnakeCamelCase,
  snakePascal: toSnakePascalCase,
  kebab: toKebabCase,
  upperKebab: toUpperKebabCase,
  lower: (text: string) => text.replace(/[-_]/g, '').toLowerCase()
};

export const uniqueLines = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const selections = editor.selections;

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      let range: vscode.Range;

      if (selection.isEmpty) {
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        range = new vscode.Range(firstLine.range.start, lastLine.range.end);
      } else {
        const startLine = document.lineAt(selection.start.line);
        const endLine = document.lineAt(selection.end.line);
        range = new vscode.Range(startLine.range.start, endLine.range.end);
      }

      const text = document.getText(range);
      const lines = text.split('\n');

      const seen = new Set<string>();
      const uniqueLines: string[] = [];

      for (const line of lines) {
        if (!seen.has(line)) {
          seen.add(line);
          uniqueLines.push(line);
        }
      }

      const newText = uniqueLines.join('\n');
      editBuilder.replace(range, newText);
    }
  });
};

export const reverseLines = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const selections = editor.selections;

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      let range: vscode.Range;

      if (selection.isEmpty) {
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        range = new vscode.Range(firstLine.range.start, lastLine.range.end);
      } else {
        const startLine = document.lineAt(selection.start.line);
        const endLine = document.lineAt(selection.end.line);
        range = new vscode.Range(startLine.range.start, endLine.range.end);
      }

      const text = document.getText(range);
      const lines = text.split('\n');
      const reversedLines = lines.reverse();
      const newText = reversedLines.join('\n');
      editBuilder.replace(range, newText);
    }
  });
};

export const shuffleLines = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const selections = editor.selections;

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      let range: vscode.Range;

      if (selection.isEmpty) {
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        range = new vscode.Range(firstLine.range.start, lastLine.range.end);
      } else {
        const startLine = document.lineAt(selection.start.line);
        const endLine = document.lineAt(selection.end.line);
        range = new vscode.Range(startLine.range.start, endLine.range.end);
      }

      const text = document.getText(range);
      const lines = text.split('\n');

      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }

      const newText = lines.join('\n');
      editBuilder.replace(range, newText);
    }
  });
};

export const sortLines = async (caseSensitive: boolean) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const selections = editor.selections;

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      let range: vscode.Range;

      if (selection.isEmpty) {
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        range = new vscode.Range(firstLine.range.start, lastLine.range.end);
      } else {
        const startLine = document.lineAt(selection.start.line);
        const endLine = document.lineAt(selection.end.line);
        range = new vscode.Range(startLine.range.start, endLine.range.end);
      }

      const text = document.getText(range);
      const lines = text.split('\n');

      if (caseSensitive) {
        lines.sort();
      } else {
        lines.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      }

      const newText = lines.join('\n');
      editBuilder.replace(range, newText);
    }
  });
};

const smartSplit = (text: string): string[] => {
  const parts: string[] = [];
  let currentPart = '';
  let inQuote: string | null = null;
  let parenLevel = 0;
  let braceLevel = 0;
  let bracketLevel = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuote) {
      currentPart += char;
      if (char === inQuote && text[i - 1] !== '\\') {
        inQuote = null;
      }
    } else {
      switch (char) {
        case '"':
        case "'":
        case '`':
          inQuote = char;
          currentPart += char;
          break;
        case '(': parenLevel++; currentPart += char; break;
        case ')': parenLevel--; currentPart += char; break;
        case '{': braceLevel++; currentPart += char; break;
        case '}': braceLevel--; currentPart += char; break;
        case '[': bracketLevel++; currentPart += char; break;
        case ']': bracketLevel--; currentPart += char; break;
        case ',':
          if (parenLevel === 0 && braceLevel === 0 && bracketLevel === 0) {
            parts.push(currentPart.trim());
            currentPart = '';
          } else {
            currentPart += char;
          }
          break;
        default:
          currentPart += char;
      }
    }
  }
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }
  return parts;
};

export const splitArguments = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const selections = editor.selections;

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      if (selection.isEmpty) {
        continue;
      }

      const text = editor.document.getText(selection);

      const parts = smartSplit(text);

      const newText = parts.join(',\n');
      editBuilder.replace(selection, newText);
    }
  });
};

export const unsplitArguments = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const selections = editor.selections;

  await editor.edit((editBuilder) => {
    for (const selection of selections) {
      if (selection.isEmpty) {
        continue;
      }

      const startLine = document.lineAt(selection.start.line);
      const endLine = document.lineAt(selection.end.line);
      const range = new vscode.Range(startLine.range.start, endLine.range.end);

      const text = document.getText(range);
      const lines = text.split('\n');

      const trimmedLines = lines.map(line => line.trim());

      const newText = trimmedLines.reduce((acc, curr, idx) => {
        if (idx === 0) {
          return curr;
        }
        const prev = trimmedLines[idx - 1];
        if (prev.endsWith(',')) {
          return acc + curr;
        }
        return acc + ' ' + curr;
      }, '');
      editBuilder.replace(range, newText);
    }
  });
};

export function deactivate() { }

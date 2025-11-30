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
    vscode.commands.registerCommand('my-extension.nextError', () => nextError(context));
  const alignDisposable = 
    vscode.commands.registerCommand('my-extension.alignCursors', () => alignCursors());
  const addNumbersToCursorsDisposable = 
    vscode.commands.registerCommand('my-extension.addNumbersToCursors', () => addNumbersToCursors());
  const cycleCasingDisposable = 
    vscode.commands.registerCommand('my-extension.cycleCasing', () => cycleCasing());
  const scrollUpFastDisposable = 
    vscode.commands.registerCommand('my-extension.scrollUpFast', () => scrollFast('up'));
  const scrollDownFastDisposable = 
    vscode.commands.registerCommand('my-extension.scrollDownFast', () => scrollFast('down'));

  context.subscriptions.push(
    nextErrordisposable,
    alignDisposable,
    addNumbersToCursorsDisposable,
    cycleCasingDisposable,
    scrollUpFastDisposable,
    scrollDownFastDisposable
  );
}

export const scrollFast = async (direction: 'up' | 'down') => {
  const config = vscode.workspace.getConfiguration('my-extension');
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

  const lastIndex = context.workspaceState.get<number>('my-extension.lastErrorIndex', -1);
  const nextIndex = (lastIndex + 1) % errors.length;

  const err = errors[nextIndex];

  await context.workspaceState.update('my-extension.lastErrorIndex', nextIndex);

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
      return; // User cancelled
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
      let newText: string;
      switch (currentCase) {
        case 'camel':
          newText = toPascalCase(originalText);
          break;
        case 'pascal':
          newText = originalText.toUpperCase();
          break;
        case 'upper':
          newText = toUpperSnakeCase(originalText);
          break;
        case 'upperSnake':
          newText = toSnakePascalCase(originalText);
          break;
        case 'snakePascal':
          newText = toSnakeCamelCase(originalText);
          break;
        case 'snakeCamel':
          newText = toKebabCase(originalText);
          break;
        case 'snake':
          newText = toSnakePascalCase(originalText);
          break;
        case 'kebab':
          newText = toUpperKebabCase(originalText);
          break;
        case 'upperKebab':
          newText = originalText.replace(/[-_]/g, '').toLowerCase();
          break;
        case 'lower':
          newText = toCamelCase(originalText);
          break;
      }

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

export function deactivate() { }

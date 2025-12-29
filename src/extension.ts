import * as vscode from 'vscode';

export { activateSelectionStatus } from './statusBar';
export { activateWordSeparators, switchWordSeparators } from './wordSeparators';
export { nextError } from './diagnostics';
export { alignCursors, addNumbersToCursors } from './cursors';
export { cycleCasing, originalSelectionsText } from './casing';
export { uniqueLines, reverseLines, shuffleLines, sortLines } from './lines';
export { splitArguments, unsplitArguments } from './arguments';
export { scrollFast } from './navigation';
export { quoteWords, cycleQuotes } from './quotes';

import { activateSelectionStatus } from './statusBar';
import { activateWordSeparators, switchWordSeparators } from './wordSeparators';
import { nextError } from './diagnostics';
import { alignCursors, addNumbersToCursors } from './cursors';
import { cycleCasing } from './casing';
import { uniqueLines, reverseLines, shuffleLines, sortLines } from './lines';
import { splitArguments, unsplitArguments } from './arguments';
import { scrollFast } from './navigation';
import { quoteWords, cycleQuotes } from './quotes';

export function activate(context: vscode.ExtensionContext) {
  activateSelectionStatus(context);
  activateWordSeparators(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('chimera.nextError', () => nextError(context)),
    vscode.commands.registerCommand('chimera.alignCursors', () => alignCursors()),
    vscode.commands.registerCommand('chimera.addNumbersToCursors', () => addNumbersToCursors()),
    vscode.commands.registerCommand('chimera.cycleCasing', () => cycleCasing()),
    vscode.commands.registerCommand('chimera.uniqueLines', () => uniqueLines()),
    vscode.commands.registerCommand('chimera.reverseLines', () => reverseLines()),
    vscode.commands.registerCommand('chimera.shuffleLines', () => shuffleLines()),
    vscode.commands.registerCommand('chimera.sortLines', () => sortLines(false)),
    vscode.commands.registerCommand('chimera.sortLinesCaseSensitive', () => sortLines(true)),
    vscode.commands.registerCommand('chimera.splitArguments', () => splitArguments()),
    vscode.commands.registerCommand('chimera.unsplitArguments', () => unsplitArguments()),
    vscode.commands.registerCommand('chimera.scrollUpFast', () => scrollFast('up')),
    vscode.commands.registerCommand('chimera.scrollDownFast', () => scrollFast('down')),
    vscode.commands.registerCommand('chimera.quoteWords', () => quoteWords()),
    vscode.commands.registerCommand('chimera.switchWordSeparators', () => switchWordSeparators()),
    vscode.commands.registerCommand('chimera.cycleQuotes', () => cycleQuotes())
  );
}

export function deactivate() { }

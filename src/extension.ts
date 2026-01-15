import * as vscode from 'vscode';

export { activateSelectionStatus } from './statusBar';
export { activateWordSeparators, switchWordSeparators } from './wordSeparators';
export { nextError } from './diagnostics';
export { alignCursors, addNumbersToCursors } from './cursors';
export { cycleCasing, originalSelectionsText, swapCase } from './casing';
export { uniqueLines, reverseLines, shuffleLines, sortLines } from './lines';
export { splitArguments, unsplitArguments, moveArgument } from './arguments';
export { scrollFast } from './navigation';
export { quoteWords, cycleQuotes } from './quotes';
export { increaseSelection } from './selection';

import { activateSelectionStatus } from './statusBar';
import { activateWordSeparators, switchWordSeparators } from './wordSeparators';
import { nextError } from './diagnostics';
import { alignCursors, addNumbersToCursors } from './cursors';
import { cycleCasing, swapCase } from './casing';
import { uniqueLines, reverseLines, shuffleLines, sortLines } from './lines';
import { splitArguments, unsplitArguments, moveArgument } from './arguments';
import { scrollFast } from './navigation';
import { quoteWords, cycleQuotes } from './quotes';
import { increaseSelection } from './selection';

export function activate(context: vscode.ExtensionContext) {
  activateSelectionStatus(context);
  activateWordSeparators(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('chimera.nextError', () => nextError(context)),
    vscode.commands.registerCommand('chimera.alignCursors', () => alignCursors()),
    vscode.commands.registerCommand('chimera.addNumbersToCursors', () => addNumbersToCursors()),
    vscode.commands.registerCommand('chimera.cycleCasing', () => cycleCasing()),
    vscode.commands.registerCommand('chimera.swapCase', () => swapCase()),
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
    vscode.commands.registerCommand('chimera.cycleQuotes', () => cycleQuotes()),
    vscode.commands.registerCommand('chimera.increaseSelectionLeft', () => increaseSelection('left')),
    vscode.commands.registerCommand('chimera.increaseSelectionRight', () => increaseSelection('right')),
    vscode.commands.registerCommand('chimera.moveArgumentLeft', () => moveArgument('left')),
    vscode.commands.registerCommand('chimera.moveArgumentRight', () => moveArgument('right'))
  );
}

export function deactivate() { }

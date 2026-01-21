# Chimera


## Based on `focus-editor`
- **Next Error** (`chimera.nextError`): Jump to the next error in the workspace. Not the same as "go to next problem". Prioritizes errors on the current file after the cursor.
- **Next Error In File** (`chimera.nextErrorInFile`): Jump to the next error in the current file only. Wraps around when reaching the end.
- **Align Cursors** (`chimera.alignCursors`): Align cursors horizontally by inserting spaces.
- **Cycle Casing** (`chimera.cycleCasing`): Cycle through casing formats (camel, pascal, snake, kebab, etc.). Order configurable via `chimera.cycleCasingOrder`.
- **Scroll Up Fast** (`chimera.scrollUpFast`): Scroll up by a configured number of lines (default 3). Configurable via `chimera.scrollFastLineCount`.
- **Scroll Down Fast** (`chimera.scrollDownFast`): Scroll down by a configured number of lines.

## Based on `sublime-text`
- **Sort Lines** (`chimera.sortLines`): Sort selected lines (case insensitive).
- **Sort Lines (Case Sensitive)** (`chimera.sortLinesCaseSensitive`): Sort selected lines (case sensitive).
- **Unique Lines** (`chimera.uniqueLines`): Remove duplicate lines from selection.
- **Reverse Lines** (`chimera.reverseLines`): Reverse the order of selected lines.
- **Shuffle Lines** (`chimera.shuffleLines`): Randomly shuffle selected lines.
- **Swap Case** (`chimera.swapCase`): Swap the case of selected text (uppercase to lowercase and vice versa).

## Based on another extension that doesn't work/exist anymore
- **Add Numbers to Cursors** (`chimera.addNumbersToCursors`): Insert sequential numbers at each cursor position.

## Miscellaneous
- **Split Arguments** (`chimera.splitArguments`): Split comma-separated values onto separate lines (smart handling of quotes/parens).
- **Unsplit Arguments** (`chimera.unsplitArguments`): Join multi-line comma-separated values into a single compact line.
- **Move Argument Left** (`chimera.moveArgumentLeft`) (`shift+alt+left`): Swap the argument at cursor position with the one to its left.
- **Move Argument Right** (`chimera.moveArgumentRight`) (`shift+alt+right`): Swap the argument at cursor position with the one to its right.
- **Quote Words** (`chimera.quoteWords`): Adds quotes and commas to a list of words separated by spaces.
- **Switch Word Separators** (`chimera.switchWordSeparators`): Switch between different `editor.wordSeparators` profiles. Configurable via `chimera.wordSeparatorProfiles`.
- **Cycle Quotes** (`chimera.cycleQuotes`): Cycles through quote types (`"` -> `'` -> `` ` `` -> `"`). Auto-detects surrounding quotes and handles multi-line backticks.
- **Increase Selection Left** (`chimera.increaseSelectionLeft`): While selecting, expands the selection to the left by one character.
- **Increase Selection Right** (`chimera.increaseSelectionRight`): While selecting, expands the selection to the right by one character.
- **Move Selection Left** (`chimera.moveSelectionLeft`): Move the selected text one character to the left.
- **Move Selection Right** (`chimera.moveSelectionRight`): Move the selected text one character to the right.
- **Move Selection Word Left** (`chimera.moveSelectionWordLeft`): Move the selected text to the previous word boundary.
- **Move Selection Word Right** (`chimera.moveSelectionWordRight`): Move the selected text to the next word boundary.
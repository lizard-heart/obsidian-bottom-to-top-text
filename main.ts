import { Plugin, MarkdownView } from 'obsidian';

export default class EnterAboveLinePlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'reverse-lines',
			name: 'Reverse Lines in Current Note',
			editorCallback: (editor, view) => {
				// Get all the lines in the current note
				const allText = editor.getValue();
				const lines = allText.split('\n');

				// Reverse the lines
				const reversedLines = lines.reverse().join('\n');

				// Replace the entire content with the reversed lines
				editor.setValue(reversedLines);
			},
		});

		this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {
			// Check if Enter key is pressed
			if (event.key === 'Enter') {
				console.log("Enter key pressed");

				// Prevent the default behavior
				// event.preventDefault();

				// Get the active editor (for markdown files)
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) return;  // Ensure we're in a Markdown view

				const editor = activeView.editor; // Get the CodeMirror editor instance

				const cursor = editor.getCursor();
				console.log(cursor);

				// Insert a new line exactly at the current line, shifting everything below
				editor.replaceRange('\n', { line: cursor.line - 1, ch: 0 });

				// Move the cursor to the newly inserted line (it’s now above the old cursor position)
				editor.setCursor({ line: cursor.line - 1, ch: 0 });

				editor.replaceRange('', { line: cursor.line+1, ch: -1 }, { line: cursor.line + 2, ch: 0 });
			}

		});
	}

	onunload() {
		console.log('Enter Above Line plugin unloaded');
	}
}

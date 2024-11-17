import { Plugin, MarkdownView, TFile } from 'obsidian';

export default class EnterAboveLinePlugin extends Plugin {
	async onload() {
		// Inside your plugin's `onload` method
		this.addCommand({
			id: "add-property",
			name: "Turn on reverse mode for current note",
			editorCallback: (editor, view) => {
				const propertyKey = "reverseStatus";
				const propertyValue = "true";

				// Check if there's an open file
				const file = view.file;
				if (!file) {
					return;
				}

				// fixed to use processFrontMatter
				this.app.fileManager.processFrontMatter(file, (frontmatter) => {
					// Ensure the property value is a boolean
					const value = !!propertyValue; // Coerce to boolean (true/false)

					if (typeof frontmatter[propertyKey] === "boolean") {
						// Update the existing property
						frontmatter[propertyKey] = value;
					} else {
						// Add the new property as a boolean
						frontmatter[propertyKey] = value;
					}
				});

			},
		});

		// Inside your plugin's `onload` method
		this.addCommand({
			id: "set-property-false",
			name: "Turn off reverse mode for current note",
			editorCallback: (editor, view) => {
				const propertyKey = "reverseStatus";
				const propertyValue = "false";

				// Check if there's an open file
				const file = view.file;
				if (!file) {
					return;
				}

				// Get the current note's content
				this.app.vault.read(file).then((content) => {
					// Check for existing frontmatter
					const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
					const match = content.match(frontmatterRegex);

					if (match) {
						// Frontmatter exists, so update it
						const currentFrontmatter = match[1];
						if (currentFrontmatter.includes(propertyKey)) {
							// If the property exists, replace it with "false"
							const updatedFrontmatter = currentFrontmatter.replace(
								new RegExp(`${propertyKey}:.*`, "g"),
								`${propertyKey}: ${propertyValue}`
							);
							const newContent = content.replace(
								frontmatterRegex,
								`---\n${updatedFrontmatter}\n---\n`
							);
							this.app.vault.modify(file, newContent);
						} else {
							// Add the new property if it doesn't exist
							const newFrontmatter = `${currentFrontmatter}\n${propertyKey}: ${propertyValue}`;
							const newContent = content.replace(
								frontmatterRegex,
								`---\n${newFrontmatter}\n---\n`
							);
							this.app.vault.modify(file, newContent);
						}
					} else {
						// No frontmatter exists, so create one
						const newContent = `---\n${propertyKey}: ${propertyValue}\n---\n${content}`;
						this.app.vault.modify(file, newContent);
					}
				});
			},
		});

		const isPropertyTrue = (file: TFile, propertyKey: string): boolean => {
			try {
				// Get the metadata for the file
				const metadata = this.app.metadataCache.getFileCache(file);

				if (!metadata || !metadata.frontmatter) {
					// No metadata or frontmatter present
					return false;
				}

				// Retrieve the property value from the frontmatter
				const propertyValue = metadata.frontmatter[propertyKey];

				// Check if the property is explicitly set to true
				return propertyValue === true;
			} catch (error: unknown) {
				console.error("Error retrieving metadata:", error);
				return false;
			}
		};

		this.addCommand({
			id: 'reverse-lines',
			name: 'Reverse lines in current note',
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
				// Define an async function to handle the asynchronous operations
				const handleEnterKey = async () => {
					// Get the active editor (for markdown files)
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (!activeView) return;

					// Check the property
					const isTrue = await isPropertyTrue.call(this, activeView.file, "reverseStatus");

					// Ensure we're in a Markdown view and the property is true
					if (!isTrue) return;

					const editor = activeView.editor; // Get the CodeMirror editor instance
					const cursor = editor.getCursor();

					// Insert a new line exactly at the current line, shifting everything below
					editor.replaceRange('\n', { line: cursor.line - 1, ch: 0 });

					// Move the cursor to the newly inserted line (it’s now above the old cursor position)
					editor.setCursor({ line: cursor.line - 1, ch: 0 });

					// Clean up the extra line (if needed)
					editor.replaceRange('', { line: cursor.line + 1, ch: -1 }, { line: cursor.line + 2, ch: 0 });
				};

				// Call the async function (no await needed here)
				handleEnterKey();
			}
		});

	}

	onunload() {
		console.log('Enter Above Line plugin unloaded');
	}
}

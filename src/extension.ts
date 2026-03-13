import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand("wrapSelection.tryCatch", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText.trim().length === 0) {
            vscode.window.showErrorMessage("No text selected.");
            return;
        }

        // Detect the indentation of the first selected line
        const startLine = editor.document.lineAt(selection.start.line);
        const baseIndentMatch = startLine.text.match(/^(\s*)/);
        const baseIndent = baseIndentMatch ? baseIndentMatch[1] : "";
        const innerIndent = baseIndent + "    ";

        const lines = selectedText.split("\n");

        // Find the minimum indentation across all non-empty lines
        let minIndent = Infinity;
        for (const line of lines) {
            if (line.trim().length > 0) {
                const m = line.match(/^(\s*)/);
                if (m) {
                    minIndent = Math.min(minIndent, m[1].length);
                }
            }
        }
        if (!isFinite(minIndent)) {
            minIndent = 0;
        }

        // Strip existing base indent and re-apply inner indent
        const indentedLines = lines.map(line => {
            if (line.trim().length === 0) {
                return "";
            }
            return innerIndent + line.slice(minIndent);
        });

        const wrappedCode = [
            `${baseIndent}try {`,
            ...indentedLines,
            `${baseIndent}} catch (error) {`,
            `${innerIndent}console.error(error);`,
            `${baseIndent}}`
        ].join("\n");

        const success = await editor.edit(editBuilder => {
            editBuilder.replace(selection, wrappedCode);
        });

        if (!success) {
            vscode.window.showErrorMessage("Failed to wrap code in try-catch block.");
        }
    });

    context.subscriptions.push(command);
}

export function deactivate() { }

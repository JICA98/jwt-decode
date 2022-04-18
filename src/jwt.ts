import * as vscode from 'vscode';
import jwt_decode from "jwt-decode";

const jwtConstants = {
    noTextMessage: 'No text selected',
    invalidToken: 'Invalid token',
    copy: 'copy'
};

function showBanner(message: string) {
    vscode.window.showInformationMessage(`JWT Extension: ${message}`);
}

async function captureInput(): Promise<string | undefined> {
    const editor = vscode.window.activeTextEditor;
    let token: string | undefined = undefined;
    if (!!editor) {
        const selection = editor.selection;
        token = editor.document.getText(selection);
    }
    if (!token) {
        // trying to pick from clipboard
        token = await vscode.env.clipboard.readText();
    }
    return token;
}

async function coptoClipboard(text: string) {
    try {
        await vscode.env.clipboard.writeText(text);
        showBanner('Copied to clipboard!');
    } catch (error) {
        console.error(error);
        showBanner('Couldn\'t copy!');
    }
}

export async function decodeToken() {
    let token = await captureInput();
    let decoded: any = undefined;
    let message: string | undefined = undefined;
    let header: any = undefined;
    if (!!token) {
        try {
            token = token.trim();
            decoded = jwt_decode(token, { header: false });
            header = jwt_decode(token, { header: true });
        } catch (error) {
            console.error(error);
        }
        if (!!decoded) {
            showDecodedContent(JSON.stringify(decoded), token, JSON.stringify(header));
            return;
        } else {
            message = jwtConstants.invalidToken;
        }
    } else {
        message = jwtConstants.noTextMessage;
    }
    showBanner(message);
}

function showDecodedContent(decoded: string, token: string, header: string) {
    const title = `JWT Decoded Token`;
    const panel = vscode.window.createWebviewPanel(
        'jwtDecode',
        title,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );
    const copyIcon = (id: string, content: string) => `
        <input id='${id}-input' type='hidden' value='${content}'>
            <svg id='${id}' xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </input>
        `;
    const headerContent = !!header ? `<h4>Header ${copyIcon('headerCopy', header)}</h4><p>${header}</p>` : '';
    panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        </head>
        <body>
            <div style='overflow-wrap: break-word;'>
                <h2>${title}</h2>
                <h3>Decoded ${copyIcon('decCopy', decoded)}</h3>
                <p>${decoded}</p> 
                ${headerContent}           
                <br>
                <hr>
                <h3>Original token ${copyIcon('orgCopy', token)}</h3>
                <p>${token}</p>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                ['headerCopy', 'decCopy', 'orgCopy'].forEach(id => {
                    const input = document.getElementById(id + '-input');
                    const ele = document.getElementById(id);
                    input.style.margin.left = '10px';        
                    ele.style.cursor = 'pointer'; 
                    ele.onclick = () => coptoClipboard(input.value);
                });
                function coptoClipboard(message) {
                    vscode.postMessage({
                        command: '${jwtConstants.copy}',
                        text: message
                    })
                }
            </script>
        </body>
        </html>
    `;
    panel.webview.onDidReceiveMessage(message => {
        if (message.command === jwtConstants.copy) {
            coptoClipboard(message.text);
        }
    });
}
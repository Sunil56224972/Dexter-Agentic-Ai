#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const execPromise = util.promisify(exec);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 🎨 COMPACT HACKER ART ---
const hackerArt = `
   .---.     Dexter Agentic AI v2.0
  /     \\    ----------------------
  | () () |   System: Online
   \\  ^  /    Mode: Hacker Hash
    |||||     Status: Waiting...
    '---'
`;

async function showSplashScreen() {
    console.clear();
    // Tumhari badi art ko maine yahan chhota karke embed kar diya hai
    console.log(hackerArt);
    await delay(2000);
}

const tools = [
    { name: "execute_terminal_command", description: "Run commands", parameters: { type: "OBJECT", properties: { command: { type: "STRING" } }, required: ["command"] } },
    { name: "list_directory", description: "List files", parameters: { type: "OBJECT", properties: { path: { type: "STRING" } }, required: ["path"] } },
    { name: "write_file", description: "Write files", parameters: { type: "OBJECT", properties: { filePath: { type: "STRING" }, content: { type: "STRING" } }, required: ["filePath", "content"] } }
];

const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    systemInstruction: `Aap Dexter hain. Hindi mein reply dein. Action ke liye tools use karein.`,
    tools: [{ functionDeclarations: tools }]
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const chat = model.startChat({ history: [] });
const askUser = (query) => new Promise(resolve => rl.question(query, resolve));

async function runAgent() {
    const userInput = await askUser('आप (You)> ');
    if (userInput.toLowerCase() === 'exit') process.exit(0);

    try {
        process.stdout.write('Dexter dimaag chala raha hai...');
        let result = await chat.sendMessage(userInput);
        let response = result.response;
        let calls = typeof response.functionCalls === 'function' ? response.functionCalls() : (response.functionCalls || []);

        while (calls && calls.length > 0) {
            const call = calls[0];
            let toolOutput = "";
            let toolError = "";

            if (call.name === "execute_terminal_command") {
                const cmd = call.args.command;
                const permission = await askUser(`\n⚠️ Run: '${cmd}'? (y/n): `);
                if (permission.toLowerCase() === 'y') {
                    try { const { stdout, stderr } = await execPromise(cmd); toolOutput = stdout || stderr || "Success."; }
                    catch (err) { toolError = err.message; }
                } else { toolOutput = "Denied."; }
            } else if (call.name === "list_directory") {
                try { toolOutput = (await fs.readdir(call.args.path || '.')).join(', '); } catch (err) { toolError = err.message; }
            } else if (call.name === "write_file") {
                try { await fs.writeFile(call.args.filePath, call.args.content, 'utf8'); toolOutput = "Done."; }
                catch (err) { toolError = err.message; }
            }

            result = await chat.sendMessage([{ functionResponse: { name: call.name, response: toolError ? { error: toolError } : { output: toolOutput } } }]);
            response = result.response;
            calls = typeof response.functionCalls === 'function' ? response.functionCalls() : (response.functionCalls || []);
        }
        console.log(`\nDexter> ${response.text()}\n`);
    } catch (error) { console.error('\n[Error]:', error.message); }
    runAgent();
}

await showSplashScreen();
runAgent();
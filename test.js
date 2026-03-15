import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkModels() {
    console.log("🔍 Google servers se tumhari API key ke models fetch kar raha hoon...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        console.log("\n🔥 TUMHARI API KEY PAR YEH MODELS AVAILABLE HAIN:");
        data.models.forEach(m => {
            if (m.name.includes('gemini')) {
                console.log("👉", m.name.replace('models/', ''));
            }
        });
    } catch (err) {
        console.log("Error fetching models:", err.message);
    }
}
checkModels();
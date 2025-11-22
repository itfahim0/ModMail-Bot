import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const loadCommands = async (client) => {
    const folders = fs.readdirSync(__dirname).filter(f => !f.endsWith('.js'));
    for (const folder of folders) {
        const files = fs.readdirSync(path.join(__dirname, folder)).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const command = await import(`./${folder}/${file}`);
            if (command.default && command.default.data) {
                client.commands.set(command.default.data.name, command.default);
            }
        }
    }
    console.log(`✅ Loaded ${client.commands.size} commands.`);
};
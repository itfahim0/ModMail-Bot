import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cache = {};

function loadLocale(lang = 'en') {
    if (cache[lang]) return cache[lang];
    const localePath = path.join(__dirname, '..', 'locales', `${lang}.json`);
    try {
        if (fs.existsSync(localePath)) {
            const data = JSON.parse(fs.readFileSync(localePath, 'utf8'));
            cache[lang] = data;
            return data;
        } else {
            console.warn(`Locale file not found: ${localePath}`);
            return {};
        }
    } catch (e) {
        console.error('Failed to load locale', lang, e);
        return {};
    }
}

export function t(key, vars = {}, lang = 'en') {
    const locale = loadLocale(lang);
    let str = locale[key] || key;
    // simple variable interpolation: {var}
    Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), v);
    });
    return str;
}

export default { t };

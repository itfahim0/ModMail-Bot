import fs from 'fs';

const DATA_FILE = './data.json';

// In-memory database state
export const db = {
    tickets: [],
    cases: [],
    warnings: [],
    users: {},
    config: {},
    schedules: []
};

// Load data from disk
export const connectDB = async () => {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            const data = JSON.parse(raw);
            Object.assign(db, data);
            console.log('📦 Loaded local database (data.json)');
        } catch (e) {
            console.error('❌ Failed to load data.json:', e);
        }
    } else {
        console.log('📦 No data.json found, creating new one...');
        saveDB();
    }
};

// Save data to disk
export const saveDB = () => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error('❌ Failed to save data.json:', e);
    }
};
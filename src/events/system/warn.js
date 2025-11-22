import { Events } from 'discord.js';
export default {
    name: Events.Warn,
    execute(info) {
        console.warn('Client Warning:', info);
    }
};
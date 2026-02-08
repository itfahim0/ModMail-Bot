import { Events } from 'discord.js';

export default {
    name: Events.Error,
    execute(error) {
        console.error('Client Error:', error);
    },
};

import { Events } from 'discord.js';
export default {
    name: Events.GuildMemberRemove,
    execute(member) {
        console.log('Member left:', member.user.tag);
    }
};
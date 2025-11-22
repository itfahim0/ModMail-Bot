import { Events } from 'discord.js';
export default {
    name: Events.GuildMemberAdd,
    execute(member) {
        console.log('Member joined:', member.user.tag);
    }
};
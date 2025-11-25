await interaction.reply('✅ Ticket closed. Deleting channel in 5 seconds...');
setTimeout(() => interaction.channel.delete().catch(() => { }), 5000);
    }
};
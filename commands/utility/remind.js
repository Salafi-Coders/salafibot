const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder and get pinged later!')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('When to remind you (e.g., 10m, 2h, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('What to remind you about')
                .setRequired(true)),
    async execute(interaction) {
        const timeInput = interaction.options.getString('time');
        const message = interaction.options.getString('message');

        // Parse time (supports m, h, d)
        const timeRegex = /^(\d+)([mhd])$/i;
        const match = timeInput.match(timeRegex);
        if (!match) {
            return interaction.reply({ content: 'Invalid time format! Use numbers followed by m (minutes), h (hours), or d (days).', ephemeral: true });
        }

        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let ms = 0;
        if (unit === 'm') ms = amount * 60 * 1000;
        else if (unit === 'h') ms = amount * 60 * 60 * 1000;
        else if (unit === 'd') ms = amount * 24 * 60 * 60 * 1000;

        if (ms < 10000 || ms > 1209600000) { // 10s to 14d
            return interaction.reply({ content: 'Reminders must be between 10 seconds and 14 days.', ephemeral: true });
        }

        await interaction.reply({ content: `⏰ Okay <@${interaction.user.id}>, I'll remind you in ${timeInput}: "${message}"`, ephemeral: true });

        setTimeout(async () => {
            try {
                await interaction.followUp({
                    content: `🔔 <@${interaction.user.id}> Reminder: ${message}`,
                    ephemeral: false
                });
            } catch (err) {
                // Ignore errors (e.g., interaction expired)
            }
        }, ms);
    }
};
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timer')
        .setDescription('Set a timer and get reminded after a certain time.')
        .addIntegerOption(option =>
            option.setName('hours')
                .setDescription('Number of hours for the timer')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Number of minutes for the timer')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Number of seconds for the timer')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Custom message to send when the timer ends')
                .setRequired(false)
        ),
    async execute(interaction) {
        const hours = interaction.options.getInteger('hours') || 0;
        const minutes = interaction.options.getInteger('minutes') || 0;
        const seconds = interaction.options.getInteger('seconds') || 0;
        const customMessage = interaction.options.getString('message');

        const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

        if (totalMs <= 0) {
            return interaction.reply({ content: 'Please provide a positive duration (hours, minutes, or seconds).', ephemeral: true });
        }

        let timeParts = [];
        if (hours) timeParts.push(`${hours} hour(s)`);
        if (minutes) timeParts.push(`${minutes} minute(s)`);
        if (seconds) timeParts.push(`${seconds} second(s)`);
        const timeString = timeParts.join(', ');
        await interaction.reply({ content: `⏰ Timer set for ${timeString}! I will remind you when time is up.`, ephemeral: true });

        setTimeout(() => {
            const userMention = `<@${interaction.user.id}>`;
            const message = customMessage
            ? `⏰ Time's up! ${userMention} ${customMessage}`
            : `⏰ Time's up! ${userMention} Your timer (${timeString}) is over.`;
            interaction.followUp({ content: message, ephemeral: true });
        }, totalMs);
    },
};
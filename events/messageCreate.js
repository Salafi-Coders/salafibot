/*
    Name: messageCreate.js
    Description: Event that handles message creation
    Author: Salafi Bot Team
    License: MIT
*/

import { EmbedBuilder } from 'discord.js';
import config from '../config.json' with { type: 'json' };

export default {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        const phrases = [
            { phrase: 'as', response_ar: 'السلام عليكم ورحمة الله وبركاته', response_en: 'May the peace, blessings and mercy of Allah be upon you.' },
            { phrase: 'ws', response_ar: 'وعليكم السلام ورحمة الله وبركاته', response_en: 'And may the peace, blessings and mercy of Allah be upon you.' },
        ];

        const content = message.content.trim().toLowerCase();

        for (const phrase of phrases) {
            if (content === phrase.phrase) {
                const phraseEmbed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setDescription(phrase.response_en)
                    .setTimestamp();

                await message.reply({ content: `${message.author} says ${phrase.response_ar}`, embeds: [phraseEmbed] });
            }
        }
    },
};
/*
    Name: transliterate.js
    Description: Transliterates Arabic into English text with phonetics using Gemini AI
    Author: Salafi Bot Team
    License: MIT
*/

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenAI } from '@google/genai';
import config from '../../config.json' with { type: 'json' };
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const geminiAPIKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenAI({ apiKey: geminiAPIKey });

export default {
    data: new SlashCommandBuilder()
        .setName('transliterate')
        .setDescription('Transliterates Arabic into English text with phonetics.')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The text to transliterate')
                .setRequired(true),
        )
        .addStringOption(option =>
            option.setName('model')
                .setDescription('The model to use for translation')
                .setRequired(false)
                .addChoices(
                    { name: 'Gemma 3n E2B', value: 'gemma-3n-e2b-it' },
                    { name: 'Gemma 3n E4B', value: 'gemma-3n-e4b-it' },
                    { name: 'Gemma 3 1B', value: 'gemma-3-1b-it' },
                    { name: 'Gemma 3 4B', value: 'gemma-3-4b-it' },
                    { name: 'Gemma 3 12B', value: 'gemma-3-12b-it' },
                    { name: 'Gemma 3 27B', value: 'gemma-3-27b-it' },
                )
        ),
    async execute(interaction) {
        const text = interaction.options.getString('text');
        const modelName = interaction.options.getString('model') || 'gemma-3n-e2b-it';

        const transliterationEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.client.user.displayName,
                iconURL: interaction.client.user.avatarURL(),
            })
            .setColor(config.colors.primary)
            .setTimestamp()
            .setFooter({
                text: `Model: ${modelName}`,
            })
            .setTitle('Transliteration Request')
            .setDescription('Processing...');

        await interaction.reply({ embeds: [transliterationEmbed] });

        try {
            const response = await genAI.models.generateContent({
                model: modelName,
                contents: `Transliterate the following Arabic text: ${text}`,
            });

            const result = response.text;

            transliterationEmbed.setDescription(result);
            await interaction.editReply({ embeds: [transliterationEmbed] });
        } catch (error) {
            console.error('Transliteration error:', error);
            transliterationEmbed.setDescription('Sorry, there was an error processing your transliteration request.');
            await interaction.editReply({ embeds: [transliterationEmbed] });
        }
    },
};
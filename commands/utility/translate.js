/*
    Name: translate.js
    Description: Translates text with precision using Gemini AI
    Author: Salafi Bot Team
    License: MIT
*/

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config.json' with { type: 'json' };
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const geminiAPIKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(geminiAPIKey);

export default {
	data: new SlashCommandBuilder()
		.setName('translate')
		.setDescription('Translates text with precision.')
		.addStringOption(option =>
			option.setName('text')
				.setDescription('The text to translate (leave empty to translate a message)')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('language')
				.setDescription('The language to translate the text to')
				.setRequired(true),
		)
		.addStringOption(option =>
			option.setName('message_id')
				.setDescription('The ID of the message to translate')
				.setRequired(false),
		),
	async execute(interaction) {
		const text = interaction.options.getString('text');
		const language = interaction.options.getString('language');
		const messageId = interaction.options.getString('message_id');

		let contentToTranslate = text;

		// If no text is provided but a message ID is, fetch the message content
		if (!contentToTranslate && messageId) {
			try {
				const channel = interaction.channel;
				const message = await channel.messages.fetch(messageId);
				contentToTranslate = message.content;
			} catch (err) {
				return interaction.reply({
					content: 'Could not find the message with the provided ID.',
					ephemeral: true,
				});
			}
		}

		// If neither text nor message ID is provided, prompt the user
		if (!contentToTranslate) {
			return interaction.reply({
				content: 'Please provide text or a message ID to translate.',
				ephemeral: true,
			});
		}

		const translationEmbed = new EmbedBuilder()
			.setAuthor({
				name: interaction.client.user.displayName,
				iconURL: interaction.client.user.avatarURL(),
			})
			.setColor(config.colors.primary)
			.setTimestamp()
			.setFooter({
				text: 'Gemini 2.0 Flash',
			})
			.setTitle('Translation Request')
			.setDescription('Processing...');

		await interaction.reply({ embeds: [translationEmbed] });

		try {
			const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
			const result = await model.generateContent(`Translate the following text into ${language}: ${contentToTranslate}.`);
			const response = await result.response;
			const translatedText = response.text();

			translationEmbed.setDescription(translatedText);
			await interaction.editReply({ embeds: [translationEmbed] });
		} catch (error) {
			console.error('Translation error:', error);
			translationEmbed.setDescription('Sorry, there was an error processing your translation request.');
			await interaction.editReply({ embeds: [translationEmbed] });
		}
	},
};
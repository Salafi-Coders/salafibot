/*
    Name: deploy-commands.js
    Description: Standalone script to deploy bot commands to Discord
    Author: Salafi Bot Team
    License: MIT
    Usage: node deploy-commands.js [--global] [--command commandname]
*/

import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

// Parse command line arguments
const args = process.argv.slice(2);
const isGlobal = args.includes('--global');
const commandIndex = args.indexOf('--command');
const specificCommand = commandIndex !== -1 && args[commandIndex + 1] ? args[commandIndex + 1] : null;

// Validate environment variables
if (!clientId || !token) {
    console.error('[ERROR] Missing required environment variables: CLIENT_ID and DISCORD_TOKEN must be set in .env file');
    process.exit(1);
}

if (!isGlobal && !guildId) {
    console.error('[ERROR] Missing GUILD_ID environment variable required for guild-specific deployment');
    process.exit(1);
}

async function deployCommands() {
    const commands = [];

    try {
        console.log('[INFO] Loading commands...');

        const foldersPath = path.join(__dirname, 'commands');

        if (!fs.existsSync(foldersPath)) {
            console.error('[ERROR] Commands directory not found at:', foldersPath);
            process.exit(1);
        }

        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);

            if (!fs.lstatSync(commandsPath).isDirectory()) continue;

            const commandFiles = fs
                .readdirSync(commandsPath)
                .filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);

                try {
                    const fileURL = pathToFileURL(filePath).href;
                    const command = await import(fileURL);

                    if ('data' in command.default && 'execute' in command.default) {
                        if (specificCommand && command.default.data.name !== specificCommand) {
                            continue;
                        }

                        commands.push(command.default.data.toJSON());
                        console.log(`[INFO] Loaded command: ${command.default.data.name}`);
                    } else {
                        console.warn(`[WARN] The command at ${filePath} is missing a required "data" or "execute" property.`);
                    }
                } catch (error) {
                    console.error(`[ERROR] Error loading command ${file}:`, error.message);
                }
            }
        }

        if (specificCommand && commands.length === 0) {
            console.error(`[ERROR] Command "${specificCommand}" not found.`);
            process.exit(1);
        }

        if (commands.length === 0) {
            console.error(`[ERROR] No valid commands found to deploy.`);
            process.exit(1);
        }

        const rest = new REST().setToken(token);
        console.log(`[INFO] Started ${specificCommand ? `deploying command "${specificCommand}"` : `refreshing ${commands.length} application (/) commands`}...`);

        const route = isGlobal
            ? Routes.applicationCommands(clientId)
            : Routes.applicationGuildCommands(clientId, guildId);

        // 🆕 Fetch existing commands to prevent duplicates
        const existingCommands = await rest.get(route);
        const isDuplicate = (cmd) => existingCommands.some(existing => existing.name === cmd.name);

        let filteredCommands;

        if (specificCommand) {
            // Remove old version of the specific command and deploy new one
            filteredCommands = existingCommands.filter(cmd => cmd.name !== specificCommand);
            filteredCommands.push(...commands);
        } else {
            // Skip already deployed commands
            const newUniqueCommands = commands.filter(cmd => !isDuplicate(cmd));

            if (newUniqueCommands.length === 0) {
                console.log('[INFO] All commands already deployed. No changes made.');
                process.exit(0);
            }

            filteredCommands = [...existingCommands, ...newUniqueCommands];
        }

        const data = await rest.put(route, { body: filteredCommands });

        console.log(`[INFO] Successfully ${specificCommand ? `deployed "${specificCommand}"` : `deployed ${data.length} application (/) commands`}.`);
        console.log(`[INFO] Deployment target: ${isGlobal ? 'Global' : `Guild (${guildId})`}`);

        if (!isGlobal && data.length > 0) {
            console.log('[INFO] Guild commands are available immediately.');
        } else if (isGlobal && data.length > 0) {
            console.log('[INFO] Global commands may take up to 1 hour to update across all servers.');
        }

    } catch (error) {
        console.error('❌ Error deploying commands:', error);

        if (error.code === 50001) {
            console.error('[ERROR] Missing Access - Check that your bot token is valid and the bot has necessary permissions.');
        } else if (error.code === 50035) {
            console.error('[ERROR] Invalid Form Body - One or more commands have invalid data.');
        }

        process.exit(1);
    }
}

function showUsage() {
    console.log(`
Usage: node deploy-commands.js [options]

Options:
  --global              Deploy commands globally (takes up to 1 hour to update)
  --command <name>      Deploy only a specific command by name

Examples:
  node deploy-commands.js                    # Deploy all commands to guild
  node deploy-commands.js --global           # Deploy all commands globally
  node deploy-commands.js --command ping     # Deploy only the 'ping' command to guild
  node deploy-commands.js --global --command ping  # Deploy only the 'ping' command globally

Environment Variables Required:
  CLIENT_ID      - Your Discord application/bot client ID
  DISCORD_TOKEN  - Your Discord bot token
  GUILD_ID       - Your Discord server ID (only required for guild deployments)
`);
}

if (args.includes('--help') || args.includes('-h')) {
	showUsage();
	process.exit(0);
}

deployCommands();
// End of deploy-commands.js
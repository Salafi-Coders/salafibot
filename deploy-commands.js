/*
	Name: deploy-commands.js
	Description: Standalone script to deploy bot commands to Discord
	Author: Salafi Bot Team
	License: MIT
	Usage: node deploy-commands.js [--global] [--command commandname]
*/

const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

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
	console.error('❌ Missing required environment variables: CLIENT_ID and DISCORD_TOKEN must be set in .env file');
	process.exit(1);
}

if (!isGlobal && !guildId) {
	console.error('❌ Missing GUILD_ID environment variable required for guild-specific deployment');
	process.exit(1);
}

async function deployCommands() {
	const commands = [];
	
	try {
		console.log('🔄 Loading commands...');
		
		// Grab all the command folders from the commands directory
		const foldersPath = path.join(__dirname, 'commands');
		
		if (!fs.existsSync(foldersPath)) {
			console.error('❌ Commands directory not found at:', foldersPath);
			process.exit(1);
		}
		
		const commandFolders = fs.readdirSync(foldersPath);

		// Loop through each folder in the commands directory
		for (const folder of commandFolders) {
			const commandsPath = path.join(foldersPath, folder);
			
			if (!fs.lstatSync(commandsPath).isDirectory()) continue;
			
			const commandFiles = fs
				.readdirSync(commandsPath)
				.filter(file => file.endsWith('.js'));

			// Load each command file
			for (const file of commandFiles) {
				const filePath = path.join(commandsPath, file);
				
				try {
					// Clear require cache to allow reloading
					delete require.cache[require.resolve(filePath)];
					const command = require(filePath);
					
					if ('data' in command && 'execute' in command) {
						// If a specific command is requested, only deploy that command
						if (specificCommand && command.data.name !== specificCommand) {
							continue;
						}
						
						commands.push(command.data.toJSON());
						console.log(`✅ Loaded command: ${command.data.name}`);
					} else {
						console.warn(`⚠️  The command at ${filePath} is missing a required "data" or "execute" property.`);
					}
				} catch (error) {
					console.error(`❌ Error loading command ${file}:`, error.message);
				}
			}
		}

		// Check if specific command was found
		if (specificCommand && commands.length === 0) {
			console.error(`❌ Command "${specificCommand}" not found.`);
			process.exit(1);
		}

		if (commands.length === 0) {
			console.error('❌ No valid commands found to deploy.');
			process.exit(1);
		}

		// Construct and prepare an instance of the REST module
		const rest = new REST().setToken(token);

		console.log(`🚀 Started ${specificCommand ? `deploying command "${specificCommand}"` : `refreshing ${commands.length} application (/) commands`}...`);

		// Determine the route based on global or guild deployment
		const route = isGlobal 
			? Routes.applicationCommands(clientId)
			: Routes.applicationGuildCommands(clientId, guildId);

		let data;

		if (specificCommand) {
			// If deploying a specific command, get existing commands and update
			const existingCommands = await rest.get(route);
			const updatedCommands = existingCommands.filter(cmd => cmd.name !== specificCommand);
			updatedCommands.push(...commands);
			
			data = await rest.put(route, { body: updatedCommands });
			console.log(`✅ Successfully deployed command "${specificCommand}".`);
		} else {
			// Deploy all commands
			data = await rest.put(route, { body: commands });
			console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
		}

		console.log(`📍 Deployment target: ${isGlobal ? 'Global' : `Guild (${guildId})`}`);
		
		if (!isGlobal && data.length > 0) {
			console.log('ℹ️  Guild commands are available immediately.');
		} else if (isGlobal && data.length > 0) {
			console.log('ℹ️  Global commands may take up to 1 hour to update across all servers.');
		}

	} catch (error) {
		console.error('❌ Error deploying commands:', error);
		
		if (error.code === 50001) {
			console.error('   Missing Access - Check that your bot token is valid and the bot has necessary permissions.');
		} else if (error.code === 50035) {
			console.error('   Invalid Form Body - One or more commands have invalid data.');
		}
		
		process.exit(1);
	}
}

// Show usage information
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

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
	showUsage();
	process.exit(0);
}

// Run the deployment
deployCommands();

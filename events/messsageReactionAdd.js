/*
    Name: messageCreate.js
    Description: Event that handles message creation
    Author: Salafi Bot Team
    License: MIT
*/


import config from '../config.json' with { type: 'json' };

export default {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (user.bot) return;
        const emoji = reaction.emoji.name;
        if (config.bannedEmojis.includes(emoji)) {
            try {
                await reaction.users.remove(user.id);
                await user.send({
                    content: `That emoji is banned and your reaction was removed. Please avoid using it in the future.`,
                });
            } catch (err) {
                // Handle error silently`
            }
        }
    },
};

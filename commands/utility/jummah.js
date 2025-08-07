import { CronJob } from "cron"; // Import CronJob for scheduling tasks
import { SlashCommandBuilder } from "discord.js"; // Import SlashCommandBuilder to create slash commands

const jumuahSettings = new Map(); // serverId => { imageUrl, channelId, job }

export default {
  data: new SlashCommandBuilder()
    .setName("jumuah")
    .setDescription("Setup automatic Jumuah image posting")
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription("Image URL to send")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to send the image")
        .setRequired(true)
    ),
  async execute(interaction) {
    const imageUrl = interaction.options.getString("image");
    const channel = interaction.options.getChannel("channel");

    // Stop previous job if exists
    const prev = jumuahSettings.get(interaction.guildId);
    if (prev && prev.job) prev.job.stop();

    // Create cron job: Every 2 hours on Friday
    const job = new CronJob(
      "0 0,2,4,6,8,10,12,14,16,18,20,22 * * 5",
      async () => {
        try {
          await channel.send({ files: [imageUrl] });
        } catch (err) {
          console.error("Failed to send Jumuah image:", err);
        }
      }
    );

    job.start();
    jumuahSettings.set(interaction.guildId, {
      imageUrl,
      channelId: channel.id,
      job,
    });

    await interaction.reply({
      content: "Jumuah image posting initialized!",
      ephemeral: true,
    });
  },
};

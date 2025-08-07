import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("basmalah")
    .setDescription("Sends the Basmalah text")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Custom title for the embed")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Custom description for the embed")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Custom color (hex, e.g. #296338)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription("Optional image URL for the embed")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("font")
        .setDescription("Font style: default, bold, italic, monospace")
        .setRequired(false)
    ),
  async execute(interaction) {
    const title =
      interaction.options.getString("title") ||
      "Bismillahir Rahmanir Raheem (بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم)";
    let description =
      interaction.options.getString("description") ||
      "In the Name of Allâh, the Most Gracious, the Most Merciful";
    const colorInput = interaction.options.getString("color");
    const color = colorInput
      ? parseInt(colorInput.replace("#", ""), 16)
      : 0x296338;
    const image = interaction.options.getString("image");
    const font = interaction.options.getString("font") || "default";

    // Apply font style
    switch (font.toLowerCase()) {
      case "bold":
        description = `**${description}**`;
        break;
      case "italic":
        description = `*${description}*`;
        break;
      case "monospace":
        description = `\`${description}\``;
        break;
      // default: do nothing
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color);

    if (image) {
      embed.setImage(image);
    }

    await interaction.reply({ embeds: [embed] });
  },
};

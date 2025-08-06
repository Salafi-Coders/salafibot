import { SlashCommandBuilder } from "discord.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy function to simulate fetching CPU & Memory usage data
function getUsageData(hours) {
  // Generate timestamps and random data for demonstration
  const now = Date.now();
  const points = hours * 6; // 1 point every 10 minutes
  const labels = [];
  const cpuData = [];
  const memData = [];
  for (let i = points - 1; i >= 0; i--) {
    const ts = new Date(now - i * 10 * 60 * 1000);
    labels.push(
      ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
    cpuData.push(Math.random() * 100); // CPU %
    memData.push(Math.random() * 100); // Memory %
  }
  return { labels, cpuData, memData };
}

const timeOptions = [
  { name: "6 hours", value: 6 },
  { name: "12 hours", value: 12 },
  { name: "24 hours", value: 24 },
];

export default {
  data: new SlashCommandBuilder()
    .setName("graph")
    .setDescription("Generate a graph of CPU & Memory usage")
    .addIntegerOption((option) =>
      option
        .setName("hours")
        .setDescription("Time range for the graph")
        .setRequired(true)
        .addChoices(
          ...timeOptions.map((opt) => ({ name: opt.name, value: opt.value }))
        )
    ),
  async execute(interaction) {
    const hours = interaction.options.getInteger("hours");
    await interaction.deferReply();

    const { labels, cpuData, memData } = getUsageData(hours);

    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "CPU Usage (%)",
            data: cpuData,
            borderColor: "rgba(255,99,132,1)",
            backgroundColor: "rgba(255,99,132,0.2)",
            fill: false,
            tension: 0.1,
          },
          {
            label: "Memory Usage (%)",
            data: memData,
            borderColor: "rgba(54,162,235,1)",
            backgroundColor: "rgba(54,162,235,0.2)",
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: `CPU & Memory Usage - Last ${hours}h`,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    const fileName = `usage-graph-${Date.now()}.png`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, buffer);

    await interaction.editReply({
      files: [filePath],
      content: `Here is the CPU & Memory usage graph for the last ${hours} hours.`,
    });

    fs.unlinkSync(filePath); // Clean up
  },
};

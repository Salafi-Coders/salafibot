import { SlashCommandBuilder } from "discord.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import { EmbedBuilder, AttachmentBuilder } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Returns an array of { timestamp, cpu, memory } for each 10-minute interval in the past `hours`
async function getSystemUsageData(hours) {
  const points = hours * 6; // 1 point every 10 minutes
  const data = [];
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = Date.now() - i * 10 * 60 * 1000;

    // CPU usage: average load over last minute, as a percentage of logical CPUs
    const cpuLoad = (os.loadavg()[0] / os.cpus().length) * 100;

    // Memory usage: used memory as a percentage of total
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;

    data.push({
      timestamp,
      cpu: cpuLoad,
      memory: usedMemPercent,
    });
  }
  return data;
}
// Dummy function to simulate fetching CPU & Memory usage data
function dummyGetUsageData(hours) {
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

    const { labels, cpuData, memData } = dummyGetUsageData(hours); //CHANGE THIS TO getSystemUsageData(hours) TO USE REAL DATA

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
            tension: 0.5,
            borderJoinStyle: "round",
            borderCapStyle: "round",
            pointRadius: 4,
            pointBorderWidth: 2,
            pointBackgroundColor: "rgba(255,99,132,1)",
            pointBorderColor: "#fff",
          },
          {
            label: "Memory Usage (%)",
            data: memData,
            borderColor: "rgba(54,162,235,1)",
            backgroundColor: "rgba(54,162,235,0.2)",
            fill: false,
            tension: 0.5,
            borderJoinStyle: "round",
            borderCapStyle: "round",
            pointRadius: 4,
            pointBorderWidth: 2,
            pointBackgroundColor: "rgba(54,162,235,1)",
            pointBorderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: `CPU & Memory Usage - Last ${hours}h`,
            font: { size: 20 },
            color: "#dae6efff",
          },
          legend: {
            labels: {
              color: "#dae6efff",
              font: { size: 14 },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#ffffffff", font: { size: 12 } },
            grid: { color: "rgba(255, 255, 255, 0.55)" },
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: "#ffffffff", font: { size: 12 } },
            grid: { color: "rgba(255, 255, 255, 0.55)" },
          },
        },
      },
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    const attachment = new AttachmentBuilder(buffer, {
      name: "usage-graph.png",
    });

    const embed = new EmbedBuilder()
      .setTitle("📊 CPU & Memory Usage")
      .setDescription(
        `Here is the CPU & Memory usage graph for the last **${hours} hours**.`
      )
      .setColor(0x5865f2)
      .setImage("attachment://usage-graph.png")
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      files: [attachment],
    });
  },
};

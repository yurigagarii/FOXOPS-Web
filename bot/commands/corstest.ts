import {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder
} from 'discord.js';
import axios from 'axios';

const HENRIK_API_KEY = process.env.HENRIK_API_KEY || 'API_KEYİNİ_BURAYA_YAZ';

export const corsairtestcommand = {
  data: new SlashCommandBuilder()
    .setName('testcross')
    .setDescription('Crosshair PNG gönderir (HenrikDev)')
    .addStringOption(o =>
      o.setName('id')
        .setDescription('Crosshair kodu')
        .setRequired(true)
    ),

  async execute(interaction: any) {
    await interaction.deferReply();

    try {
      // 🔹 Slash option
      const id = interaction.options.getString('id');

      // 🔹 HenrikDev PNG isteği
      const imageRes = await axios.get(
        'https://api.henrikdev.xyz/valorant/v1/crosshair/generate',
        {
          params: { id },
          headers: {
            Authorization: HENRIK_API_KEY,
            Accept: 'image/png'
          },
          responseType: 'arraybuffer'
        }
      );

      // 🔹 Attachment
      const attachment = new AttachmentBuilder(
        Buffer.from(imageRes.data),
        { name: 'crosshair.png' }
      );

      // 🔹 Embed
      const embed = new EmbedBuilder()
        .setTitle('🎯 Valorant Crosshair')
        .setColor(0xFF4655)
        .setImage('attachment://crosshair.png')
        .setFooter({ text: 'Kaynak: HenrikDev API' });

      // 🔹 Gönder
      await interaction.editReply({
        embeds: [embed],
        files: [attachment]
      });

    } catch (err: any) {
      console.error(err?.response?.data || err);
      await interaction.editReply('❌ Crosshair görseli alınamadı.');
    }
  }
};

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient';
import { CardGenerator } from '../../services/image/cardGenerator';
const riot = new RiotClient(); const card = new CardGenerator();

export const lolLiveCommand = {
    data: new SlashCommandBuilder().setName('lol-canli').setDescription('Bir oyuncunun canlı maçını gösterir.')
        .addStringOption(o => o.setName('isim').setDescription('İsim').setRequired(true))
        .addStringOption(o => o.setName('tag').setDescription('Tag').setRequired(true)),
    async execute(interaction: any) {
        await interaction.deferReply();
        const data = await riot.getLolActiveGame(interaction.options.getString('isim'), interaction.options.getString('tag'));
        if (data.error) return interaction.editReply(`❌ ${data.error}`);
        const img = await card.generateLolLiveCard(data);
        await interaction.editReply({ files: [new AttachmentBuilder(img, { name: 'live.png' })] });
    }
};

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient';
import { CardGenerator } from '../../services/image/cardGenerator';
const riot = new RiotClient(); const card = new CardGenerator();

export const lolStatusCommand = {
    data: new SlashCommandBuilder().setName('lol-durum').setDescription('LoL sunucu durumunu gösterir.'),
    async execute(interaction: any) {
        await interaction.deferReply();
        const data = await riot.getLolStatus('tr1');
        const img = await card.generateLolStatusCard(data);
        await interaction.editReply({ files: [new AttachmentBuilder(img, { name: 'status.png' })] });
    }
};

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient';
import { CardGenerator } from '../../services/image/cardGenerator';
const riot = new RiotClient(); const card = new CardGenerator();

export const lolRotationCommand = {
    data: new SlashCommandBuilder().setName('lol-rotasyon').setDescription('Haftalık ücretsiz şampiyonları gösterir.'),
    async execute(interaction: any) {
        await interaction.deferReply();
        const data = await riot.getLolRotation('tr1');
        const img = await card.generateLolRotationCard(data);
        await interaction.editReply({ files: [new AttachmentBuilder(img, { name: 'rot.png' })] });
    }
};

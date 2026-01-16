import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient';
import { CardGenerator } from '../../services/image/cardGenerator';
const riot = new RiotClient(); const card = new CardGenerator();

export const lolMetaCommand = {
    data: new SlashCommandBuilder().setName('lol-meta').setDescription('Rol bazlı en güçlü şampiyonları (Meta) gösterir.'),
    async execute(interaction: any) {
        await interaction.deferReply();
        const data = await riot.getLolMeta();
        const img = await card.generateLolMetaCard(data);
        await interaction.editReply({ files: [new AttachmentBuilder(img, { name: 'meta.png' })] });
    }
};

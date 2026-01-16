import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient';
import { CardGenerator } from '../../services/image/cardGenerator';

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();

export const leaderboardCommand = {
    data: new SlashCommandBuilder()
        .setName('siralama')
        .setDescription('Avrupa (EU) sunucusundaki en iyi 10 Valorant oyuncusunu gösterir.'),

    async execute(interaction: any) {
        await interaction.deferReply();

        try {
            const data = await riotClient.getLeaderboard('eu');

            if (data.error) {
                await interaction.editReply(`❌ ${data.error}`);
                return;
            }

            const imageBuffer = await cardGenerator.generateLeaderboardCard(data);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'leaderboard.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Bir hata oluştu.');
        }
    }
};

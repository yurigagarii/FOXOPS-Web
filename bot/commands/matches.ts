import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient'; 
import { CardGenerator } from '../../services/image/cardGenerator'; 

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();

export const matchesCommand = {
    data: new SlashCommandBuilder()
        .setName('son5') 
        .setDescription('Oyuncunun son 5 maç geçmişini gösterir.')
        .addStringOption(option =>
            option.setName('isim')
            .setDescription('Riot Adı (Örn: Kasabinhooo)')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('etiket')
            .setDescription('Etiket (Örn: TR1)')
            .setRequired(true)
        ),

    async execute(interaction: any) {
        await interaction.deferReply();

        try {
            const gameName = interaction.options.getString('isim');
            const tagLine = interaction.options.getString('etiket');
            const cleanTag = tagLine.replace('#', '');

            const stats: any = await riotClient.getLast5Matches(gameName, cleanTag);

            if (!stats || stats.error) {
                 return interaction.editReply(`⚠️ ${stats.error || "Beklenmedik bir hata oluştu."}`);
            }
            
            const imageBuffer = await cardGenerator.generateMatchHistoryCard(stats);
            const attachment = new AttachmentBuilder(imageBuffer, { name: `history-${gameName}.png` });

            const embed = new EmbedBuilder()
                .setTitle(`Maç Geçmişi: ${stats.username} #${stats.tag}`)
                .setColor(0xffffff) 
                .setImage(`attachment://history-${gameName}.png`)
                .setFooter({ text: `FoxOps System • Match History` });

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Komut Hatası:', error);
            await interaction.editReply('İşlem sırasında bir hata oluştu.');
        }
    }
};

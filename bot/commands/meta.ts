import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient'; 
import { CardGenerator } from '../../services/image/cardGenerator'; 

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();

export const metaCommand = {
    data: new SlashCommandBuilder()
        .setName('meta') 
        .setDescription('Oyuncunun en iyi oynadığı ajanları ve kazanma oranlarını gösterir.')
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

            const stats: any = await riotClient.getUserTopAgents(gameName, cleanTag);

            if (!stats || stats.error) {
                 return interaction.editReply(`⚠️ ${stats.error || "Veri bulunamadı."}`);
            }

            const imageBuffer = await cardGenerator.generateMetaCard(stats);
            const attachment = new AttachmentBuilder(imageBuffer, { name: `meta-${gameName}.png` });
            
            const embed = new EmbedBuilder()
                .setTitle(`Kişisel Meta: ${stats.username} #${stats.tag}`)
                .setColor(0xffce00) 
                .setImage(`attachment://meta-${gameName}.png`)
                .setFooter({ text: `FoxOps System • Top Agents` });

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Komut Hatası:', error);
            await interaction.editReply('İşlem sırasında bir hata oluştu.');
        }
    }
};

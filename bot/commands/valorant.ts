import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient'; 
import { CardGenerator } from '../../services/image/cardGenerator'; 

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();

export const valorantCommand = {
    data: new SlashCommandBuilder()
        .setName('lg') 
        .setDescription('Oyuncunun son Valorant maç kartını oluşturur.')
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

            const stats: any = await riotClient.getPlayerStatsForCard(gameName, cleanTag);

            if (!stats) {
                return interaction.editReply(`❌ Beklenmedik bir hata oluştu.`);
            }
            
            if (stats.error) {
                 return interaction.editReply(`⚠️ ${stats.error}`);
            }

            const imageBuffer = await cardGenerator.generateCard(stats);
            const attachment = new AttachmentBuilder(imageBuffer, { name: `card-${gameName}.png` });

            const embed = new EmbedBuilder()
                .setTitle(`Valorant Son Maç: ${stats.username} #${stats.tag}`)
                .setColor(stats.isWin ? 0x00FF9D : 0xFF4655)
                .addFields(
                    { name: 'Durum', value: stats.isWin ? '🏆 KAZANDI' : '💀 KAYBETTİ', inline: true },
                    { name: 'KDA', value: `${stats.score}`, inline: true },
                    { name: 'KD Oranı', value: `${stats.kdRatio}`, inline: true },
                    { name: 'HS Oranı', value: `%${stats.hsRate}`, inline: true },
                    { name: 'Yorum', value: `*${stats.funnyComment}*`, inline: false }
                )
                .setImage(`attachment://card-${gameName}.png`)
                .setFooter({ text: `Sunucu: ${stats.region} • Mod: ${stats.matchMode}` });

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Komut Hatası:', error);
            await interaction.editReply('İşlem sırasında beklenmedik bir hata oluştu.');
        }
    }
};

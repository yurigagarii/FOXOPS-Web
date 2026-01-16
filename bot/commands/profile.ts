import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient'; 
import { CardGenerator } from '../../services/image/cardGenerator'; 

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();

export const profileCommand = {
    data: new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Oyuncunun genel profilini ve rankını gösterir.')
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
            const stats: any = await riotClient.getProfileStats(gameName, cleanTag);

            if (!stats || stats.error) {
                 return interaction.editReply(`⚠️ ${stats.error || "Beklenmedik bir hata oluştu."}`);
            }

            const imageBuffer = await cardGenerator.generateProfileCard(stats);
            const attachment = new AttachmentBuilder(imageBuffer, { name: `profile-${gameName}.png` });

            const embed = new EmbedBuilder()
                .setTitle(`Profil: ${stats.username} #${stats.tag}`)
                .setColor(0x0f1217)
                .setImage(`attachment://profile-${gameName}.png`)
                .setFooter({ text: `FoxOps System • ${stats.region}` });

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Komut Hatası:', error);
            await interaction.editReply('İşlem sırasında bir hata oluştu.');
        }
    }
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient'; 

const riotClient = new RiotClient();

export const statusCommand = {
    data: new SlashCommandBuilder()
        .setName('sunucu') 
        .setDescription('Valorant sunucularının (EU/TR) anlık durumunu gösterir.'),

    async execute(interaction: any) {
        await interaction.deferReply();

        try {
            const status: any = await riotClient.getServerStatus('eu');

            if (status.error) {
                return interaction.editReply(`⚠️ ${status.error}`);
            }

            const embed = new EmbedBuilder()
                .setTitle(`Valorant Sunucu Durumu (${status.region})`)
                .setFooter({ text: 'FoxOps System • Server Status' });

            if (status.isOnline) {
                embed.setColor(0x00FF9D); 
                embed.setDescription(`✅ **Sunucular Aktif ve Sorunsuz!**\nŞu an bildirilen herhangi bir kesinti veya bakım çalışması yok.`);
                embed.setThumbnail('https://media.discordapp.net/attachments/123/check-icon.png'); 
            } else {
                embed.setColor(0xFF4655); 
                embed.setDescription(`⚠️ **Sunucularda Sorun veya Bakım Var!**`);

                if (status.maintenances.length > 0) {
                    status.maintenances.forEach((m: any) => {
                        embed.addFields({ 
                            name: `🛠️ Bakım: ${m.titles.find((t:any) => t.locale === 'tr_TR')?.content || m.titles[0].content}`, 
                            value: `Durum: ${m.maintenance_status}` 
                        });
                    });
                }

                if (status.incidents.length > 0) {
                    status.incidents.forEach((i: any) => {
                        embed.addFields({ 
                            name: `🚨 Sorun: ${i.titles.find((t:any) => t.locale === 'tr_TR')?.content || i.titles[0].content}`, 
                            value: `Önem: ${i.incident_severity}` 
                        });
                    });
                }
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Komut Hatası:', error);
            await interaction.editReply('İşlem sırasında bir hata oluştu.');
        }
    }
};

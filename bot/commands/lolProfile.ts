import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient';
import { CardGenerator } from '../../services/image/cardGenerator';

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();

export const lolProfileCommand = {
    data: new SlashCommandBuilder()
        .setName('lol')
        .setDescription('League of Legends profilini gösterir.')
        .addStringOption(option =>
            option.setName('isim')
                .setDescription('Riot ID İsim')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('Riot ID Etiket (TR1, EUW vb.)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sunucu')
                .setDescription('Sunucu (Varsayılan: TR1)')
                .setRequired(false)
                .addChoices(
                    { name: 'TR (Türkiye)', value: 'tr1' },
                    { name: 'EUW (Batı Avrupa)', value: 'euw1' },
                    { name: 'EUNE (Kuzey Avrupa)', value: 'eun1' },
                    { name: 'NA (Kuzey Amerika)', value: 'na1' }
                )),

    async execute(interaction: any) {
        await interaction.deferReply();

        try {
            const name = interaction.options.getString('isim');
            const tag = interaction.options.getString('tag');
            const region = interaction.options.getString('sunucu') || 'tr1';

            const data = await riotClient.getLolProfile(name, tag, region);

            if (data.error) {
                await interaction.editReply(`❌ ${data.error}`);
                return;
            }

            const imageBuffer = await cardGenerator.generateLolProfileCard(data);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'lol-profile.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Bir hata oluştu.');
        }
    }
};

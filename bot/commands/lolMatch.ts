import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient';
import { CardGenerator } from '../../services/image/cardGenerator';

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();

export const lolMatchCommand = {
    data: new SlashCommandBuilder()
        .setName('lol-lg')
        .setDescription('LoL son maç detaylarını gösterir.')
        .addStringOption(option =>
            option.setName('isim')
                .setDescription('Riot ID İsim')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('Riot ID Etiket')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sunucu')
                .setDescription('Sunucu (Varsayılan: TR1)')
                .setRequired(false)
                .addChoices(
                    { name: 'TR', value: 'tr1' },
                    { name: 'EUW', value: 'euw1' },
                    { name: 'NA', value: 'na1' }
                )),

    async execute(interaction: any) {
        await interaction.deferReply();

        try {
            const name = interaction.options.getString('isim');
            const tag = interaction.options.getString('tag');
            const region = interaction.options.getString('sunucu') || 'tr1';

            const data = await riotClient.getLolLastMatch(name, tag, region);

            if (data.error) {
                await interaction.editReply(`❌ ${data.error}`);
                return;
            }

            const imageBuffer = await cardGenerator.generateLolMatchCard(data);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'lol-match.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Bir hata oluştu.');
        }
    }
};

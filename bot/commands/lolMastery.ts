import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { RiotClient } from '../../services/riot/riotClient';
import { CardGenerator } from '../../services/image/cardGenerator';

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();

export const lolMasteryCommand = {
    data: new SlashCommandBuilder()
        .setName('lol-mastery')
        .setDescription('LoL hesabındaki en yüksek ustalığa sahip 3 şampiyonu gösterir.')
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
                    { name: 'NA (Kuzey Amerika)', value: 'na1' }
                )),

    async execute(interaction: any) {
        await interaction.deferReply();

        try {
            const name = interaction.options.getString('isim');
            const tag = interaction.options.getString('tag');
            const region = interaction.options.getString('sunucu') || 'tr1';

            const data = await riotClient.getLolMastery(name, tag, region);

            if (data.error) {
                await interaction.editReply(`❌ ${data.error}`);
                return;
            }

            const imageBuffer = await cardGenerator.generateLolMasteryCard(data);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'lol-mastery.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Bir hata oluştu.');
        }
    }
};

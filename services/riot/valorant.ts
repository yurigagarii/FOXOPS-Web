import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { RiotClient } from './riotClient'; 
import { CardGenerator } from '../image/cardGenerator'; 

const riotClient = new RiotClient();
const cardGenerator = new CardGenerator();
const winQuotes = [
    "Sırtın ağrımadı mı takımı taşımaktan? 🎒",
    "E-sporcu musun mübarek? Bu ne performans! 🔥",
    "Karşı takımın monitörleri kapalıydı galiba? 🖱️",
    "Smurf olduğunu çaktırmamaya çalışıyorsun ama yemezler. 😎",
    "MVP sensin, gerisi NPC. 🤖",
    "Easy peasy lemon squeezy! 🍋"
];

const loseQuotes = [
    "Takım satmış net. Yoksa senlik bir şey yok. 🤥",
    "Olsun be, monitörün fişi çıkmıştır kesin. 🔌",
    "Sage revive atsa da kurtaramazdı bu maçı. 💀",
    "Riot seni sevmiyor bugün, kapat git yat. 📉",
    "Bu maç yaşanmadı sayıyoruz... 🤫",
    "Diff var dediler geldik, harbi varmış. (Sende değil tabii!)"
];

const getRandomQuote = (array: string[]) => array[Math.floor(Math.random() * array.length)];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('valorant')
        .setDescription('Oyuncunun detaylı Valorant kartını oluşturur (Racon içerir).')
        .addStringOption(option =>
            option.setName('id')
            .setDescription('Riot ID (Örn: Fox#TR1)')
            .setRequired(true)
        ),

    async execute(interaction: any) {
        await interaction.deferReply();

        try {
            const riotIdInput = interaction.options.getString('id');
            
            if (!riotIdInput.includes('#')) {
                return interaction.editReply('❌ Hocam klavyen mi bozuk? `İsim#Etiket` formatında yazman lazım. (Örn: Fox#TR1)');
            }

            const [gameName, tagLine] = riotIdInput.split('#');
            const stats = await riotClient.getAccount(gameName, tagLine);

            if (!stats) {
                return interaction.editReply(`🕵️‍♂️ **${riotIdInput}** kim? Riot bile tanımıyor bunu. İsmi doğru yazdığına emin misin?`);
            }
            
            if (stats.error) {
                 return interaction.editReply(`⚠️ Bir sıkıntı çıktı: ${stats.error}. Sunucular patlamış olabilir.`);
            }

            const imageBuffer = await cardGenerator.generateCard(stats);
            const attachment = new AttachmentBuilder(imageBuffer, { name: `card-${gameName}.png` });

            let comment = stats.isWin ? getRandomQuote(winQuotes) : getRandomQuote(loseQuotes);
            
            if (parseFloat(stats.kdRatio) < 0.5) comment += "\n*(Bu KD ne kanka, kör mü oynadın?)* 🦯";
            if (parseFloat(stats.kdRatio) > 3.0) comment += "\n*(Hile açmadın di mi? Doğru söyle.)* 🚔";
            if (stats.hsRate > 40) comment += "\n*(Aim bot musun be mübarek!)* 🎯";

            const embed = new EmbedBuilder()
                .setTitle(`📊 Ajan Raporu: ${stats.username}`)
                .setDescription(`**${comment}**`)
                .setColor(stats.isWin ? 0x00FF9D : 0xFF4655)
                .addFields(
                    { name: 'Sonuç', value: stats.isWin ? '🏆 KAZANDI' : '💀 KAYBETTİ', inline: true },
                    { name: 'KDA', value: `${stats.score}`, inline: true },
                    { name: 'Kafa Oranı', value: `%${stats.hsRate}`, inline: true }
                )
                .setImage(`attachment://card-${gameName}.png`)
                .setFooter({ 
                    text: `Server: ${stats.region} • Mod: ${stats.matchMode} • FoxOps Gururla Sunar 🦊`, 
                    iconURL: 'https://cdn-icons-png.flaticon.com/512/4666/4666060.png'
                });

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('💥 Bot patladı! Kodları yazan arkadaşa ilet, düzeltsin. (Hata oluştu)');
        }
    }
};

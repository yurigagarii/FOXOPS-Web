import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { CardGenerator } from '../../services/image/cardGenerator'; 

const cardGenerator = new CardGenerator();

export const crosshairCommand = {
    data: new SlashCommandBuilder()
        .setName('crosshair') 
        .setDescription('Verilen nişangah (crosshair) kodunun görsel önizlemesini oluşturur.')
        .addStringOption(option =>
            option.setName('kod')
            .setDescription('Valorant Crosshair Kodu (Örn: 0;P;c;5;h;0...)')
            .setRequired(true)
        ),

    async execute(interaction: any) {
        await interaction.deferReply();

        try {
    const code = interaction.options.getString('kod'); 
    
    const imageBuffer = await cardGenerator.generateCrosshairCard(code);

      
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        console.error('❌ API boş veya geçersiz görsel döndü');
        throw new Error('API geçersiz görsel döndü');
    } 
    
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'crosshair-preview.png' });
    
    const embed = new EmbedBuilder()
        .setTitle(`🎯 Crosshair Önizleme`)
        .setColor(0xFF4655)
        .setDescription(`**KOD:**\n\`${code}\``)
        .setImage('attachment://crosshair-preview.png')
        .setFooter({ text: 'FoxOps System • Crosshair Generator' });

    await interaction.editReply({ embeds: [embed], files: [attachment] }); 

} catch (error) {
    console.error('Crosshair Hatası:', error);
    await interaction.editReply('❌ Kod hatalı veya görsel oluşturulamadı. Lütfen geçerli bir Valorant crosshair kodu girin.');
}
    }
};
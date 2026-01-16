import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { DISCORD_TOKEN, DISCORD_CLIENT_ID } from '../config/secrets';

import { valorantCommand } from './commands/valorant'; 
import { profileCommand } from './commands/profile';   
import { matchesCommand } from './commands/matches';   
import { crosshairCommand } from './commands/crosshair'; 
import { statusCommand } from './commands/status';     
import { metaCommand } from './commands/meta';

import { corsairtestcommand } from './commands/corstest';
import { lolLiveCommand } from './commands/lolLive';
import { lolStatusCommand } from './commands/lolStatus';
import { lolRotationCommand } from './commands/lolRotation';
import { lolMetaCommand } from './commands/lolMeta';
import { leaderboardCommand } from './commands/leaderboard'; 
import { lolProfileCommand } from './commands/lolProfile'; 
import { lolMasteryCommand } from './commands/lolMastery'; 
import { lolMatchCommand } from './commands/lolMatch';    

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
    console.error("❌ HATA: .env dosyasında DISCORD_TOKEN veya DISCORD_CLIENT_ID eksik!");
    process.exit(1); 
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages 
    ]
});

const commands = [
    valorantCommand,
    profileCommand,
    matchesCommand,
    crosshairCommand,
    statusCommand,
    metaCommand,
    corsairtestcommand,
    leaderboardCommand,
    lolProfileCommand, 
    lolMasteryCommand, 
    lolMatchCommand,
    lolLiveCommand,
    lolStatusCommand,
    lolRotationCommand,
    lolMetaCommand,
];

client.once('ready', async () => {
    console.log(`✅ Bot giriş yaptı: ${client.user?.tag}`);
    console.log(`🚀 2026 Bot Projesi Başlatılıyor...`);
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN!);

    try {
        console.log(`⏳ ${commands.length} komut yükleniyor (/)...`);
        
        await rest.put(
            Routes.applicationCommands(DISCORD_CLIENT_ID!),
            { body: commands.map(c => c.data.toJSON()) },
        );

        console.log('✅ Tüm komutlar başarıyla yüklendi!');
    } catch (error) {
        console.error('❌ Komut yükleme hatası:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(c => c.data.name === interaction.commandName);

    if (command) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Komut çalıştırılırken hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Komut çalıştırılırken hata oluştu!', ephemeral: true });
            }
        }
    }
});

client.login(DISCORD_TOKEN);

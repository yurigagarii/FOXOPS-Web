import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
    puuid: { type: String, required: true, unique: true },
    name: String,
    tag: String,
    elo: Number,        
    rankTier: String,  
    stats: {
        kda: Number,
        hs: Number
    },
    lastUpdated: { type: Date, default: Date.now }
});
const PlayerModel = mongoose.models.Player || mongoose.model('Player', PlayerSchema);

export class LeaderboardService {
    
    static async updatePlayer(profileData: any) {
        try {
            await mongoose.connect(process.env.MONGODB_URI as string);
            
            await PlayerModel.findOneAndUpdate(
                { puuid: profileData.player.puuid }, 
                {
                    name: profileData.player.name,
                    tag: profileData.player.tag,
                    elo: profileData.rank.elo,       
                    rankTier: profileData.rank.tier,
                    stats: {
                        kda: parseFloat(profileData.stats.kda),
                        hs: profileData.stats.headshotPercent
                    },
                    lastUpdated: new Date()
                },
                { upsert: true, new: true } 
            );
            console.log(`✅ ${profileData.player.name} sıralamaya eklendi/güncellendi.`);
        } catch (error) {
            console.error("Veritabanı Hatası:", error);
        }
    }
    static async getTopPlayers() {
        await mongoose.connect(process.env.MONGODB_URI as string);
        return await PlayerModel.find().sort({ elo: -1 }).limit(10); 
    }
    static async getWeeklyMVP() {
        await mongoose.connect(process.env.MONGODB_URI as string);
        return await PlayerModel.findOne().sort({ "stats.kda": -1 });
    }
}

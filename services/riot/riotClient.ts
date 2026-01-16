import axios from 'axios';
import { HENRIK_API_KEY } from '../../config/secrets';
import {RIOT_API_KEY} from '../../config/secrets';
export class RiotClient {
    constructor() {} 
    async getProfileStats(name: string, tag: string) {
        try {
            const headers = HENRIK_API_KEY ? { 'Authorization': HENRIK_API_KEY } : {};

            console.log(`👤 [Profil] Aranıyor: ${name}#${tag}`);
            let region = 'eu';
            let accountData;
            
            try {
                const accountUrl = `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
                const accountRes = await axios.get(accountUrl, { headers });
                if (accountRes.data?.data) {
                    region = accountRes.data.data.region;
                    accountData = accountRes.data.data;
                }
            } catch (e) { console.log("⚠️ Bölge varsayılan (EU) veya bulunamadı."); }

            const mmrUrl = `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const mmrRes = await axios.get(mmrUrl, { headers });
            
            const mmrData = mmrRes.data?.data;
            const currentData = mmrData?.current_data || {};
            const currentRankName = currentData.currenttierpatched || "Unranked";
            const currentRR = currentData.ranking_in_tier || 0;
            const rrPercentage = Math.min(currentRR, 100); 
            const mmrChange = currentData.mmr_change_to_last_game || 0;
            
            const tierId = currentData.currenttier || 0;
            const rankIconUrl = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tierId}/largeicon.png`;

            const peakRankName = mmrData?.highest_rank?.patched_tier || "Bilinmiyor";
            const peakSeason = mmrData?.highest_rank?.season || "";
            
            const peakTierId = mmrData?.highest_rank?.tier || 0;
            const peakRankIconUrl = peakTierId > 0 ? `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${peakTierId}/smallicon.png` : rankIconUrl;

            return {
                username: accountData ? accountData.name : name,
                tag: accountData ? accountData.tag : tag,
                region: region.toUpperCase(),
                accountLevel: accountData ? accountData.account_level : "??",
                cardImage: accountData?.card?.wide || "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png", 
                currentRankName,
                currentRR,
                rrPercentage, 
                mmrChange, 
                rankIcon: rankIconUrl,
                peakRankName,
                peakSeason,
                peakRankIcon: peakRankIconUrl
            };

        } catch (error: any) {
            console.error("Profil Hatası:", error.response?.status);
            if (error.response?.status === 404) return { error: "Oyuncu bulunamadı." };
            if (error.response?.status === 400) return { error: "Bu oyuncu rekabetçi oynamamış." };
            return { error: "Veri çekilirken hata oluştu." };
        }
    }
    
    async getPlayerStatsForCard(name: string, tag: string) {
        try {
            const headers = HENRIK_API_KEY ? { 'Authorization': HENRIK_API_KEY } : {};

            console.log(`🌍 [1] Bölge Tespiti: ${name}#${tag}`);
            let region = 'eu';
            let accountData;

            try {
                const accountUrl = `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
                const accountRes = await axios.get(accountUrl, { headers });
                if (accountRes.data?.data) {
                    region = accountRes.data.data.region;
                    accountData = accountRes.data.data;
                }
            } catch (e) { console.log("⚠️ Bölge varsayılan (EU)."); }

            const matchesUrl = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const response = await axios.get(matchesUrl, { headers });

            if (!response.data?.data?.length) return { error: "Maç geçmişi yok." };

            const lastMatch = response.data.data[0];
            const player = lastMatch.players.all_players.find(
                (p: any) => p.name.toLowerCase() === name.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase()
            );

            if (!player) return { error: "Oyuncu maçta bulunamadı." };

            const mode = lastMatch.metadata.mode;
            let isWin = false;
            let themeClass = 'lose';

            if (mode === 'Deathmatch') {
                themeClass = 'deathmatch'; 
                isWin = false;
            } else if (lastMatch.metadata.teams && player.team) {
                const playerTeam = player.team.toLowerCase();
                const teamData = lastMatch.metadata.teams[playerTeam];
                if (teamData) isWin = teamData.has_won;
                themeClass = isWin ? 'win' : 'lose';
            }

            const s = player.stats;
            const totalShots = s.headshots + s.bodyshots + s.legshots;
            const hsRate = totalShots ? Math.round((s.headshots / totalShots) * 100) : 0;
            
            const deaths = s.deaths === 0 ? 1 : s.deaths;
            const kdRatio = Number((s.kills / deaths).toFixed(2));

            const roundsPlayed = lastMatch.metadata.rounds_played || 1;
            const damagePerRound = Math.round(player.damage_made / roundsPlayed);

            const tierId = player.currenttier || 0;
            const rankIconUrl = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tierId}/largeicon.png`;

            let funnyComment = "İyi deneme.";

            if (mode === 'Deathmatch') {
                funnyComment = "Isınma turları... 🏃";
            } else if (hsRate > 45) { 
                funnyComment = "O nasıl aim makine misin? 🤖";
            } else if (hsRate < 10 && totalShots > 10) {
                funnyComment = "Ayak fetişin mi var? 🦶";
            } else if (kdRatio > 2.0) { 
                funnyComment = "Smurf alarmı! 🚨";
            } else if (kdRatio < 0.5) {
                funnyComment = "Bot taklidi mi yapıyorsun? 🤖";
            } else if (s.assists > 12) {
                funnyComment = "Tam bir takım oyuncusu. 🤝";
            } else if (s.kills > 25) {
                funnyComment = "Sırtın ağrımadı mı? 🎒";
            } else if (s.deaths > 20) {
                funnyComment = "Base'i çok sevdin galiba. 🏠";
            } else if (isWin && kdRatio < 0.8) {
                funnyComment = "Takım taşımış, dua et. 🚛";
            } else if (isWin) {
                funnyComment = "Kolaydı (ez). 😎";
            } else if (!isWin && kdRatio > 1.2) {
                funnyComment = "Sen oynadın, takım izledi... 🥀";
            } else {
                const randomLoses = [
                    "Takım farkı... 📉",
                    "Şanssız maç. 🎲",
                    "Bir sonraki maç senindir. 👊",
                    "Nt (Nice Try). 👍"
                ];
                funnyComment = randomLoses[Math.floor(Math.random() * randomLoses.length)];
            }
            
            const realName = accountData ? accountData.name : player.name;
            const realTag = accountData ? accountData.tag : player.tag;

            return {
                username: realName,
                tag: realTag,
                region: region.toUpperCase(),
                agentImage: player.assets.agent.small,
                rankIcon: rankIconUrl, 
                isWin,
                themeClass, 
                score: `${s.kills} / ${s.deaths} / ${s.assists}`,
                kdRatio,
                hsRate,
                funnyComment,
                damage: damagePerRound,
                matchMap: lastMatch.metadata.map,
                matchMode: lastMatch.metadata.mode,
            };

        } catch (error: any) {
            console.error("Hata:", error.response?.status);
            return { error: "Veri çekilemedi." };
        }
    }

    async getLast5Matches(name: string, tag: string) {
        try {
            const headers = HENRIK_API_KEY ? { 'Authorization': HENRIK_API_KEY } : {};

            console.log(`📜 [Geçmiş] Aranıyor: ${name}#${tag}`);
            
            let region = 'eu';
            let accountData;
            try {
                const accountUrl = `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
                const accountRes = await axios.get(accountUrl, { headers });
                if (accountRes.data?.data) {
                    region = accountRes.data.data.region;
                    accountData = accountRes.data.data;
                }
            } catch (e) { console.log("⚠️ Bölge varsayılan (EU)."); }

            const matchesUrl = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const response = await axios.get(matchesUrl, { headers });

            if (!response.data?.data?.length) return { error: "Maç geçmişi bulunamadı." };

            const rawMatches = response.data.data.slice(0, 5);

            const processedMatches = rawMatches.map((match: any) => {
                const player = match.players.all_players.find(
                    (p: any) => p.name.toLowerCase() === name.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase()
                );

                if (!player) return null;

                let isWin = false;
                let resultText = "KAYBETTİ";
                let resultClass = "lose"; 

                if (match.metadata.mode === 'Deathmatch') {
                    resultText = "DM";
                    resultClass = "neutral";
                    isWin = true;
                } else if (match.metadata.teams && player.team) {
                    const teamColor = player.team.toLowerCase();
                    const team = match.metadata.teams[teamColor];
                    if (team && team.has_won) {
                        isWin = true;
                        resultText = "KAZANDI";
                        resultClass = "win";
                    } else if (match.metadata.rounds_played === null) {
                        resultText = "BERABERE";
                        resultClass = "neutral";
                    }
                }

                let scoreDisplay = "Oynandı";
                if (match.metadata.mode !== 'Deathmatch' && match.metadata.teams) {
                     const myTeamScore = match.metadata.teams[player.team.toLowerCase()].rounds_won;
                     const enemyTeamScore = match.metadata.teams[player.team.toLowerCase() === 'red' ? 'blue' : 'red'].rounds_won;
                     scoreDisplay = `${myTeamScore} - ${enemyTeamScore}`;
                }

                const kda = `${player.stats.kills} / ${player.stats.deaths} / ${player.stats.assists}`;
                
                return {
                    mapName: match.metadata.map,
                    mode: match.metadata.mode,
                    agentImage: player.assets.agent.small,
                    kda: kda,
                    score: scoreDisplay,
                    resultText,
                    resultClass,
                    matchDate: new Date(match.metadata.game_start_patched).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
                };
            }).filter((m: any) => m !== null);

            return {
                username: accountData ? accountData.name : name,
                tag: accountData ? accountData.tag : tag,
                matches: processedMatches,
                playerCard: accountData?.card?.small || "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png"
            };

        } catch (error: any) {
            console.error("Geçmiş Hatası:", error.response?.status);
            return { error: "Veri çekilemedi." };
        }
    }

    async getCrosshairCode(name: string, tag: string): Promise<{ code?: string; error?: string }> {
        try {
            const headers = HENRIK_API_KEY ? { 'Authorization': HENRIK_API_KEY } : {};
            console.log(`🎯 [Crosshair] Aranıyor: ${name}#${tag}`);

            const url = `https://api.henrikdev.xyz/valorant/v1/account/crosshair/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const response = await axios.get(url, { headers });

            const code = response.data?.data;
            if (code) {
                return { code };
            } else {
                return { error: "Crosshair kodu bulunamadı." };
            }

        } catch (error: any) {
            console.error("Crosshair Hatası:", error.response?.status);
            if (error.response?.status === 404) return { error: "Oyuncu veya crosshair bulunamadı." };
            return { error: "Veri çekilirken hata oluştu." };
        }
    }


    async getServerStatus(region: string = 'eu') {
        try {
            const headers = HENRIK_API_KEY ? { 'Authorization': HENRIK_API_KEY } : {};
            
            const url = `https://api.henrikdev.xyz/valorant/v1/status/${region}`;
            const response = await axios.get(url, { headers });

            if (!response.data || !response.data.data) {
                return { error: "Sunucu durumu alınamadı." };
            }

            const data = response.data.data;
            
            const maintenances = data.maintenances || [];
            const incidents = data.incidents || [];
            
            const hasIssues = maintenances.length > 0 || incidents.length > 0;

            return {
                region: region.toUpperCase(),
                isOnline: !hasIssues,
                maintenances: maintenances,
                incidents: incidents
            };

        } catch (error: any) {
            console.error("Status Hatası:", error.response?.status);
            return { error: "Sunucu durumu çekilirken hata oluştu." };
        }
    }

    async getUserTopAgents(name: string, tag: string) {
        try {
            const headers = HENRIK_API_KEY ? { 'Authorization': HENRIK_API_KEY } : {};

            console.log(`📊 [Meta] Analiz ediliyor: ${name}#${tag}`);
            
            let region = 'eu';
            let accountData;
            try {
                const accountUrl = `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
                const res = await axios.get(accountUrl, { headers });
                if (res.data?.data) {
                    region = res.data.data.region;
                    accountData = res.data.data;
                }
            } catch (e) { console.log("⚠️ Bölge varsayılan (EU)."); }

            const matchesUrl = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const response = await axios.get(matchesUrl, { headers });

            if (!response.data?.data?.length) return { error: "Maç verisi bulunamadı." };

            const matches = response.data.data;
            const agentStats: any = {};

            matches.forEach((match: any) => {
                if (match.metadata.mode === 'Deathmatch') return; 

                const player = match.players.all_players.find(
                    (p: any) => p.name.toLowerCase() === name.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase()
                );

                if (!player) return;

                const agentName = player.character;
                
                if (!agentStats[agentName]) {
                    agentStats[agentName] = {
                        name: agentName,
                        icon: player.assets.agent.small,
                        kills: 0,
                        deaths: 0,
                        wins: 0,
                        matches: 0
                    };
                }

                agentStats[agentName].matches += 1;
                agentStats[agentName].kills += player.stats.kills;
                agentStats[agentName].deaths += player.stats.deaths;

                const teamColor = player.team.toLowerCase();
                if (match.metadata.teams && match.metadata.teams[teamColor]?.has_won) {
                    agentStats[agentName].wins += 1;
                }
            });

            const sortedAgents = Object.values(agentStats)
                .sort((a: any, b: any) => b.matches - a.matches) 
                .slice(0, 3); 

            const processedAgents = sortedAgents.map((agent: any) => {
                const winRate = Math.round((agent.wins / agent.matches) * 100);
                const kd = (agent.kills / (agent.deaths || 1)).toFixed(2);
                
                return {
                    name: agent.name,
                    icon: agent.icon,
                    matches: agent.matches,
                    winRate: winRate,
                    kd: kd,
                    isHighWinRate: winRate >= 50
                };
            });

            return {
                username: accountData ? accountData.name : name,
                tag: accountData ? accountData.tag : tag,
                cardImage: accountData?.card?.wide || "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png",
                topAgents: processedAgents,
                totalMatchesAnalyzed: matches.length
            };

        } catch (error: any) {
            console.error("Meta Hatası:", error.response?.status);
            return { error: "Veri analiz edilirken hata oluştu." };
        }
    }

    async getLeaderboard(region: string = 'eu') {
        try {
            const headers = HENRIK_API_KEY ? { 'Authorization': HENRIK_API_KEY } : {};
            const url = `https://api.henrikdev.xyz/valorant/v1/leaderboard/${region}`;
            
            const response = await axios.get(url, { headers });

            if (!response.data || !Array.isArray(response.data)) {
                return { error: "Sıralama verisi alınamadı." };
            }

            const top10 = response.data.slice(0, 10).map((player: any) => ({
                rank: player.leaderboardRank,
                gameName: player.gameName || "Gizli Oyuncu",
                tagLine: player.tagLine || "???",
                rankedRating: player.rankedRating,
                numberOfWins: player.numberOfWins
            }));

            return { players: top10 };

        } catch (error: any) {
            console.error("Leaderboard Hatası:", error.response?.status);
            return { error: "Sıralama çekilirken hata oluştu." };
        }
    }

    async getLolProfile(name: string, tag: string, region: string = 'tr1') {
        try {
            const apiKey = RIOT_API_KEY; 
            if (!apiKey) return { error: "Riot API Key eksik." };

            const headers = { "X-Riot-Token": apiKey };

            const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const accountRes = await axios.get(accountUrl, { headers });
            
            const puuid = accountRes.data.puuid;
            const realName = accountRes.data.gameName;
            const realTag = accountRes.data.tagLine;

            const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
            const summonerRes = await axios.get(summonerUrl, { headers });
            
            const summonerId = summonerRes.data.id;
            const profileIconId = summonerRes.data.profileIconId;
            const level = summonerRes.data.summonerLevel;

            const leagueUrl = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
            const leagueRes = await axios.get(leagueUrl, { headers });

            const ranks = leagueRes.data;
            const formatRank = (type: string) => {
                const data = ranks.find((r: any) => r.queueType === type);
                if (!data) return {
                    tier: "UNRANKED",
                    lp: 0,
                    wins: 0,
                    losses: 0,
                    wr: 0,
                    lr: 100,
                    icon: "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/unranked.png"
                };

                const tier = data.tier; // GOLD
                const rank = data.rank; // IV
                const totalGames = data.wins + data.losses;
                const wr = totalGames > 0 ? Math.round((data.wins / totalGames) * 100) : 0;

                const icon = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/${tier.toLowerCase()}.png`;

                return {
                    tier: `${tier} ${rank}`,
                    lp: data.leaguePoints,
                    wins: data.wins,
                    losses: data.losses,
                    wr: wr,
                    lr: 100 - wr,
                    icon: icon
                };
            };

            const soloRank = formatRank("RANKED_SOLO_5x5");
            const flexRank = formatRank("RANKED_FLEX_SR");

            return {
                name: realName,
                tag: realTag,
                region: region.toUpperCase(),
                level: level,
                profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${profileIconId}.png`,
                
                soloTier: soloRank.tier,
                soloLp: soloRank.lp, 
                soloLpVal: soloRank.lp,
                soloWins: soloRank.wins,
                soloLosses: soloRank.losses,
                soloWr: soloRank.wr,
                soloLr: soloRank.lr,
                soloRankIcon: soloRank.icon,

                flexTier: flexRank.tier,
                flexLp: flexRank.lp,
                flexWins: flexRank.wins,
                flexLosses: flexRank.losses,
                flexWr: flexRank.wr,
                flexLr: flexRank.lr,
                flexRankIcon: flexRank.icon
            };

        } catch (error: any) {
            console.error("LoL Profil Hatası:", error.response?.status);
            if (error.response?.status === 404) return { error: "Oyuncu bulunamadı (Bölgeyi kontrol et)." };
            if (error.response?.status === 403) return { error: "API Key süresi dolmuş." };
            return { error: "Veri çekilirken hata oluştu." };
        }
    }

    async getLolMastery(name: string, tag: string, region: string = 'tr1') {
        try {
            const apiKey = RIOT_API_KEY; 
            if (!apiKey) return { error: "Riot API Key eksik." };
            const headers = { "X-Riot-Token": apiKey };

            const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const accountRes = await axios.get(accountUrl, { headers });
            const puuid = accountRes.data.puuid;
            const realName = accountRes.data.gameName;

            const masteryUrl = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`;
            const masteryRes = await axios.get(masteryUrl, { headers });
            const masteries = masteryRes.data;

            if (masteries.length === 0) return { error: "Hiçbir şampiyonda ustalık puanı yok." };

            const ddragonVer = "14.1.1"; 
            const champsUrl = `https://ddragon.leagueoflegends.com/cdn/${ddragonVer}/data/tr_TR/champion.json`;
            const champsRes = await axios.get(champsUrl);
            const champData = champsRes.data.data;
            const getChampDetails = (id: number) => {
                for (const key in champData) {
                    if (champData[key].key == id) {
                        return {
                            id: champData[key].id, 
                            name: champData[key].name 
                        };
                    }
                }
                return { id: "Unknown", name: "Bilinmiyor" };
            };

            const processChamp = (data: any) => {
                if (!data) return { name: "-", points: "-", level: "-", image: "" };
                const details = getChampDetails(data.championId);
                return {
                    name: details.name,
                    points: data.championPoints.toLocaleString('tr-TR'),
                    level: data.championLevel,
                    image: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${details.id}_0.jpg`
                };
            };

            const champ1 = processChamp(masteries[0]);
            
            return {
                name: realName,
                bgImage: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${getChampDetails(masteries[0].championId).id}_0.jpg`,
                champ1: champ1,
                champ2: processChamp(masteries[1]),
                champ3: processChamp(masteries[2])
            };

        } catch (error: any) {
            console.error("Mastery Hatası:", error.response?.status);
            if (error.response?.status === 404) return { error: "Oyuncu bulunamadı." };
            return { error: "Veri çekilirken hata oluştu." };
        }
    }

    async getLolLastMatch(name: string, tag: string, region: string = 'tr1') {
        try {
            const apiKey = RIOT_API_KEY; 
            if (!apiKey) return { error: "Riot API Key eksik." };
            const headers = { "X-Riot-Token": apiKey };

            const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const accountRes = await axios.get(accountUrl, { headers });
            const puuid = accountRes.data.puuid;

            let cluster = 'europe';
            if (region.startsWith('na') || region.startsWith('br') || region.startsWith('la')) cluster = 'americas';
            if (region.startsWith('kr') || region.startsWith('jp')) cluster = 'asia';

            const matchIdsUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`;
            const matchIdsRes = await axios.get(matchIdsUrl, { headers });

            if (!matchIdsRes.data || matchIdsRes.data.length === 0) {
                return { error: "Maç geçmişi bulunamadı." };
            }

            const matchId = matchIdsRes.data[0];

            const matchUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            const matchRes = await axios.get(matchUrl, { headers });
            const matchData = matchRes.data.info;

            const participant = matchData.participants.find((p: any) => p.puuid === puuid);
            if (!participant) return { error: "Oyuncu verisi maçta bulunamadı." };

            const isWin = participant.win;
            const minutes = Math.floor(matchData.gameDuration / 60);
            const seconds = matchData.gameDuration % 60;
            const cs = participant.totalMinionsKilled + participant.neutralMinionsKilled;
            const csPerMin = (cs / minutes).toFixed(1);
            
            const items = [];
            for (let i = 0; i <= 6; i++) {
                const itemId = participant[`item${i}`];
                if (itemId > 0) {
                    items.push(`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${itemId}.png`);
                }
            }

            const deaths = participant.deaths === 0 ? 1 : participant.deaths;
            const kdaRatio = ((participant.kills + participant.assists) / deaths).toFixed(2);

            return {
                resultClass: isWin ? 'win' : 'lose',
                resultText: isWin ? 'ZAFER' : 'BOZGUN',
                gameMode: matchData.gameMode,
                gameDuration: `${minutes}dk ${seconds}sn`,
                championName: participant.championName,
                splashImage: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${participant.championName}_0.jpg`,
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                kdaRatio: kdaRatio,
                cs: cs,
                csPerMin: csPerMin,
                items: items
            };

        } catch (error: any) {
            console.error("LoL Son Maç Hatası:", error.response?.status);
            if (error.response?.status === 404) return { error: "Maç verisi bulunamadı." };
            return { error: "Veri çekilirken hata oluştu." };
        }
    }
    async getLolActiveGame(name: string, tag: string, region: string = 'tr1') {
        try {
            const apiKey = RIOT_API_KEY; 
            const headers = { "X-Riot-Token": apiKey };

            const accUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
            const accRes = await axios.get(accUrl, { headers });
            const puuid = accRes.data.puuid;
            const url = `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${puuid}`;
            const res = await axios.get(url, { headers });
            const gameData = res.data;
            
            const formatPlayer = (p: any) => ({
                name: p.riotId || p.summonerName,
                champName: "", 
                champImage: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${p.championId}.png`, 
                rawChampImage: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${p.championId}.png`,
                spell1: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${this.getSpellName(p.spell1Id)}.png`,
                spell2: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${this.getSpellName(p.spell2Id)}.png`,
                teamId: p.teamId
            });

            const participants = gameData.participants.map((p: any) => ({
                name: p.riotId || p.summonerName,
                champName: "Şampiyon", 
                champImage: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${p.championId}.png`,
                spell1: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/summoner${this.getSpellRawName(p.spell1Id)}.png`, 
                spell2: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/summoner${this.getSpellRawName(p.spell2Id)}.png`,
                teamId: p.teamId
            }));

            return {
                blueTeam: participants.filter((p: any) => p.teamId === 100),
                redTeam: participants.filter((p: any) => p.teamId === 200)
            };

        } catch (error: any) {
            if (error.response?.status === 404) return { error: "Oyuncu şu an maçta değil." };
            return { error: "Veri çekilemedi." };
        }
    }

    private getSpellRawName(id: number): string {
        const spells: any = { 4: "flash", 12: "teleport", 14: "dot", 7: "heal", 6: "ghost", 11: "smite", 21: "barrier", 3: "exhaust", 1: "boost" };
        return spells[id] || "flash"; 
    }
    private getSpellName(id: number): string {
        const spells: any = { 4: "SummonerFlash", 12: "SummonerTeleport", 14: "SummonerDot", 7: "SummonerHeal", 6: "SummonerHaste", 11: "SummonerSmite", 21: "SummonerBarrier", 3: "SummonerExhaust", 1: "SummonerBoost" };
        return spells[id] || "SummonerFlash";
    }

    async getLolStatus(region: string = 'tr1') {
        try {
            const apiKey = RIOT_API_KEY;
            const url = `https://${region}.api.riotgames.com/lol/status/v4/platform-data`;
            const res = await axios.get(url, { headers: { "X-Riot-Token": apiKey } });
            
            const main = res.data.maintenances;
            const incidents = res.data.incidents;
            const isOnline = main.length === 0 && incidents.length === 0;

            return {
                serverName: region.toUpperCase(),
                statusClass: isOnline ? 'online' : 'offline',
                statusIcon: isOnline ? '✅' : '⚠️',
                message: isOnline ? 'Tüm sistemler çalışıyor. Vadiye inebilirsin!' : 'Sunucuda bakım veya sorunlar var.'
            };
        } catch (e) { return { error: "Sunucu durumu alınamadı." }; }
    }

    async getLolRotation(region: string = 'tr1') {
        try {
            const apiKey = RIOT_API_KEY;
            const url = `https://${region}.api.riotgames.com/lol/platform/v3/champion-rotations`;
            const res = await axios.get(url, { headers: { "X-Riot-Token": apiKey } });
            const freeIds = res.data.freeChampionIds;

            const ddragonRes = await axios.get("https://ddragon.leagueoflegends.com/cdn/14.1.1/data/tr_TR/champion.json");
            const champData = ddragonRes.data.data;
            
            const champs = [];
            for (const key in champData) {
                const c = champData[key];
                if (freeIds.includes(parseInt(c.key))) {
                    champs.push({
                        name: c.name,
                        image: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${c.id}.png`
                    });
                }
            }
            return { champs: champs.slice(0, 15) };
        } catch (e) { return { error: "Rotasyon alınamadı." }; }
    }

    async getLolMeta() {
        const getImg = (name: string) => `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${name}.png`;
        
        return {
            top: [ {name:"Aatrox", image:getImg("Aatrox")}, {name:"Jax", image:getImg("Jax")}, {name:"Darius", image:getImg("Darius")}, {name:"Rumble", image:getImg("Rumble")} ],
            jungle: [ {name:"Lee Sin", image:getImg("LeeSin")}, {name:"Viego", image:getImg("Viego")}, {name:"Kayn", image:getImg("Kayn")}, {name:"Nocturne", image:getImg("Nocturne")} ],
            mid: [ {name:"Ahri", image:getImg("Ahri")}, {name:"Akali", image:getImg("Akali")}, {name:"Sylas", image:getImg("Sylas")}, {name:"Yone", image:getImg("Yone")} ],
            adc: [ {name:"Jhin", image:getImg("Jhin")}, {name:"Kaisa", image:getImg("Kaisa")}, {name:"Ezreal", image:getImg("Ezreal")}, {name:"Caitlyn", image:getImg("Caitlyn")} ],
            sup: [ {name:"Thresh", image:getImg("Thresh")}, {name:"Lulu", image:getImg("Lulu")}, {name:"Nautilus", image:getImg("Nautilus")}, {name:"Pyke", image:getImg("Pyke")} ]
        };
    }
  }
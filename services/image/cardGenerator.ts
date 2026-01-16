import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import axios from 'axios';

export class CardGenerator {
    private templatePath = path.join(process.cwd(), 'src', 'templates', 'valorant-card.html');
    private profileTemplatePath = path.join(process.cwd(), 'src', 'templates', 'profile-card.html');
    private historyTemplatePath = path.join(process.cwd(), 'src', 'templates', 'match-history.html');
    private crosshairTemplatePath = path.join(process.cwd(), 'src', 'templates', 'crosshair-card.html');
    private metaTemplatePath = path.join(process.cwd(), 'src', 'templates', 'meta-card.html');
    private leaderboardTemplatePath = path.join(process.cwd(), 'src', 'templates', 'leaderboard-card.html');
    private lolProfileTemplatePath = path.join(process.cwd(), 'src', 'templates', 'lol-profile.html');
    private lolMasteryTemplatePath = path.join(process.cwd(), 'src', 'templates', 'lol-mastery.html');
    private lolMatchTemplatePath = path.join(process.cwd(), 'src', 'templates', 'lol-match.html');
    private lolLiveTemplatePath = path.join(process.cwd(), 'src', 'templates', 'lol-live.html');
    private lolStatusTemplatePath = path.join(process.cwd(), 'src', 'templates', 'lol-status.html');
    private lolRotationTemplatePath = path.join(process.cwd(), 'src', 'templates', 'lol-rotation.html');
    private lolMetaTemplatePath = path.join(process.cwd(), 'src', 'templates', 'lol-meta.html');
    
    async generateCard(stats: any): Promise<Buffer> {
        try {
            if (!fs.existsSync(this.templatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${this.templatePath}`);
            }

            const templateHtml = fs.readFileSync(this.templatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            
            const isDeathmatch = stats.matchMode === 'Deathmatch';

            const html = template({
                ...stats,
                isDeathmatch,
                bgImage: stats.isWin 
                    ? 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png' 
                    : 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png'
            });

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1200, height: 600, deviceScaleFactor: 2 });
            
            await page.setContent(html, { 
                waitUntil: 'networkidle0' 
            });

            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error(error);
            throw new Error('Kart oluşturulurken hata meydana geldi.');
        }
    }

    async generateProfileCard(stats: any): Promise<Buffer> {
        try {
            if (!fs.existsSync(this.profileTemplatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${this.profileTemplatePath}`);
            }

            const templateHtml = fs.readFileSync(this.profileTemplatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            const html = template(stats);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 450, deviceScaleFactor: 2 });
            
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error(error);
            throw new Error('Profil kartı oluşturulurken hata meydana geldi.');
        }
    }

    async generateMatchHistoryCard(stats: any): Promise<Buffer> {
        try {
            if (!fs.existsSync(this.historyTemplatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${this.historyTemplatePath}`);
            }

            const templateHtml = fs.readFileSync(this.historyTemplatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            
            const html = template(stats);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
            
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error(error);
            throw new Error('Geçmiş kartı oluşturulurken hata meydana geldi.');
        }
    }

    async generateCrosshairCard(code: string): Promise<Buffer> {
        try {
            if (!fs.existsSync(this.crosshairTemplatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${this.crosshairTemplatePath}`);
            }

            const templateHtml = fs.readFileSync(this.crosshairTemplatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            
            const apiUrl = 'https://api.henrikdev.xyz/valorant/v1/crosshair/generate';
            const apiKey = process.env.HENRIK_API_KEY; 
 
            const response = await axios.get(apiUrl, {
                params: {
                    id: code 
                },
                headers: {
                    'Authorization': apiKey, 
                    'Accept': '*/*', 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                },
                responseType: 'arraybuffer',
                validateStatus: (status) => status < 500 
            });

            const contentType = response.headers['content-type'];
            if (contentType && !contentType.includes('image')) {
                const errorText = Buffer.from(response.data).toString('utf-8');
                console.error("API HATA DÖNDÜRDÜ (JSON geldi):", errorText);
                throw new Error(`API resim vermedi, hata mesajı döndü.`);
            }

            const base64Image = `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;

            const html = template({
                code: code,
                generatedImageUrl: base64Image
            });

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

            await page.setViewport({ width: 500, height: 500, deviceScaleFactor: 2 });
            
            await page.setContent(html, { 
                waitUntil: 'networkidle0',
                timeout: 60000 
            });

            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error("Crosshair API Hatası:", error);
            throw new Error('Crosshair kartı oluşturulurken hata meydana geldi. API Key veya Kod hatalı olabilir.');
        }
    }

    async generateMetaCard(stats: any): Promise<Buffer> {
        try {
            if (!fs.existsSync(this.metaTemplatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${this.metaTemplatePath}`);
            }

            const templateHtml = fs.readFileSync(this.metaTemplatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            
            const html = template(stats);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 500, deviceScaleFactor: 2 });
            
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error(error);
            throw new Error('Meta kartı oluşturulurken hata meydana geldi.');
        }
    }

    async generateLeaderboardCard(data: any): Promise<Buffer> {
        try {
            if (!fs.existsSync(this.leaderboardTemplatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${this.leaderboardTemplatePath}`);
            }

            const templateHtml = fs.readFileSync(this.leaderboardTemplatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            
            const html = template(data);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
            
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error(error);
            throw new Error('Sıralama kartı oluşturulurken hata meydana geldi.');
        }
    }

    async generateLolProfileCard(stats: any): Promise<Buffer> {
        try {
            if (!fs.existsSync(this.lolProfileTemplatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${this.lolProfileTemplatePath}`);
            }

            const templateHtml = fs.readFileSync(this.lolProfileTemplatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            
            const html = template(stats);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 450, deviceScaleFactor: 2 });
            
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error(error);
            throw new Error('LoL profil kartı oluşturulurken hata meydana geldi.');
        }
    }

    async generateLolMasteryCard(stats: any): Promise<Buffer> {
        try {
            const templatePath = path.join(process.cwd(), 'src', 'templates', 'lol-mastery.html');

            if (!fs.existsSync(templatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${templatePath}`);
            }

            const templateHtml = fs.readFileSync(templatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            
            const html = template(stats);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 500, deviceScaleFactor: 2 });
            
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error(error);
            throw new Error('Mastery kartı oluşturulurken hata meydana geldi.');
        }
    }

    async generateLolMatchCard(stats: any): Promise<Buffer> {
        try {
            const templatePath = path.join(process.cwd(), 'src', 'templates', 'lol-match.html');

            if (!fs.existsSync(templatePath)) {
                throw new Error(`Şablon dosyası bulunamadı: ${templatePath}`);
            }

            const templateHtml = fs.readFileSync(templatePath, 'utf-8');
            const template = handlebars.compile(templateHtml);
            
            const html = template(stats);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 350, deviceScaleFactor: 2 });
            
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            return Buffer.from(imageBuffer);
            
        } catch (error) {
            console.error(error);
            throw new Error('Maç kartı oluşturulurken hata meydana geldi.');
        }
    }
          async generateLolLiveCard(data: any): Promise<Buffer> { return this.generateFromTemplate(this.lolLiveTemplatePath, data, 1000, 600); }
          async generateLolStatusCard(data: any): Promise<Buffer> { return this.generateFromTemplate(this.lolStatusTemplatePath, data, 600, 300); }
          async generateLolRotationCard(data: any): Promise<Buffer> { return this.generateFromTemplate(this.lolRotationTemplatePath, data, 800, 400); }
          async generateLolMetaCard(data: any): Promise<Buffer> { return this.generateFromTemplate(this.lolMetaTemplatePath, data, 1000, 500); }

private async generateFromTemplate(tplPath: string, data: any, w: number, h: number): Promise<Buffer> {
    try {
        if (!fs.existsSync(tplPath)) throw new Error(`Şablon yok: ${tplPath}`);
        const html = handlebars.compile(fs.readFileSync(tplPath, 'utf-8'))(data);
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const img = await page.screenshot({ type: 'png' });
        await browser.close();
        return Buffer.from(img);
    } catch (e) { console.error(e); throw new Error('Kart oluşturma hatası.'); }
}
}

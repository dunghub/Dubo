const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const puppeteer = require('puppeteer');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Sự kiện khi bot sẵn sàng
client.once('ready', async () => {
    console.log(`Đã đăng nhập thành công với tên: ${client.user.tag}`);
});

// Xử lý sự kiện khi người dùng gõ lệnh
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vuot-time') {
        await interaction.deferReply();
        const targetUrl = interaction.options.getString('url');

        let browser;
        try {
            // Khởi động Puppeteer
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-size=1920,1080',
                    '--disable-blink-features=AutomationControlled'
                ]
            });
            const page = await browser.newPage();

            // Giả lập User-Agent người dùng thật để tránh bị chặn
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
            });

            // Truy cập link đích
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Chờ trang load xong
            await new Promise(resolve => setTimeout(resolve, 5000));

            await interaction.editReply(`✅ **Đã truy cập thành công bằng Puppeteer!**\n🔗 **Link:** ${targetUrl}`);

        } catch (error) {
            console.error('Lỗi Puppeteer:', error);
            await interaction.editReply(`❌ **Lỗi:** Không thể xử lý link này (${error.message}).`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
});

// Đăng nhập bot bằng token trong file .env
client.login(process.env.TOKEN_VUOTTIME);

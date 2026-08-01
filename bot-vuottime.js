const { Client, GatewayIntentBits } = require('discord.js');
const { chromium } = require('playwright');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`Đã đăng nhập thành công với tên: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vuot-time') {
        await interaction.deferReply();
        const targetUrl = interaction.options.getString('url');

        let browser;
        try {
            // Khởi động trình duyệt cấu hình né cơ chế phát hiện bot cơ bản
            browser = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            
            const page = await context.newPage();

            let capturedKey = null;

            // Lắng nghe tất cả các response trả về từ server trong lúc trang hoạt động
            page.on('response', async response => {
                const url = response.url();
                try {
                    // Lọc các request có khả năng chứa key hoặc dữ liệu JSON trả về sau khi đếm ngược
                    if (response.headers()['content-type'] && response.headers()['content-type'].includes('application/json')) {
                        const json = await response.json();
                        
                        // Kiểm tra nếu trong JSON có chứa trường key, token hoặc data cần tìm
                        if (json.key || json.code || json.data || json.token) {
                            capturedKey = json.key || json.code || json.data || json.token;
                        }
                    }
                } catch (e) {
                    // Bỏ qua các response không đọc được dạng JSON
                }
            });

            console.log(`Đang truy cập và chờ bắt gói tin: ${targetUrl}`);
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Thử chờ tối đa một khoảng thời gian để các script ngầm chạy xong và gọi API nhận key
            // Hoặc có thể ép hệ thống gọi thẳng hàm lấy key nếu trang web lộ source
            let waitTime = 0;
            while (!capturedKey && waitTime < 15000) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                waitTime += 1000;
            }

            await browser.close();

            if (capturedKey) {
                await interaction.editReply(`✅ **Đã tóm gọn gói tin và lấy được Key!**\n🔗 **Link:** ${targetUrl}\n🔑 **Key:** \`${capturedKey}\``);
            } else {
                await interaction.editReply(`⚠️ **Đã quét xong nhưng chưa bắt được API trả key.** Trang này có thể yêu cầu click xác thực thủ công.`);
            }

        } catch (error) {
            if (browser) await browser.close();
            console.error('Lỗi bắt gói tin:', error.message);
            await interaction.editReply(`❌ **Lỗi:** ${error.message}`);
        }
    }
});

client.login(process.env.TOKEN_VUOTTIME);

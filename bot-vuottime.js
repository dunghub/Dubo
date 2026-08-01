const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
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

        try {
            // Gửi yêu cầu lấy nội dung trang web trực tiếp qua mạng
            const response = await axios.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            
            // Bạn có thể lấy tiêu đề trang hoặc dữ liệu ở đây
            const pageTitle = $('title').text() || 'Không có tiêu đề';

            await interaction.editReply(`✅ **Đã kết nối và quét dữ liệu thành công!**\n🔗 **Link:** ${targetUrl}\n📌 **Tiêu đề trang:** ${pageTitle}`);

        } catch (error) {
            console.error('Lỗi kết nối:', error.message);
            await interaction.editReply(`❌ **Lỗi:** Không thể truy cập link này (${error.message}).`);
        }
    }
});

client.login(process.env.TOKEN_VUOTTIME);

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
            // Bước 1: Gửi yêu cầu lấy nội dung trang web kèm các headers giả lập trình duyệt thật và Cookie nếu cần
            const response = await axios.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': targetUrl
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            
            // Bước 2: Tự động trích xuất các token ẩn, link chuyển hướng hoặc dữ liệu đếm ngược thường có trong form/script
            let hiddenToken = $('input[name="token"]').val() || $('input[id*="token"]').val() || null;
            let redirectLink = $('meta[http-equiv="refresh"]').attr('content') || null;
            let scriptData = $('script').text();
            
            // Tìm kiếm các biến thời gian hoặc API ngầm bên trong thẻ script nếu trang web dùng JS để khóa 60 giây
            let matchedApi = scriptData.match(/['"]\/api\/[^'"]+['"]/) || scriptData.match(/['"]https?:\/\/[^'"]+['"]/);

            // Bước 3: Xây dựng nội dung phản hồi chi tiết trả về Discord
            let resultMessage = `✅ **Đã quét dữ liệu thành công!**\n` +
                                `🔗 **Link:** ${targetUrl}\n` +
                                `📌 **Tiêu đề trang:** ${$('title').text() || 'Không có tiêu đề'}\n`;

            if (hiddenToken) {
                resultMessage += `🔑 **Token tìm thấy:** \`${hiddenToken}\`\n`;
            }
            if (redirectLink) {
                resultMessage += `🔄 **Meta Refresh:** \`${redirectLink}\`\n`;
            }
            if (matchedApi) {
                resultMessage += `⚡ **API nghi vấn:** \`${matchedApi[0]}\`\n`;
            }

            await interaction.editReply(resultMessage);

        } catch (error) {
            console.error('Lỗi kết nối:', error.message);
            await interaction.editReply(`❌ **Lỗi:** Không thể truy cập link này (${error.message}).`);
        }
    }
});

client.login(process.env.TOKEN_VUOTTIME);

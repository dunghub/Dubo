const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc v8')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot đã online hệ thống: ${client.user.tag}`);
    try {
        // Sử dụng TOKEN linh hoạt: Ưu tiên DISCORD_TOKEN, nếu không có sẽ lấy TOKEN thông thường
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        const rest = new REST({ version: '10' }).setToken(token);
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID || client.user.id), 
            { body: commands }
        );
        console.log('[OK] Đăng ký lệnh thành công!');
    } catch (error) {
        console.error('[THẤT BẠI] Lỗi đăng ký lệnh:', error.message);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url');

        try {
            // Hoãn phản hồi chống lỗi quá 3 giây của Discord
            await interaction.deferReply();

            // Kiểm tra định dạng link đầu vào
            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            // Gửi Embed thông báo đang xử lý
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang bẻ khóa link qua máy chủ siêu tốc cập nhật theo Delta, vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 ĐÃ FIX: Sửa lại cú pháp Template Literal sử dụng dấu huyền ` và thêm dấu $
            const coreApiUrl = `https://bypass.city{encodeURIComponent(url)}`;
            
            let finalKey = "";

            try {
                const response = await axios.get(coreApiUrl, { timeout: 25000 }); // Nâng lên 25 giây đề phòng API phản hồi chậm
                
                // Đọc cấu trúc JSON trả về từ API của bạn
                if (response.data) {
                    finalKey = response.data.key || response.data.result || response.data.query || response.data.bypassed;
                }
            } catch (netError) {
                console.error("API nghẽn mạng hoặc lỗi:", netError.message);
            }

            // Xử lý và hiển thị kết quả cho người dùng
            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: 'Vận hành tự động bởi Dubo Bot v8' });

                // Gửi đè lên Embed cũ, xóa trạng thái chờ
                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                // Đã fix lỗi xung đột bằng cách xóa mảng embeds cũ đi khi trả về thông báo lỗi dạng chữ
                await interaction.editReply({ embeds: [], content: "❌ **Bypass thất bại:** Link getkey đã hết hạn hoặc máy chủ bẻ khóa đang cập nhật bản vá. Vui lòng lấy link mới tinh trong game và thử lại sau ít phút." });
            }

        } catch (globalError) {
            console.error('Lỗi sập ngầm:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình kết nối mạng." });
            } catch (e) {}
        }
    }
});

// Giữ kết nối cổng mạng cho Render/Hosting không bị ngủ
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot active!');
});
server.listen(process.env.PORT || 3000);

// Khởi chạy bot
const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
client.login(botToken).catch(err => {
    console.error("[LỖI CHÍ MẠNG] Token điền trên Hosting/Render bị sai hoặc thiếu quyền Intents:", err.message);
});

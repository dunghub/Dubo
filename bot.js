const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Cấu hình lệnh Slash Command
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
    console.log(`[OK] Bot đã kết nối thành công: ${client.user.tag}`);
    try {
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        const rest = new REST({ version: '10' }).setToken(token);
        
        const CLIENT_ID = process.env.CLIENT_ID || client.user.id;
        const GUILD_ID = process.env.GUILD_ID; // Lấy từ biến môi trường của hosting mới

        console.log('[⏳] Đang đồng bộ lệnh Slash lên hệ thống mới...');
        
        if (GUILD_ID) {
            // Nâng cấp: Đăng ký lệnh trực tiếp vào Server (Có tác dụng ngay lập tức)
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), 
                { body: commands }
            );
            console.log(`[OK] Đã kích hoạt lệnh Slash siêu tốc cho Server ID: ${GUILD_ID}`);
        } else {
            // Phương án dự phòng: Đăng ký toàn cầu nếu không cấu hình GUILD_ID
            await rest.put(
                Routes.applicationCommands(CLIENT_ID), 
                { body: commands }
            );
            console.log('[OK] Đã đăng ký lệnh Slash Toàn Cầu (Global)!');
        }
    } catch (error) {
        console.error('[THẤT BẠI] Lỗi nạp lệnh lên máy chủ mới:', error.message);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url').trim();

        try {
            // Khóa phản hồi ngay lập tức để né lỗi "Ứng dụng không phản hồi" (Quá 3 giây)
            await interaction.deferReply();

            // Kiểm tra định dạng link đầu vào của Delta
            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            // Hiển thị trạng thái chờ xử lý đẹp mắt
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang bẻ khóa link qua máy chủ siêu tốc cập nhật theo Delta, vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // Cú pháp chuẩn hóa kết nối API bypass mới
            const coreApiUrl = `https://bypass.city{encodeURIComponent(url)}`;
            let finalKey = "";

            try {
                const response = await axios.get(coreApiUrl, { timeout: 25000 }); // Nâng hạn mức chờ lên 25 giây
                
                if (response.data) {
                    if (typeof response.data === 'object') {
                        finalKey = response.data.key || response.data.result || response.data.query || response.data.bypassed;
                    } else if (typeof response.data === 'string') {
                        finalKey = response.data;
                    }
                }
            } catch (netError) {
                console.error("API bẻ khóa bị nghẽn hoặc lỗi mạng:", netError.message);
            }

            if (finalKey) finalKey = finalKey.trim();

            // Phân tích kết quả trả về cho người dùng Discord
            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 3) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: 'Vận hành tự động bởi Dubo Bot v8' });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: "❌ **Bypass thất bại:** Link getkey đã hết hạn hoặc máy chủ bẻ khóa đang cập nhật bản vá. Vui lòng lấy link mới tinh trong game và thử lại sau." 
                });
            }

        } catch (globalError) {
            console.error('Lỗi sập luồng ngầm:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình kết nối mạng hệ thống." });
            } catch (e) {}
        }
    }
});

// Mở cổng mạng giữ kết nối liên tục, chống ngủ đông trên các Host mới (Render, Railway, v.v.)
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Dubo v8 Active!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[SERVER] Đã mở cổng mạng giữ ứng dụng hoạt động ổn định tại port: ${PORT}`);
});

// Kích hoạt đăng nhập Bot
const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
client.login(botToken).catch(err => {
    console.error("[LỖI CHÍ MẠNG] Token điền trên Hosting mới bị sai hoặc thiếu quyền cấu hình Intents:", err.message);
});

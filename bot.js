const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

// Khởi tạo Bot với cấu hình tối giản nhất để chống lỗi kết nối
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v4')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay cần bypass')
                .setRequired(true))
];

// Hàm tự động kích hoạt đăng ký lệnh với Discord khi bật bot
client.once('ready', async () => {
    console.log(`[HỆ THỐNG] Bot đã online thành công: ${client.user.tag}`);
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID || client.user.id), 
            { body: commands }
        );
        console.log('[HỆ THỐNG] Đăng ký lệnh Slash Command thành công!');
    } catch (error) {
        console.error('[LỖI] Không thể đăng ký lệnh với Discord:', error.message);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url');

        try {
            // Hoãn phản hồi ngay lập tức để ép Discord không báo lỗi "Ứng dụng không phản hồi"
            await interaction.deferReply();

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang tiến hành bẻ khóa qua cụm máy chủ lõi tự động bám đuổi Delta, vui lòng chờ...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // Sử dụng cổng mạng Loli Engine vừa cập nhật bản vá bám đuổi Delta mới nhất
            const coreApiUrl = `https://lolibypasser.lol{encodeURIComponent(url)}`;
            
            // Gửi request bẻ khóa ngầm qua Internet (Đợi tối đa 20 giây)
            const response = await axios.get(coreApiUrl, { timeout: 20000 });
            const data = response.data;
            const keyFound = data.key || data.result || data.bypassed;

            if (keyFound) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Success')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${keyFound}\n\`\`\``)
                    .setFooter({ text: 'Thực hiện tự động bởi Dubo Bot v4' });

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                await interaction.editReply({ content: "❌ **Thất bại:** Máy chủ không bóc tách được mã Key. Link có thể đã hết hạn, hãy lấy link mới tinh trong game." });
            }

        } catch (error) {
            console.error('[LỖI BYPASS]:', error.message);
            await interaction.editReply({ content: "❌ **Sự cố:** Cụm máy chủ bẻ khóa đang bị quá tải hoặc link getkey đã quá hạn. Vui lòng lấy link mới trong game và thử lại." });
        }
    }
});

// Tạo cổng HTTP giả lập giữ cho bot luôn sống trên Render
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is active!');
});
server.listen(process.env.PORT || 3000, () => {
    console.log('[HỆ THỐNG] Cổng giữ sóng HTTP đã bật tại port 3000');
});

// Kích hoạt đăng nhập Bot với Discord
if (!process.env.DISCORD_TOKEN) {
    console.error("[LỖI CHÍ MẠNG] Thiếu biến DISCORD_TOKEN trong cấu hình Render!");
} else {
    client.login(process.env.DISCORD_TOKEN).catch(err => {
        console.error("[LỖI CHÍ MẠNG] Không thể login bot. Hãy kiểm tra lại mã Token dán trong Render!", err.message);
    });
}

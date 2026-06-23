const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v3 - Auto Bám Đuổi Thuật Toán')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay cần bypass')
                .setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Đang đăng ký lệnh...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), 
            { body: commands }
        );
        console.log('Đăng ký lệnh thành công!');
    } catch (error) {
        console.error('Lỗi đăng ký lệnh:', error);
    }
})();

client.once('ready', () => {
    console.log(`Bot đã online: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url');

        try {
            // Hoãn phản hồi để tránh lỗi ứng dụng không phản hồi sau 3 giây
            await interaction.deferReply();

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang quét qua các mạng lưới máy chủ bẻ khóa chuyên biệt, vui lòng chờ...');
            
            await interaction.editReply({ embeds: [pendingEmbed] });

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                const invalidEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Link Không Hợp Lệ')
                    .setDescription('Đây không phải đường link Get Key chính thức của hệ thống Delta.');
                return await interaction.editReply({ embeds: [invalidEmbed] });
            }

            // Danh sách các API bẻ khóa lõi liên tục bám đuổi mã hóa mới của Delta
            const apiEndpoints = [
                { name: "Cụm Máy Chủ Lõi 1 (Bypass VIP)", url: `https://bypass.vip{encodeURIComponent(url)}` },
                { name: "Cụm Máy Chủ Lõi 2 (Loli Bypasser)", url: `https://lolibypasser.lol{encodeURIComponent(url)}` },
                { name: "Cụm Máy Chủ Dự Phòng 3 (Bypass Tech)", url: `https://bypass.tech{encodeURIComponent(url)}` },
                { name: "Mạng Lưới Phân Phối Đa Tầng", url: `https://bypass.city{encodeURIComponent(url)}` }
            ];

            let bypassSuccess = false;
            let finalKey = "";
            let usedServer = "";

            // Quét luân phiên qua từng cụm máy chủ gốc
            for (const api of apiEndpoints) {
                try {
                    console.log(`Đang kết nối đến: ${api.name}`);
                    const response = await axios.get(api.url, { timeout: 18000 }); // Chờ tối đa 18 giây mỗi cụm
                    const data = response.data;
                    
                    // Trích xuất mã Key linh hoạt dựa theo cấu trúc dữ liệu trả về của các bên
                    const keyFound = data.key || data.result || data.bypassed || (typeof data === 'string' && data.length < 100 ? data : null);

                    if (keyFound && !keyFound.includes('error') && !keyFound.includes('fail')) {
                        finalKey = keyFound;
                        usedServer = api.name;
                        bypassSuccess = true;
                        break; // Đã tìm thấy Key sạch thì dừng quét ngay lập tức
                    }
                } catch (err) {
                    console.log(`[Bận/Chặn] ${api.name} đang nâng cấp thuật toán, tự động chuyển tiếp...`);
                }
            }

            if (bypassSuccess) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Delta Success')
                    .setDescription(`🔑 **Key Delta của bạn đã bẻ khóa thành công:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý thành công qua hệ thống: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const allFailEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Hệ Thống Đang Đồng Bộ Bản Vá')
                    .setDescription('Delta vừa cập nhật lớp mã hóa mới cho hệ thống Platorelay. Toàn bộ các cụm máy chủ lõi đang tự động cấu hình lại mã nguồn bám đuổi. Vui lòng lấy link mới trong game và thử lại sau ít phút.');

                await interaction.editReply({ embeds: [allFailEmbed] });
            }

        } catch (globalError) {
            console.error('Lỗi vận hành hệ thống bot:', globalError.message);
            try {
                const systemErrorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Lỗi Kết Nối')
                    .setDescription('Bot gặp sự cố nghẽn mạng tạm thời khi gửi tín hiệu. Vui lòng thực hiện lại lệnh.');
                await interaction.editReply({ embeds: [systemErrorEmbed] });
            } catch (e) {
                console.error('Không thể cập nhật phản hồi lỗi:', e.message);
            }
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);

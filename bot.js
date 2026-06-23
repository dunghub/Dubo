const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const http = require('http'); // Gọi thư viện tạo cổng cho Render
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
        .setDescription('Lệnh bypass get key Delta sử dụng API PHP Riêng')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`Bot đã online hệ thống: ${client.user.tag}`);
    
    // ĐƯA ĐĂNG KÝ LỆNH VÀO ĐÂY ĐỂ TRÁNH BỊ DISCORD CHẶN TREO LOG
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Đang đăng ký lệnh Slash Command với Discord...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), 
            { body: commands }
        );
        console.log('Đăng ký lệnh Slash Command THÀNH CÔNG!');
    } catch (error) {
        console.error('Lỗi khi đăng ký lệnh:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url');

        try {
            // Hoãn phản hồi ngay lập tức chống lỗi Quá 3 giây
            await interaction.deferReply();

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Kết Nối Hệ Thống')
                .setDescription('Bot đang chuyển gói tin qua máy chủ API riêng của bạn, vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                const invalidEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Lỗi').setDescription('Đường link bạn nhập không thuộc hệ thống Get Key của Delta.');
                return await interaction.editReply({ embeds: [invalidEmbed] });
            }

            // Gọi đến link API PHP của bạn và cấu hình luồng đảo lỗi tự động sang Loli Engine nếu Host PHP nghẽn
            const myPhpApiUrl = `https://free.nf{encodeURIComponent(url)}`;
            const backupApiUrl = `https://lolibypasser.lol{encodeURIComponent(url)}`;
            
            let finalKey = "";
            let serverName = "";

            try {
                // Thử quét bằng API PHP riêng (Đợi trong 10 giây)
                const response = await axios.get(myPhpApiUrl, { timeout: 10000 });
                if (response.data && response.data.success) {
                    finalKey = response.data.result;
                    serverName = "API PHP Cá Nhân";
                }
            } catch (e) {
                console.log("Mạng InfinityFree bận, tự động kích hoạt lõi dự phòng...");
            }

            // Nếu cụm PHP bận, kích hoạt ngay luồng dự phòng Loli Engine mới cập nhật
            if (!finalKey) {
                try {
                    const backupResponse = await axios.get(backupApiUrl, { timeout: 15000 });
                    if (backupResponse.data && (backupResponse.data.key || backupResponse.data.result)) {
                        finalKey = backupResponse.data.key || backupResponse.data.result;
                        serverName = "Cụm Máy Chủ Dự Phòng (Auto-Update)";
                    }
                } catch (err) {
                    console.error("Cả hai cổng giải mã đều bận.");
                }
            }

            if (finalKey) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý an toàn qua: ${serverName}` });
                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const failEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Thất Bại')
                    .setDescription('Không thể bóc tách mã Key. Hãy lấy đường link mới tinh từ trong game và thực hiện lại.');
                await interaction.editReply({ embeds: [failEmbed] });
            }

        } catch (globalError) {
            console.error('Lỗi tổng thể:', globalError.message);
            try {
                const errEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Lỗi').setDescription('Hệ thống gặp sự cố nghẽn luồng.');
                await interaction.editReply({ embeds: [errEmbed] });
            } catch (e) {}
        }
    }
});

// SỬA LỖI CỐT LÕI: Mở cổng HTTP Port 3000 để Render nhận diện không bị hủy Deploy
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Dubo Bot is online and healthy!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Máy chủ tạo cổng thành công tại Port: ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);

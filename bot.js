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
        .setDescription('Lệnh bypass get key Delta đa máy chủ (Auto-Update)')
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

        const pendingEmbed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('⏳ Hệ Thống Đang Xử Lý')
            .setDescription('Đang quét link qua các cụm máy chủ bẻ khóa cập nhật liên tục, vui lòng đợi...');
        
        await interaction.reply({ embeds: [pendingEmbed], fetchReply: true });

        if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
            const invalidEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Link Không Hợp Lệ')
                .setDescription('Đây không phải đường link Get Key chính thức của Delta.');
            return await interaction.editReply({ embeds: [invalidEmbed] });
        }

        // 3 cụm máy chủ lớn độc lập, luôn tự động code bám đuổi thuật toán của Delta
        const apiEndpoints = [
            { name: "Cụm Lõi 1 (Loli Engine)", url: `https://lolibypasser.lol{encodeURIComponent(url)}` },
            { name: "Cụm Lõi 2 (Bypass VIP)", url: `https://bypass.vip{encodeURIComponent(url)}` },
            { name: "Cụm Lõi 3 (Bypass Tech)", url: `https://bypass.tech{encodeURIComponent(url)}` }
        ];

        let bypassSuccess = false;
        let finalKey = "";
        let usedServer = "";

        // Chạy vòng lặp quét qua từng máy chủ, thằng nào cập nhật xong trước sẽ cứu bot
        for (const api of apiEndpoints) {
            try {
                console.log(`Đang thử gọi: ${api.name}`);
                const response = await axios.get(api.url, { timeout: 15000 }); // Đợi tối đa 15s mỗi server
                const data = response.data;
                
                // Trích xuất mã key dựa theo định dạng trả về của các bên
                const keyFound = data.key || data.result || data.bypassed;

                if (keyFound) {
                    finalKey = keyFound;
                    usedServer = api.name;
                    bypassSuccess = true;
                    break; // Thành công thì ngắt vòng lặp ngay để trả kết quả nhanh
                }
            } catch (err) {
                console.log(`[Bận/Chặn] ${api.name} chưa cập nhật thuật toán mới, đang chuyển cụm tiếp theo...`);
            }
        }

        if (bypassSuccess) {
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Bypass Success')
                .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                .setFooter({ text: `Giải mã thành công qua ${usedServer}` });

            await interaction.editReply({ embeds: [successEmbed] });
        } else {
            const allFailEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Tất Cả Máy Chủ Đang Cập Nhật')
                .setDescription('Delta vừa đổi lớp mã hóa link getkey mới. Toàn bộ các cụm máy chủ lõi đang trong quá trình bám đuổi viết lại mã nguồn vá lỗi. Vui lòng lấy link mới từ game và thử lại sau ít phút.');

            await interaction.editReply({ embeds: [allFailEmbed] });
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

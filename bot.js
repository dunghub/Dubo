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
        .setDescription('Lệnh bypass get key Delta đa máy chủ')
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
            .setDescription('Đang kết nối qua các cụm máy chủ bẻ khóa, vui lòng đợi...');
        
        await interaction.reply({ embeds: [pendingEmbed], fetchReply: true });

        if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
            const invalidEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Đường Link Không Hợp Lệ')
                .setDescription('Đây không phải link Get Key chính thức của Delta.');
            return await interaction.editReply({ embeds: [invalidEmbed] });
        }

        // Danh sách 3 máy chủ bẻ khóa mạnh nhất được cấu hình chạy luân phiên bảo vệ nhau
        const apiEndpoints = [
            { name: "Cụm Máy Chủ Lõi 1 (Fluxus Engine)", url: `https://fluxus.org{encodeURIComponent(url)}` },
            { name: "Cụm Máy Chủ Lõi 2 (Bypass VIP)", url: `https://bypass.vip{encodeURIComponent(url)}` },
            { name: "Cụm Máy Chủ Lõi 3 (Bypass City)", url: `https://bypass.city{encodeURIComponent(url)}` }
        ];

        let bypassSuccess = false;
        let finalKey = "";

        // Duyệt qua từng máy chủ, cái nào sống đầu tiên sẽ lấy kết quả cái đó
        for (const api of apiEndpoints) {
            try {
                console.log(`Đang thử bypass qua: ${api.name}`);
                const response = await axios.get(api.url, { timeout: 10000 }); // Đợi tối đa 10s mỗi máy chủ
                
                if (response.data && response.data.result) {
                    finalKey = response.data.result;
                    bypassSuccess = true;
                    break; // Bẻ khóa thành công thì dừng vòng lặp ngay lập tức
                }
            } catch (err) {
                console.log(`[Thất bại] ${api.name} đang quá tải, tự động chuyển cụm tiếp theo...`);
            }
        }

        if (bypassSuccess) {
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Bypass Success')
                .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                .setFooter({ text: 'Hệ thống tự động điều tốc bảo vệ bởi Dubo Bot' });

            await interaction.editReply({ embeds: [successEmbed] });
        } else {
            const allFailEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Tất Cả Máy Chủ Đều Bảo Trì')
                .setDescription('Hiện tại phía nhà phát hành Delta vừa đổi thuật toán mới. Toàn bộ 3 cụm server bypass trung gian đang cập nhật bản vá. Vui lòng lấy link mới và thử lại sau ít phút.');

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

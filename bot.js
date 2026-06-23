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
        .setDescription('Lệnh bypass get key Delta qua Zen API')
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
            .setDescription('Đang kết nối qua cụm máy chủ Zen Bypass, vui lòng đợi...');
        
        await interaction.reply({ embeds: [pendingEmbed], fetchReply: true });

        if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
            const invalidEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Đường Link Không Hợp Lệ')
                .setDescription('Đây không phải link Get Key chính thức của Delta.');
            return await interaction.editReply({ embeds: [invalidEmbed] });
        }

        try {
            // Cấu hình API của Zen Bypass (izen.lol)
            const zenApiUrl = `https://izen.lol{encodeURIComponent(url)}`;
            
            const response = await axios.get(zenApiUrl, { 
                timeout: 25000, // Đợi Zen xử lý trong tối đa 25 giây
                headers: {
                    // Bạn cần cấu hình thêm biến ZEN_API_KEY ở mục nâng cao (Advanced) của Render giống như làm với Token
                    'Authorization': `Bearer ${process.env.ZEN_API_KEY || 'YOUR_ZEN_API_KEY'}`
                }
            });
            
            const data = response.data;

            // Kiểm tra kết quả trả về từ cấu hình chuẩn của Zen API
            if (data && data.success && data.result) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Zen Bypass Success')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${data.result}\n\`\`\``)
                    .setFooter({ text: 'Vận hành dựa trên lõi cao cấp Zen API' });

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const failEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Giải mã thất bại')
                    .setDescription(data.message || 'Mã lỗi từ máy chủ Zen: Link không hợp lệ hoặc đã hết hạn sử dụng.');
                
                await interaction.editReply({ embeds: [failEmbed] });
            }

        } catch (error) {
            console.error('Lỗi kết nối Zen API:', error.message);
            
            let errorMsg = 'Cụm máy chủ Zen đang bảo trì hoặc tài khoản API của bạn đã hết lượt credits.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMsg = error.response.data.message;
            }

            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Lỗi kết nối API')
                .setDescription(errorMsg);
            
            await interaction.editReply({ embeds: [errorEmbed] });
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

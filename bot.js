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
        .setDescription('Lệnh bypass get key Delta qua cụm Bypass Tools')
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
            // Hoãn phản hồi để tránh lỗi "Ứng dụng không phản hồi" từ Discord
            await interaction.deferReply();

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang bẻ khóa link thông qua cổng máy chủ Bypass Tools...');
            
            await interaction.editReply({ embeds: [pendingEmbed] });

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                const invalidEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Link Không Hợp Lệ')
                    .setDescription('Đây không phải đường link Get Key chính thức của hệ thống Delta.');
                return await interaction.editReply({ embeds: [invalidEmbed] });
            }

            // Gọi trực tiếp đến API bẻ khóa của hệ thống bypass.tools
            const bypassToolsUrl = `https://bypass.tools{encodeURIComponent(url)}`;
            
            // Ép bot chờ tối đa 20 giây để máy chủ quét quảng cáo ngầm
            const response = await axios.get(bypassToolsUrl, { timeout: 20000 });
            
            // Vì API của bên bypass.tools trả về chữ trơn (Plain Text) chứa thẳng cái Key
            const finalKey = response.data;

            // Kiểm tra xem kết quả có hợp lệ không (loại trừ từ khóa lỗi)
            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Success')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: 'Xử lý thành công qua lõi Bypass Tools Engine' });

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const failEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Xử lý thất bại')
                    .setDescription('Máy chủ không bóc tách được mã xác thực. Hãy lấy link mới tinh trong game và thử lại.');
                
                await interaction.editReply({ embeds: [failEmbed] });
            }

        } catch (error) {
            console.error('Lỗi kết nối Bypass Tools:', error.message);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Máy Chủ Bảo Trì / Quá Tải')
                .setDescription('Cổng API công cộng của Bypass Tools đang bị ngắt kết nối hoặc đang cập nhật mã nguồn theo Delta. Vui lòng thử lại sau ít phút.');
            
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

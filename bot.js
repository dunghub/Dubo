const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const http = require('http');
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
        .setDescription('Lệnh bypass link')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link cần bypass')
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
        const urlInput = interaction.options.getString('url');

        // Tạo trạng thái chờ ban đầu
        const pendingEmbed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('⏳ Đang xử lý')
            .setDescription('Đang thực hiện lệnh bypass...');

        await interaction.reply({ embeds: [pendingEmbed], fetchReply: true });

        try {
            // Thay thế bằng link API thực tế của bạn
            const apiEndpoint = `https://api.example.com/bypass?url=${encodeURIComponent(urlInput)}`;
            const response = await axios.get(apiEndpoint);
            
            // Lấy link kết quả (tùy thuộc vào cấu trúc API của bạn)
            const finalLink = response.data.result; 

            if (finalLink) {
                // Nhúng liên kết trực tiếp vào Embed thành công màu xanh lá
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Success')
                    .setDescription(`Nhấn vào liên kết sau để lấy key:\n${finalLink}`);

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const noLinkEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Thất bại')
                    .setDescription('Không thể tìm thấy link kết quả từ hệ thống.');

                await interaction.editReply({ embeds: [noLinkEmbed] });
            }

        } catch (error) {
            console.error('Lỗi khi gọi API:', error.message);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Gặp sự cố')
                .setDescription('Đã xảy ra lỗi trong quá trình kết nối hoặc xử lý liên kết.');

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
});

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);

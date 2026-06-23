const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        .setDescription('Lệnh bypass hệ thống')
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

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    if (message.content === 'ping') {
        message.reply('ping pong!');
    }
});
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url');
        
        // 1. Phản hồi trạng thái đang xử lý (Màu cam)
        const pendingEmbed = new EmbedBuilder()
            .setColor(0xFFA500) // Màu cam
            .setTitle('⏳ Đang xử lý')
            .setDescription(`Đang thực hiện lệnh bypass cho URL: ${url}`);
        
        await interaction.reply({ embeds: [pendingEmbed], fetchReply: true });

        // Giả lập thời gian xử lý và kiểm tra link
        setTimeout(async () => {
            // Kiểm tra link (Ví dụ: kiểm tra nếu link chứa 'delta' hoặc bắt đầu bằng 'http')
            if (url.includes('delta') || url.startsWith('http')) {
                // 2. Phản hồi thành công (Màu xanh lá)
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00) // Màu xanh lá
                    .setTitle('✅ Bypass Success')
                    .setDescription('Key đã được lấy thành công.');
                
                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                // 3. Phản hồi thất bại (Màu đỏ)
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000) // Màu đỏ
                    .setTitle('❌ Gặp sự cố')
                    .setDescription('Đây không phải là link get key hợp lệ.');
                
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }, 3000); // Thời gian chờ giả lập là 3 giây
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

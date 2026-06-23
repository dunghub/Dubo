const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

// 1. ĐỊNH NGHĨA LỆNH SLASH (Đã thêm ô nhập URL)
const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass hệ thống')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link cần bypass (Ví dụ: link Delta)')
                .setRequired(true)) // Bắt buộc phải nhập link mới chạy được lệnh
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// 2. ĐĂNG KÝ LỆNH VỚI DISCORD
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

// 3. CODE CŨ (Nhận tin nhắn chat thường)
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    if (message.content === 'ping') {
        message.reply('pong!');
    }
});

// 4. CODE MỚI (Xử lý lệnh /bypass kèm theo link)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        // Lấy đường link mà người dùng đã nhập vào
        const url = interaction.options.getString('url');
        
        // Phản hồi lại kèm theo link để bạn biết bot đã nhận đúng dữ liệu
        await interaction.reply(`Đang thực hiện lệnh bypass cho URL: ${url}`);
    }
});

// 5. GIỮ CHO BOT LUÔN CHẠY (Web Server cho Render)
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

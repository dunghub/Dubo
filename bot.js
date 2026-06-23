const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios'); // Gọi thư viện lõi kết nối mạng
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
        .setDescription('Lệnh bypass get key Delta')
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

        // 1. Tạo giao diện chờ xử lý gửi cho người dùng
        const pendingEmbed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('⏳ Đang xử lý')
            .setDescription('Đang thực hiện giải mã link Delta, vui lòng chờ giây lát...');
        
        await interaction.reply({ embeds: [pendingEmbed], fetchReply: true });

        // 2. Kiểm tra định dạng link xem có phải của Delta hệ thống mới không
        if (url.includes('platorelay.com') || url.includes('platoboost.com')) {
            try {
                // Định nghĩa link gửi lên API lõi bẻ khóa
                const coreApiUrl = `https://bypass.vip{encodeURIComponent(url)}`;
                
                // Bot gửi request ngầm đến máy chủ bẻ khóa (Đợi tối đa 20 giây)
                const response = await axios.get(coreApiUrl, { timeout: 20000 });
                const data = response.data;

                // Nếu máy chủ lõi bẻ khóa thành công và trả về chuỗi kết quả
                if (data && data.result) {
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Bypass Success')
                        .setDescription(`🔑 **Key Delta của bạn là:**\n\`\`\`text\n${data.result}\n\`\`\``)
                        .setFooter({ text: 'Thực hiện bởi Dubo Bot' });

                    await interaction.editReply({ embeds: [successEmbed] });
                } else {
                    // Trường hợp link lỗi hoặc máy chủ bẻ khóa không phân tích được
                    const failEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Thất bại')
                        .setDescription('Không thể bẻ khóa liên kết này. Link có thể đã hết hạn hoặc bị lỗi.');
                    
                    await interaction.editReply({ embeds: [failEmbed] });
                }

            } catch (error) {
                console.error('Lỗi bẻ khóa từ API lõi:', error.message);
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Hệ thống bận')
                    .setDescription('Máy chủ bẻ khóa đang quá tải hoặc gặp sự cố kết nối. Vui lòng thử lại sau.');
                
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        } else {
            // Trường hợp người dùng nhập bừa link khác
            const invalidEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Gặp sự cố')
                .setDescription('Đây không phải là link get key hợp lệ của Delta (Phải chứa platorelay.com).');
            
            await interaction.editReply({ embeds: [invalidEmbed] });
        }
    }
});

// Giữ cho bot luôn chạy khi treo trên các hosting như Render
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

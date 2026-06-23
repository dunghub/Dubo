lconst { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta sử dụng API PHP Cá Nhân')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[HỆ THỐNG] Bot đã online thành công: ${client.user.tag}`);
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID || client.user.id), 
            { body: commands }
        );
        console.log('[HỆ THỐNG] Đăng ký lệnh Slash Command thành công!');
    } catch (error) {
        console.error('[LỖI] Không thể đăng ký lệnh:', error.message);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url');

        try {
            // Hoãn phản hồi ngay lập tức chống lỗi quá 3 giây của Discord
            await interaction.deferReply();

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Kết Nối API Cá Nhân')
                .setDescription('Bot đang gửi dữ liệu bảo mật qua máy chủ API PHP riêng biệt của bạn, vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // Đường link API PHP riêng của bạn
            const myPhpApiUrl = `https://free.nf{encodeURIComponent(url)}`;
            
            let data = null;

            // BẢO VỆ CHÍ MẠNG: Bọc hàm gọi mạng vào khối try-catch độc lập để bảo vệ bot không bị sập nguồn
            try {
                const response = await axios.get(myPhpApiUrl, { timeout: 25000 }); // Chờ tối đa 25 giây
                data = response.data;
            } catch (networkError) {
                console.error('[LỖI MẠNG API PHP]:', networkError.message);
            }

            // Xử lý dữ liệu trả về sau khi kết nối an toàn
            if (data && data.success) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Độc Quyền Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta thu thập từ API Độc Lập của bạn:**\n\`\`\`text\n${data.result}\n\`\`\``)
                    .setFooter({ text: 'Vận hành khép kín bởi hệ thống API riêng của bạn' });

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const errorMsg = data && data.message ? data.message : 'Máy chủ API PHP của bạn phản hồi quá lâu hoặc bị nhà mạng chặn đứng.';
                const failEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ API Cá Nhân Gặp Lỗi')
                    .setDescription(errorMsg);
                
                await interaction.editReply({ embeds: [failEmbed] });
            }

        } catch (globalError) {
            // Đảm bảo nếu có bất cứ lỗi gì xảy ra ngoài ý muốn, bot vẫn sẽ sống sót và chạy tiếp lệnh sau
            console.error('[LỖI TỔNG THỂ]:', globalError.message);
            try {
                await interaction.editReply({ content: "❌ **Sự cố:** Hệ thống Bot không thể hoàn tất lệnh giải mã." });
            } catch (e) {}
        }
    }
});

// Giữ cổng HTTP cho Render hoạt động ổn định
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot active!');
});
server.listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_TOKEN);

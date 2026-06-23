const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta qua API PHP Cá Nhân')
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
        console.error('[LỖI CHÍ MẠNG] Không thể đăng ký lệnh:', error.message);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url');

        try {
            // SỬA LỖI PHẢN HỒI: Ép Discord nhận lệnh ngay từ mili-giây đầu tiên
            await interaction.deferReply().catch(err => console.error("Lỗi deferReply:", err.message));

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Kết Nối API Cá Nhân')
                .setDescription('Bot đang chuyển gói tin qua máy chủ API PHP riêng biệt (`dubobypass.free.nf`), vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // Đường link API PHP riêng của bạn
            const myPhpApiUrl = `https://free.nf{encodeURIComponent(url)}`;
            
            let data = null;

            try {
                // Gọi sang API PHP của bạn (Hạn định chờ 15 giây)
                const response = await axios.get(myPhpApiUrl, { timeout: 15000 });
                data = response.data;
            } catch (netError) {
                console.error('Lỗi kết nối API PHP:', netError.message);
            }

            if (data && data.success) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Độc Quyền Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta thu thập từ API PHP của bạn:**\n\`\`\`text\n${data.result}\n\`\`\``)
                    .setFooter({ text: 'Vận hành độc lập bởi Dubo Bot Hệ Thống' });
                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const errorMsg = data && data.message ? data.message : 'Máy chủ API PHP phản hồi quá lâu hoặc đang bị chặn kết nối ngầm.';
                const failEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ API Cá Nhân Gặp Lỗi')
                    .setDescription(errorMsg);
                await interaction.editReply({ embeds: [failEmbed] });
            }

        } catch (globalError) {
            console.error('[LỖI TỔNG THỂ]:', globalError.message);
            try {
                await interaction.editReply({ content: "❌ **Sự cố:** Hệ thống bot không thể hoàn tất lệnh giải mã." });
            } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot active!');
});
server.listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error("[LỖI CHÍ MẠNG] Không thể đăng nhập Token Bot:", err.message);
});

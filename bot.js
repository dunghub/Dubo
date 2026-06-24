const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cooldowns = new Map();

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc v8 - Bản Ép Luồng Vercel Sạch')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay hoặc Platoboost cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot Online hệ thống: ${client.user.tag}`);
    try {
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        if (!token) return console.error("❌ Thiếu DISCORD_TOKEN trong biến môi trường!");
        
        const rest = new REST({ version: '10' }).setToken(token);
        const CLIENT_ID = process.env.CLIENT_ID || client.user.id;
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log(`[OK] Kích hoạt hệ thống lệnh toàn cầu thành công!`);
    } catch (e) { console.error('Lỗi cấu hình:', e.message); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const cooldownAmount = 5 * 1000;

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (currentTime < expirationTime) {
                const timeLeft = ((expirationTime - currentTime) / 1000).toFixed(1);
                return await interaction.reply({ content: `⏳ Vui lòng đợi **${timeLeft} giây** để gõ lệnh tiếp theo.`, ephemeral: true });
            }
        }

        const url = interaction.options.getString('url').trim();

        try {
            await interaction.deferReply();

            // SỬA LỖI: Kiểm tra định dạng link chặt chẽ hơn bằng URL Object
            try {
                const parsedUrl = new URL(url);
                if (!parsedUrl.hostname.includes('platorelay.com') && !parsedUrl.hostname.includes('platoboost.com')) {
                    return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng miền Get Key Delta!" });
                }
            } catch (err) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Định dạng liên kết không hợp lệ!" });
            }

            const startTime = Date.now();
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang điều hướng gói tin qua cổng API Vercel riêng biệt của bạn để vượt tường lửa Cloudflare...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // SỬA LỖI: Lấy cấu hình Domain Vercel từ biến môi trường để linh hoạt đổi khi bị chặn/die domain
            const vercelDomain = process.env.VERCEL_API_DOMAIN || "https://ten-du-an-cua-ban.vercel.app"; 
            const cleanDomain = vercelDomain.endsWith('/') ? vercelDomain.slice(0, -1) : vercelDomain;
            const myPrivateVercelUrl = `${cleanDomain}/api?url=${encodeURIComponent(url)}`;
            
            let finalKey = "";
            let errorMsg = "";

            try {
                // SỬA LỖI: Hạ timeout xuống 9000ms (9 giây) để khớp với giới hạn tối đa của Vercel Free
                const response = await axios.get(myPrivateVercelUrl, { timeout: 9000 });
                if (response.data && response.data.success) {
                    finalKey = response.data.key;
                } else {
                    errorMsg = response.data ? response.data.message : "Dữ liệu trả về trống";
                }
            } catch (netError) {
                if (netError.code === 'ECONNABORTED') {
                    errorMsg = "Phản hồi từ Vercel bị quá thời gian (Timeout 9s)";
                } else {
                    errorMsg = netError.response && netError.response.data ? netError.response.data.message : netError.message;
                }
            }

            if (finalKey) finalKey = finalKey.trim();
            const executionTime = Date.now() - startTime;

            if (finalKey && finalKey.length > 5) {
                cooldowns.set(userId, currentTime);
                setTimeout(() => cooldowns.delete(userId), cooldownAmount);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Vượt Tường Lửa Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .addFields({ name: '⚡ Tốc độ bẻ khóa', value: `\`${executionTime}ms\``, inline: true })
                    .setFooter({ text: 'Xử lý độc quyền và an toàn qua cụm máy chủ Vercel' });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Bấm Xem Bản Thô (Dễ Copy Trên ĐT)')
                        .setStyle(ButtonStyle.Link)
                        .setURL(myPrivateVercelUrl)
                );

                await interaction.editReply({ embeds: [successEmbed], components: [row] });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Máy chủ Delta hoặc cổng API từ chối phản hồi.\n\n📊 **Chi tiết trạng thái:** \`${errorMsg || "Phiên làm việc đã hết hạn"}\`\n\n💡 **Mẹo:** Hãy mở game lên lấy 1 liên kết mới tinh và thực hiện lại ngay.` 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Hệ thống mạng gặp lỗi luồng ngầm cục bộ." }); } catch (e) {}
        }
    }
});

// Giữ bot sống trên Render (Web Service)
const http = require('http');
const server = http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' }); 
    res.end('Bot Core Is Running Securely'); 
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

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
        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID || client.user.id), { body: commands });
        console.log(`[OK] Kích hoạt hệ thống lệnh toàn cầu thành công!`);
    } catch (e) { console.error('Lỗi cấu hình:', e.message); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const cooldownAmount = 5 * 1000; // 5 giây chờ chống spam

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

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            const startTime = Date.now();
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang điều hướng gói tin qua cổng API Vercel riêng biệt của bạn để vượt tường lửa Cloudflare...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 ĐÃ SỬA CHUẨN XÁC: Gọi sang cổng API Vercel riêng biệt đã đổi tên file thành bypass.js của bạn
            const myPrivateVercelUrl = `https://vercel.app{encodeURIComponent(url)}`;
            
            let finalKey = "";
            let errorMsg = "";

            try {
                // Gọi dữ liệu sang máy chủ Amazon AWS sạch của Vercel
                const response = await axios.get(myPrivateVercelUrl, { timeout: 25000 });
                if (response.data && response.data.success) {
                    finalKey = response.data.key;
                } else {
                    errorMsg = response.data ? response.data.message : "Dữ liệu trống";
                }
            } catch (netError) {
                errorMsg = netError.response && netError.response.data ? netError.response.data.message : netError.message;
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

                // Nút bấm văn bản thô giúp đè ngón tay copy siêu nhanh trên điện thoại
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
                    content: `❌ **Bypass thất bại:** Máy chủ Delta gốc từ chối phản hồi Token.\n\n📊 **Chi tiết trạng thái:** \`${errorMsg || "Phiên làm việc đã hết hạn"}\`\n\n💡 **Mẹo chạy 100%:** Bạn hãy mở game Roblox lên, thực hiện **bấm lấy một đường link Get Key hoàn toàn mới tinh tinh vừa bấm xong**, dán ngay vào lệnh để chạy đúng tiến trình phiên.` 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Hệ thống mạng gặp lỗi luồng ngầm cục bộ." }); } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { res.writeHead(200); res.end('Bot Core Running'); });
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

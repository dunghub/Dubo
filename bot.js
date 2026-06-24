const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Bộ nhớ đệm lưu thời gian chờ của người dùng (Chống spam)
const cooldowns = new Map();

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc v8 - Cổng Vercel Riêng')
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
        const CLIENT_ID = process.env.CLIENT_ID || client.user.id;
        const GUILD_ID = process.env.GUILD_ID;

        if (GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
            console.log(`[OK] Đã kích hoạt lệnh siêu tốc tại Server ID: ${GUILD_ID}`);
        } else {
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
            console.log(`[OK] Đã kích hoạt lệnh Toàn Cầu!`);
        }
    } catch (e) { console.error('Lỗi cấu hình Discord:', e.message); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const cooldownAmount = 10 * 1000; // Thời gian chờ 10 giây chống spam

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (currentTime < expirationTime) {
                const timeLeft = ((expirationTime - currentTime) / 1000).toFixed(1);
                return await interaction.reply({ content: `⏳ **Chậm lại nào!** Vui lòng đợi **${timeLeft} giây** để tiếp tục sử dụng lệnh.`, ephemeral: true });
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
                .setDescription('Đang bẻ khóa link và đồng bộ dữ liệu qua máy chủ API Vercel riêng độc lập...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 ĐÃ ĐỒNG BỘ: Đường dẫn API Vercel độc quyền, sạch sẽ 100% của bạn
            const myPrivateVercelUrl = `https://vercel.app{encodeURIComponent(url)}`;
            
            let finalKey = "";
            let errorMsg = "";

            try {
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
                    .addFields({ name: '⚡ Tốc độ phản hồi', value: `\`${executionTime}ms\``, inline: true })
                    .setFooter({ text: 'Hệ thống vận hành an toàn qua cụm API Vercel độc lập v8' });

                // Nút bấm văn bản thô giúp người dùng đè ngón tay copy Key siêu nhanh trên điện thoại
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Xem Bản Văn Bản Thô (Dễ Copy Trên ĐT)')
                        .setStyle(ButtonStyle.Link)
                        .setURL(myPrivateVercelUrl)
                );

                await interaction.editReply({ embeds: [successEmbed], components: [row] });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Cổng API riêng không nhận được tín hiệu hợp lệ từ Delta.\n\n📊 **Chi tiết phản hồi:** \`${errorMsg || "Phiên làm việc hết hạn"}\`\n\n💡 **Mẹo chạy 100%:** Hãy vào game Roblox **bấm lấy một đường link mới tinh tinh vừa bấm xong**, dán ngay vào lệnh để chạy đúng tiến trình phiên làm việc.` 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Khối mạng ngầm cục bộ gặp lỗi xử lý." }); } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { res.writeHead(200); res.end('Bot Active'); });
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

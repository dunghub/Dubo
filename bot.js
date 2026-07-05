// bot.js - Kho dubo chạy trên Render (Ép luồng đi trực tiếp, bỏ qua Vercel để chống chặn domain)
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cooldowns = new Map();
const localKeyCache = new Map(); // Bộ nhớ đệm RAM lưu key ngay trên Render

// Cấu hình URL của API Server chạy Playwright/Puppeteer tại Việt Nam của bạn
// Nếu chạy chung một server Render, giữ nguyên cổng là http://localhost:3000/api/bypass
const LOCAL_API_URL = process.env.BYPASS_API_URL || 'http://localhost:3000/api/bypass';

const commands = [
    new SlashCommandBuilder()
        .setName('vuotlink')
        .setDescription('Tự động vượt link rút gọn lấy mã/key Việt Nam siêu tốc')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link rút gọn cần vượt (vuotlink, nhapcode1s...)')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot Dubo Bản Vượt Link VN Đang Online: ${client.user.tag}`);
    try {
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        if (!token) return console.error("❌ Thiếu DISCORD_TOKEN trong biến môi trường!");
        
        const rest = new REST({ version: '10' }).setToken(token);
        const CLIENT_ID = process.env.CLIENT_ID || client.user.id;
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log(`[OK] Kích hoạt hệ thống lệnh Slash Command thành công!`);
    } catch (e) { console.error('Lỗi cấu hình lệnh:', e.message); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vuotlink') {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const cooldownAmount = 15 * 1000; // Giới hạn 15 giây mỗi lượt gõ lệnh

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

            // Kiểm tra định dạng link cơ bản
            try {
                new URL(url.startsWith('http') ? url : `https://${url}`);
            } catch (err) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Định dạng liên kết truyền vào không hợp lệ!" });
            }

            // KIỂM TRA CACHE TRÊN RENDER (Trùng link cũ trả ngay kết quả trong 0s)
            if (localKeyCache.has(url)) {
                const cache = localKeyCache.get(url);
                // Cache hợp lệ trong vòng 10 phút vì mã code có thể đổi theo thời gian
                if (currentTime - cache.time < 10 * 60 * 1000) {
                    const cacheEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Vượt Link Thành Công (Cache)')
                        .setDescription(`🔑 **Mã code tìm thấy:**\n\`\`\`text\n${cache.key}\n\`\`\``)
                        .addFields({ name: '⚡ Thời gian xử lý', value: '`0ms (Bộ nhớ đệm)`', inline: true })
                        .setFooter({ text: `Yêu cầu bởi ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('Website Link Gốc').setStyle(ButtonStyle.Link).setURL(url)
                    );
                    return await interaction.editReply({ embeds: [cacheEmbed], components: [row] });
                } else {
                    localKeyCache.delete(url);
                }
            }

            const startTime = Date.now();
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⏳ Hệ Thống Dubo Đang Tự Động Vượt Link`)
                .setDescription(`Đang mở trình duyệt ảo, giả lập hành vi cuộn trang và kích hoạt đồng hồ đếm ngược... Thao tác này mất khoảng 60-70 giây.`);
            await interaction.editReply({ embeds: [pendingEmbed] });

            let finalResult = "";
            let errorMsg = "API Server không phản hồi.";

            try {
                // Gọi trực tiếp đến API Server để xử lý bằng Playwright/Puppeteer
                const response = await axios.post(LOCAL_API_URL, { url: url }, { 
                    timeout: 90000, // Chờ tối đa 90 giây vì trang web cần đếm ngược 60 giây
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.data && response.data.success === true) {
                    finalResult = response.data.key || "";
                } else {
                    errorMsg = response.data.error || "Không tìm thấy khung chứa mã code.";
                }
            } catch (netError) {
                errorMsg = `Trục trặc cổng kết nối API: ${netError.message}`;
            }

            const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);

            // XỬ LÝ KẾT QUẢ ĐẦU RA CHUẨN XỊN
            if (finalResult && finalResult.length > 2) {
                
                localKeyCache.set(url, { key: finalResult.trim(), time: Date.now() });
                cooldowns.set(userId, currentTime);
                setTimeout(() => cooldowns.delete(userId), cooldownAmount);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Vượt Link Thành Công')
                    .setDescription(`🔑 **Mã code (Key) của bạn:**\n\`\`\`text\n${finalResult.trim()}\n\`\`\``)
                    .addFields({ name: '⚡ Thời gian xử lý', value: `\`${executionTime} giây\``, inline: true })
                    .setFooter({ text: `Yêu cầu bởi ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel('Website Link Gốc').setStyle(ButtonStyle.Link).setURL(url)
                );

                await interaction.editReply({ embeds: [successEmbed], components: [row] });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Vượt link thất bại:** Hệ thống không thể bóc tách mã xác thực tự động.\n\n📊 **Chi tiết lỗi:** \`${errorMsg}\`\n\n💡 **Mẹo:** Kiểm tra xem liên kết của bạn có bị hết hạn hoặc sai cấu trúc yêu cầu tìm kiếm không nhé!` 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Lỗi kết nối mạng cục bộ của hệ thống bot." }); } catch (e) {}
        }
    }
});

// Giữ cho Render luôn sống (Tránh idle ngắt kết nối)
const http = require('http');
const server = http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' }); 
    res.end('Bot Dubo Core Running Securely Without Vercel Middleware'); 
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

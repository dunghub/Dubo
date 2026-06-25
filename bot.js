// bot.js - Hệ thống Bot Discord tương tác công khai chạy trên Render/VPS
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

            // 1. Kiểm tra cấu trúc định dạng link đầu vào
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
                .setDescription('Đang điều hướng gói tin qua cổng API Vercel riêng phối hợp Proxy dân cư Sticky để bẻ khóa tường lửa...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // Cấu hình Domain Vercel của bạn
            const vercelDomain = "https://delta-core-api.vercel.app"; 
            const myPrivateVercelUrl = `${vercelDomain}/api?url=${encodeURIComponent(url)}`;
            
            let finalKey = "";
            let errorMsg = "";

            try {
                // Đặt timeout 30 giây đồng bộ với đầu API xử lý ngầm qua proxy
                const response = await axios.get(myPrivateVercelUrl, { timeout: 30000 });
                
                if (response.data && response.data.success === true) {
                    finalKey = response.data.key;
                } else {
                    errorMsg = response.data && response.data.message ? response.data.message : "Cổng API riêng chưa tìm thấy key.";
                }
            } catch (netError) {
                if (netError.code === 'ECONNABORTED') {
                    errorMsg = "Thời gian xử lý vượt quá giới hạn an toàn (Timeout 30s).";
                } else if (netError.response && netError.response.data) {
                    // Đọc mã lỗi JSON chi tiết do file index.js trên Vercel trả ngược về
                    errorMsg = netError.response.data.message || `Lỗi máy chủ mã HTTP ${netError.response.status}`;
                } else {
                    errorMsg = `Không thể kết nối đến API Vercel: ${netError.message}`;
                }
            }

            if (finalKey) finalKey = finalKey.trim();
            const executionTime = Date.now() - startTime;

            // 3. Xử lý xuất kết quả cuối cùng lên Discord chat
            if (finalKey && finalKey.length > 5 && !finalKey.includes("{") && !finalKey.includes("false")) {
                cooldowns.set(userId, currentTime);
                setTimeout(() => cooldowns.delete(userId), cooldownAmount);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Vượt Tường Lửa Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .addFields({ name: '⚡ Tốc độ bẻ khóa', value: `\`${executionTime}ms\``, inline: true })
                    .setFooter({ text: 'Hệ thống API Vercel tích hợp Proxy dân cư vận hành biệt lập' });

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
                    content: `❌ **Bypass thất bại:** Cổng API riêng từ chối xác thực gói tin.\n\n📊 **Chi tiết trạng thái:** \`${errorMsg || "Dữ liệu phiên làm việc không hợp lệ"}\`\n\n💡 **Mẹo:** Bạn hãy mở game Roblox lên, bấm lấy 1 liên kết Get Key mới tinh rồi thực hiện lại lệnh ngay!` 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Hệ thống mạng gặp lỗi luồng ngầm cục bộ của bot." }); } catch (e) {}
        }
    }
});

// Giữ bot sống liên tục trên Render (Web Service)
const http = require('http');
const server = http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' }); 
    res.end('Bot Core Is Running Securely'); 
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

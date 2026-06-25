// bot.js - Kho dubo chạy trên Render (Ép luồng đi trực tiếp, bỏ qua Vercel để chống chặn domain)
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cooldowns = new Map();
const localKeyCache = new Map(); // Bộ nhớ đệm RAM lưu key ngay trên Render

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc v8 - Bản Ép Luồng Sạch Không Lỗi')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platoboost (Android) hoặc LootLabs (iOS) cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot Dubo Bản Sạch Đang Online: ${client.user.tag}`);
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

    if (interaction.commandName === 'bypass') {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const cooldownAmount = 10 * 1000;

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

            let osType = "";
            let isLootLabs = false;
            try {
                const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
                const host = parsedUrl.hostname;
                
                if (host.includes('platorelay.com') || host.includes('platoboost.com')) {
                    osType = "Android (Platoboost)";
                } else if (host.includes('lootlabs.gg')) {
                    osType = "iOS (LootLabs)";
                    isLootLabs = true;
                } else {
                    return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng miền Get Key Delta!" });
                }
            } catch (err) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Định dạng liên kết truyền vào không hợp lệ!" });
            }

            // KIỂM TRA CACHE TRÊN RENDER (Trùng link cũ trả ngay lập tức trong 0s)
            if (localKeyCache.has(url)) {
                const cache = localKeyCache.get(url);
                if (currentTime - cache.time < 24 * 60 * 60 * 1000) {
                    const cacheEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Bypass Successful')
                        .setDescription(isLootLabs ? `🔗 **Mã dịch iOS đã sẵn sàng:**\nNhấn nút bên dưới để nhận trang cuối.` : `🔑 **Result:**\n\`\`\`text\n${cache.key}\n\`\`\``)
                        .addFields({ name: '⚡ Processed in', value: '`0ms (Local Cache)`', inline: true })
                        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel(isLootLabs ? 'Mở Link Nhận Key iOS' : 'Website Link Gốc').setStyle(ButtonStyle.Link).setURL(isLootLabs ? cache.key : url)
                    );
                    return await interaction.editReply({ embeds: [cacheEmbed], components: [row] });
                } else {
                    localKeyCache.delete(url);
                }
            }

            const startTime = Date.now();
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⏳ Hệ Thống Dubo Đang Xử Lý [${osType}]`)
                .setDescription(`Đang trích xuất dữ liệu mã hóa thời gian thực qua chuỗi định tuyến đám mây bảo mật...`);
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🟢 CHẠY THẲNG API POOL ĐỂ BỐC CACHE 0.5S TỪ CÁC SERVER LỚN
            const serverEndpoints = [
                `https://bypass.vip{encodeURIComponent(url)}`,
                `https://uneti-bot.xyz{encodeURIComponent(url)}`
            ];

            let finalResult = "";
            let errorMsg = "Tất cả các cổng máy chủ đang bận xử lý.";

            for (const apiOfServer of serverEndpoints) {
                try {
                    const response = await axios.get(apiOfServer, { 
                        timeout: 12000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0 Safari/537.36' }
                    });
                    if (response.data && (response.data.status === "success" || response.data.success === true)) {
                        finalResult = response.data.result || response.data.destination || response.data.key || "";
                        if (finalResult && finalResult.length > 5 && !finalResult.includes("{")) {
                            break; // Thành công thì dừng lặp ngay
                        }
                    }
                } catch (netError) {
                    errorMsg = `Trục trặc cổng: ${netError.message}`;
                }
            }

            const executionTime = Date.now() - startTime;

            // ĐỒNG BỘ HIỂN THỊ KHUNG BẢNG XANH CHUẨN XỊN 100%
            if (finalResult && finalResult.length > 5 && !finalResult.includes("{") && !finalResult.includes("false")) {
                
                localKeyCache.set(url, { key: finalResult.trim(), time: Date.now() });
                cooldowns.set(userId, currentTime);
                setTimeout(() => cooldowns.delete(userId), cooldownAmount);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Successful')
                    .addFields({ name: '⚡ Processed in', value: `\`${executionTime}ms\``, inline: true })
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                const row = new ActionRowBuilder();

                if (isLootLabs) {
                    successEmbed.setDescription(`🔗 **Liên kết chứa mã Key Delta iOS của bạn đã sẵn sàng:**\n\nHãy bấm nút bên dưới để mở trang nhận key cuối cùng!`);
                    row.addComponents(new ButtonBuilder().setLabel('Bấm Mở Link Nhận Key iOS').setStyle(ButtonStyle.Link).setURL(finalResult));
                } else {
                    successEmbed.setDescription(`🔑 **Result:**\n\`\`\`text\n${finalResult}\n\`\`\``);
                    row.addComponents(
                        new ButtonBuilder().setLabel('Website Link Gốc').setStyle(ButtonStyle.Link).setURL(url),
                        new ButtonBuilder().setLabel('Copy Key (Thô)').setStyle(ButtonStyle.Secondary).setCustomId('copy_key_placeholder').setDisabled(true) // Nút trang trí giống app gốc
                    );
                }

                await interaction.editReply({ embeds: [successEmbed], components: [row] });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại [${osType}]:** Toàn bộ cổng phân giải từ chối xác thực gói tin.\n\n📊 **Chi tiết trạng thái:** \`${errorMsg || "Dữ liệu liên kết đã hết hạn"}\`\n\n💡 **Mẹo:** Bạn hãy vào game Roblox lấy lại một liên kết Get Key mới tinh rồi thực hiện lại lệnh nhé!` 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Lỗi kết nối mạng cục bộ của hệ thống bot." }); } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' }); 
    res.end('Bot Dubo Core Running Securely Without Vercel Middleware'); 
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

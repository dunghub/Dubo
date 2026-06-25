// bot.js - Bản Sửa Lỗi Ép Luồng Đã Tích Hợp Lưu Cache Link Cũ Vào RAM
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cooldowns = new Map();

// 🟢 BỘ NHỚ ĐỆM LƯU TRỮ KEY CỦA LINK CŨ (LƯU TRONG RAM CỦA BOT)
const keyCache = new Map(); 

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc - Hệ thống tự lưu nhớ link cũ')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platoboost (Android) hoặc LootLabs (iOS) cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot Dubo Hệ Thống Lưu Cache Hoạt Động: ${client.user.tag}`);
    try {
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        if (!token) return console.error("❌ Thiếu DISCORD_TOKEN trong biến môi trường!");
        
        const rest = new REST({ version: '10' }).setToken(token);
        const CLIENT_ID = process.env.CLIENT_ID || client.user.id;
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log(`[OK] Đã cập nhật xong hệ thống lệnh Slash Command!`);
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

            // 1. TỰ ĐỘNG PHÂN TÁCH ĐỊNH DẠNG LINK
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

            // 🟢 BƯỚC KIỂM TRA BỘ NHỚ ĐỆM: NẾU LINK CŨ ĐÃ TỪNG CHẠY THÀNH CÔNG, LẤY RA TRẢ LUÔN
            if (keyCache.has(url)) {
                const cachedData = keyCache.get(url);
                // Kiểm tra xem key lưu đệm đã quá hạn 24 tiếng chưa (Tính bằng mili giây)
                if (currentTime - cachedData.time < 24 * 60 * 60 * 1000) {
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle(`✅ Lấy Key Thành Công (Dữ Liệu Đệm)`)
                        .addFields({ name: '⚡ Tốc độ bóc tách', value: `\`0ms (Lấy lại link cũ)\``, inline: true })
                        .setFooter({ text: 'Key cũ đã lưu nhớ trong bộ nhớ RAM hệ thống' });

                    const row = new ActionRowBuilder();
                    if (isLootLabs) {
                        successEmbed.setDescription(`🔗 **Liên kết chứa mã Key Delta iOS của bạn đã sẵn sàng:**\n\nBạn hãy bấm vào nút bấm bên dưới để mở liên kết lấy thẳng mã key cuối cùng!`);
                        row.addComponents(new ButtonBuilder().setLabel('Bấm Để Mở Link Nhận Key iOS').setStyle(ButtonStyle.Link).setURL(cachedData.key));
                    } else {
                        successEmbed.setDescription(`🔑 **Key Delta Android của bạn đã sẵn sàng:**\n\`\`\`text\n${cachedData.key}\n\`\`\``);
                        row.addComponents(new ButtonBuilder().setLabel('Bấm Để Sao Chép Link Gốc').setStyle(ButtonStyle.Link).setURL(url));
                    }
                    return await interaction.editReply({ embeds: [successEmbed], components: [row] });
                } else {
                    // Quá hạn 24h thì xóa bỏ cache cũ để chuẩn bị cào lại key mới
                    keyCache.delete(url); 
                }
            }

            const startTime = Date.now();
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⏳ Hệ Thống Đang Xử Lý Luồng [${osType}]`)
                .setDescription(`Đang điều hướng gói tin bẻ khóa lên máy chủ API Vercel riêng kết hợp giải mã đa tầng...`);
            await interaction.editReply({ embeds: [pendingEmbed] });

            // GỌI ĐẾN ĐẦU LINK VERCEL RIÊNG CỦA BẠN
            const vercelDomain = "https://vercel.app"; // Điền domain Vercel thật của bạn ở đây
            const myPrivateVercelUrl = `${vercelDomain}/api?url=${encodeURIComponent(url)}`;
            
            let finalResult = "";
            let errorMsg = "";

            try {
                const response = await axios.get(myPrivateVercelUrl, { timeout: 28000 });
                if (response.data && response.data.success === true) {
                    finalResult = response.data.key;
                } else {
                    errorMsg = response.data && response.data.message ? response.data.message : "Cổng API riêng chưa trích xuất được key.";
                }
            } catch (netError) {
                if (netError.response && netError.response.data) {
                    errorMsg = netError.response.data.message;
                } else {
                    errorMsg = `Máy chủ Vercel phản hồi chậm hoặc lỗi mạng: ${netError.message}`;
                }
            }

            const executionTime = Date.now() - startTime;

            // 3. XỬ LÝ XUẤT KẾT QUẢ VÀ LƯU VÀO CACHE NẾU THÀNH CÔNG
            if (finalResult && finalResult.length > 5 && !finalResult.includes("{") && !finalResult.includes("false")) {
                
                // 🟢 LƯU LẠI VÀO BỘ NHỚ ĐỆM ĐỂ LẦN SAU KHÔNG PHẢI CHẠY LẠI LINK NÀY NỮA
                keyCache.set(url, {
                    key: finalResult.trim(),
                    time: Date.now()
                });

                cooldowns.set(userId, currentTime);
                setTimeout(() => cooldowns.delete(userId), cooldownAmount);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(`✅ Vượt Tường Lửa [${osType}] Thành Công`)
                    .addFields({ name: '⚡ Tốc độ bẻ khóa', value: `\`${executionTime}ms\``, inline: true })
                    .setFooter({ text: 'Hệ thống tối ưu hóa lõi siêu nhẹ vận hành ổn định' });

                const row = new ActionRowBuilder();

                if (isLootLabs) {
                    successEmbed.setDescription(`🔗 **Liên kết chứa mã Key Delta iOS của bạn đã sẵn sàng:**\n\nBạn hãy bấm vào nút bấm bên dưới để mở liên kết lấy thẳng mã key cuối cùng!`);
                    row.addComponents(new ButtonBuilder().setLabel('Bấm Để Mở Link Nhận Key iOS').setStyle(ButtonStyle.Link).setURL(finalResult));
                } else {
                    successEmbed.setDescription(`🔑 **Key Delta Android của bạn đã sẵn sàng:**\n\`\`\`text\n${finalResult}\n\`\`\``);
                    row.addComponents(new ButtonBuilder().setLabel('Bấm Để Sao Chép Link Gốc').setStyle(ButtonStyle.Link).setURL(url));
                }

                await interaction.editReply({ embeds: [successEmbed], components: [row] });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại [${osType}]:** Cổng phân giải Vercel từ chối bóc tách gói tin.\n\n📊 **Chi tiết trạng thái:** \`${errorMsg || "Phiên làm việc bị sập hoặc dải cổng bị block"}\`\n\n💡 **Mẹo:** Bạn hãy mở game Roblox lên, bấm lấy 1 liên kết Get Key mới tinh rồi thực hiện lại lệnh ngay!` 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Lỗi luồng xử lý đồng bộ cục bộ của hệ thống bot." }); } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' }); 
    res.end('Bot Core Is Running Securely on Render with Cache Enabled'); 
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

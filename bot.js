// bot.js - Hệ thống Bot Discord đa năng tự động nhận diện Luồng Android & iOS
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cooldowns = new Map();

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc - Hỗ trợ cả Android & iOS')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platoboost (Android) hoặc LootLabs (iOS) cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot Online hệ thống đa nền tảng: ${client.user.tag}`);
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
        const cooldownAmount = 45 * 1000; // Bảo vệ hệ thống tránh spam proxy free

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

            // 1. TỰ ĐỘNG NHẬN DIỆN HỆ ĐIỀU HÀNH QUA TÊN MIỀN LINK
            let osType = "";
            try {
                const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
                const host = parsedUrl.hostname;
                
                if (host.includes('platorelay.com') || host.includes('platoboost.com')) {
                    osType = "Android (Platoboost)";
                } else if (host.includes('lootlabs.gg')) {
                    osType = "iOS (LootLabs)";
                } else {
                    return await interaction.editReply({ content: "❌ **Lỗi:** Bot chỉ hỗ trợ liên kết Get Key của Delta Android (Platoboost) và Delta iOS (LootLabs)!" });
                }
            } catch (err) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Định dạng liên kết nhập vào không hợp lệ!" });
            }

            const startTime = Date.now();
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⏳ Hệ Thống Đang Xử Lý Luồng [${osType}]`)
                .setDescription(`Đang điều hướng gói tin bẻ khóa qua cổng API riêng và cụm Proxy Free của cộng đồng. Quá trình dò luồng mất khoảng 5-15 giây, xin vui lòng đợi...`);
            await interaction.editReply({ embeds: [pendingEmbed] });

            // Cấu hình kết nối API Vercel của bạn
            const vercelDomain = "https://vercel.app"; 
            const myPrivateVercelUrl = `${vercelDomain}/api?url=${encodeURIComponent(url)}`;
            
            let finalResult = "";
            let errorMsg = "";

            try {
                const response = await axios.get(myPrivateVercelUrl, { timeout: 30000 });
                
                if (response.data && response.data.success === true) {
                    finalResult = response.data.key;
                } else {
                    errorMsg = response.data && response.data.message ? response.data.message : "Cổng API riêng chưa tìm thấy key.";
                }
            } catch (netError) {
                if (netError.code === 'ECONNABORTED') {
                    errorMsg = "Thời gian xử lý vượt quá giới hạn an toàn (Timeout 30s).";
                } else if (netError.response && netError.response.data) {
                    errorMsg = netError.response.data.message || `Lỗi máy chủ mã HTTP ${netError.response.status}`;
                } else {
                    errorMsg = `Không thể kết nối đến API Vercel: ${netError.message}`;
                }
            }

            const executionTime = Date.now() - startTime;

            // 3. XỬ LÝ XUẤT KẾT QUẢ PHÙ HỢP CHO TỪNG LUỒNG HỆ ĐIỀU HÀNH
            if (finalResult && finalResult.length > 5 && !finalResult.includes("{") && !finalResult.includes("false")) {
                cooldowns.set(userId, currentTime);
                setTimeout(() => cooldowns.delete(userId), cooldownAmount);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(`✅ Vượt Tường Lửa [${osType}] Thành Công`)
                    .addFields({ name: '⚡ Tốc độ bẻ khóa', value: `\`${executionTime}ms\``, inline: true })
                    .setFooter({ text: 'Hệ thống Auto-Proxy Free đa nền tảng chạy ổn định' });

                const row = new ActionRowBuilder();

                if (osType.includes("iOS")) {
                    // Đối với iOS: Thường LootLabs sẽ trả về đường link đích chứa key hoặc trang tiếp theo, bot tạo nút bấm chuyển hướng trực tiếp cho tiện
                    successEmbed.setDescription(`🔗 **Liên kết chứa mã Key Delta iOS của bạn đã sẵn sàng:**\n\nBạn hãy bấm vào nút bấm bên dưới để truy cập thẳng tới trang nhận mã key mà không cần xem quảng cáo!`);
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel('Bấm Để Mở Link Nhận Key iOS')
                            .setStyle(ButtonStyle.Link)
                            .setURL(finalResult)
                    );
                } else {
                    // Đối với Android: Hiển thị chuỗi mã Key dạng văn bản để người dùng copy đè vào game
                    successEmbed.setDescription(`🔑 **Key Delta Android của bạn đã sẵn sàng:**\n\`\`\`text\n${finalResult}\n\`\`\``);
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel('Bấm Xem Bản Thô (Dễ Copy Trên ĐT)')
                            .setStyle(ButtonStyle.Link)
                            .setURL(myPrivateVercelUrl)
                    );
                }

                await interaction.editReply({ embeds: [successEmbed], components: [row] });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại [${osType}]:** Cổng API riêng từ chối xác thực gói tin.\n\n📊 **Chi tiết trạng thái:** \`${errorMsg || "Dữ liệu phiên làm việc không hợp lệ"}\`\n\n💡 **Mẹo:** Bạn hãy mở game Roblox lên, bấm lấy 1 liên kết Get Key mới tinh rồi thực hiện lại lệnh ngay!` 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Hệ thống mạng gặp lỗi luồng ngầm cục bộ của bot." }); } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' }); 
    res.end('Bot Core Is Running Securely'); 
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

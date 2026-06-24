const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Bản Tối Ưu Scraper Premium')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay hoặc Platoboost cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot đã kết nối thành công: ${client.user.tag}`);
    try {
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        const rest = new REST({ version: '10' }).setToken(token);
        const CLIENT_ID = process.env.CLIENT_ID || client.user.id;
        const GUILD_ID = process.env.GUILD_ID;

        if (GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
            console.log(`[OK] Kích hoạt lệnh tại Server ID: ${GUILD_ID}`);
        } else {
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        }
    } catch (error) {
        console.error('[THẤT BẠI] Lỗi nạp lệnh Slash:', error.message);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url').trim();

        try {
            await interaction.deferReply();

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang sử dụng cổng IP dân cư cao cấp kết hợp Trình duyệt Chrome ngầm giải quyết thử thách Cloudflare Delta...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 Cấu hình hệ thống cổng API lõi của Delta
            const backendServers = [
                `https://bypass.tools{encodeURIComponent(url)}`,
                `https://bypass.city{encodeURIComponent(url)}`,
                `https://bypass.vip{encodeURIComponent(url)}`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let debugLogs = [];

            // Đọc mã Key phá tường lửa mà bạn vừa tạo từ bảng điều khiển Render
            const scraperKey = process.env.SCRAPER_API_KEY;

            for (let i = 0; i < backendServers.length; i++) {
                try {
                    let finalUrl = backendServers[i];
                    
                    if (scraperKey) {
                        // Ép luồng chạy sang ScraperAPI, bật render=true để chạy Javascript của Cloudflare ngầm
                        finalUrl = `http://scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(backendServers[i])}&render=true&country_code=us`;
                    }

                    // Thời gian timeout nâng hẳn lên 45 giây để máy chủ mở Chrome ảo giải toán ẩn danh
                    const response = await axios.get(finalUrl, { timeout: 45000 });
                    let resData = response.data;

                    if (resData) {
                        // Phân tách cấu trúc đối tượng đa tầng thông minh chống trả chuỗi trống undefined
                        if (typeof resData === 'object') {
                            finalKey = resData.key || resData.result || 
                                       (resData.data ? resData.data.key || resData.data.result || resData.data : null) ||
                                       (resData.bypassed ? resData.bypassed.key || resData.bypassed : null);
                        } else if (typeof resData === 'string') {
                            // Trích xuất cụm JSON nằm lồng trong chuỗi text HTML nếu có
                            if (resData.includes('{') && resData.includes('}')) {
                                try {
                                    const startIdx = resData.indexOf('{');
                                    const endIdx = resData.lastIndexOf('}') + 1;
                                    const parsedJson = JSON.parse(resData.substring(startIdx, endIdx));
                                    finalKey = parsedJson.key || parsedJson.result || (parsedJson.data ? parsedJson.data.key : null);
                                } catch (e) {
                                    finalKey = resData;
                                }
                            } else {
                                finalKey = resData;
                            }
                        }
                    }

                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && !finalKey.toLowerCase().includes('cloudflare')) {
                        usedServer = i === 0 ? "Bypass.tools Premium Core" : i === 1 ? "Bypass.city Premium Core" : "Bypass.vip Core";
                        break; 
                    } else {
                        debugLogs.push(`**Cổng ${i + 1}:** Máy chủ phản hồi trống hoặc link hết hạn.`);
                    }
                } catch (netError) {
                    const status = netError.response ? netError.response.status : "Đang xoay tuyến IP";
                    debugLogs.push(`**Cổng ${i + 1}:** Kháng chặn lỗi (${status})`);
                }
            }

            if (finalKey && typeof finalKey === 'string') finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý vượt bộ lọc an toàn qua: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Hệ thống ghi nhận lỗi chặn luồng mạng từ Delta.\n\n📊 **Nhật ký kết nối chuyên sâu:**\n${errorLogString}\n\n💡 **Cách khắc phục:** Hãy đảm bảo bạn đã lưu biến môi trường \`SCRAPER_API_KEY\` thành công trên Render. Tiếp theo, vào game Roblox **lấy một đường link Get Key mới tinh chưa qua sử dụng** rồi gõ lại lệnh để chạy.` 
                });
            }

        } catch (globalError) {
            console.error('Lỗi luồng mạng:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình xử lý luồng mạng hệ thống." });
            } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot ScraperEngine Premium Active!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

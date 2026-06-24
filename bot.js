const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Kích Hoạt Render Engine')
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
            console.log(`[OK] Kích hoạt lệnh siêu tốc tại Server ID: ${GUILD_ID}`);
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
                .setDescription('Đang kích hoạt **Trình duyệt ẩn danh Chrome ngầm** để phá vỡ tường lửa Cloudflare. Quá trình này dùng proxy dân cư cao cấp nên sẽ mất từ 15-25 giây, vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            const coreServers = [
                `https://bypass.tools{encodeURIComponent(url)}`,
                `https://bypass.city{encodeURIComponent(url)}`,
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let debugLogs = [];

            const apiKey = process.env.SCRAPER_API_KEY;

            for (let i = 0; i < coreServers.length; i++) {
                try {
                    let requestUrl = coreServers[i];
                    
                    if (apiKey) {
                        // 🔥 ĐÃ SỬA: Ép tham số render=true để kích hoạt Chromium ẩn danh chạy Javascript vượt Cloudflare
                        requestUrl = `http://scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(coreServers[i])}&render=true`;
                    }

                    // Đợi tối đa 40 giây vì trình duyệt ảo cần thời gian giải mã captcha ngầm
                    const response = await axios.get(requestUrl, { timeout: 40000 }); 
                    let responseData = response.data;

                    if (responseData) {
                        if (typeof responseData === 'object') {
                            finalKey = responseData.key || 
                                       responseData.result || 
                                       (responseData.bypassed ? responseData.bypassed.key || responseData.bypassed : null) || 
                                       (responseData.data ? responseData.data.key || responseData.data.result : null);
                        } else if (typeof responseData === 'string') {
                            // Nếu đầu ra bị bao bọc bởi mã HTML của ScraperAPI, bóc tách chuỗi JSON thô
                            if (responseData.includes('{') && responseData.includes('}')) {
                                try {
                                    const jsonStart = responseData.indexOf('{');
                                    const jsonEnd = responseData.lastIndexOf('}') + 1;
                                    const cleanJson = JSON.parse(responseData.substring(jsonStart, jsonEnd));
                                    finalKey = cleanJson.key || cleanJson.result || (cleanJson.data ? cleanJson.data.key : null);
                                } catch (e) {
                                    finalKey = responseData;
                                }
                            } else {
                                finalKey = responseData;
                            }
                        }
                    }

                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && !finalKey.toLowerCase().includes('cloudflare')) {
                        usedServer = i === 0 ? "Bypass.tools Engine 2026" : i === 1 ? "Bypass.city Engine" : "StickX Engine Backup";
                        break; 
                    } else {
                        debugLogs.push(`**Cổng ${i + 1}:** Máy chủ từ chối cấp dữ liệu.`);
                    }
                } catch (netError) {
                    const status = netError.response ? netError.response.status : "Đang vượt Captcha";
                    debugLogs.push(`**Cổng ${i + 1}:** Kháng chặn (${status})`);
                }
            }

            if (finalKey && typeof finalKey === 'string') finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Vượt tường lửa an toàn qua: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Hệ thống ghi nhận lỗi chặn luồng mạng từ Delta.\n\n📊 **Nhật ký kết nối:**\n${errorLogString}\n\n💡 *Cách xử lý:* Bạn hãy vào game Roblox lấy một **đường đường liên kết Get Key mới tinh chưa qua sử dụng** rồi thực hiện lại lệnh. Không sử dụng lại các link cũ đã bị kẹt bộ lọc.` 
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
    res.end('Bot ScraperEngine Pro Active!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

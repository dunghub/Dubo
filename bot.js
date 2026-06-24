const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Bản Chống Treo Lệnh')
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
                .setDescription('Đang bẻ khóa link siêu tốc qua cụm **3 Máy Chủ Nâng Cấp v8**...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            const serverEndpoints = [
                `https://bypass.tools{encodeURIComponent(url)}`,
                `https://bypass.city{encodeURIComponent(url)}`,
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let debugLogs = [];

            // 🚀 LUỒNG 1: THỬ CHẠY QUA PROXY RIÊNG CỦA BẠN (GIỚI HẠN CHỜ 5 GIÂY ĐỂ TRÁNH TREO)
            if (process.env.PROXY_URL) {
                console.log('[SYSTEM] Kiểm tra kết nối luồng Proxy mạng nhà...');
                let proxyConfig = {
                    timeout: 5000, // Chỉ đợi đúng 5 giây, nếu mạng nhà chặn/treo sẽ ngắt ngay lập tức
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*'
                    }
                };

                try {
                    const agent = new HttpsProxyAgent(process.env.PROXY_URL);
                    proxyConfig.httpsAgent = agent;
                    proxyConfig.proxy = false;

                    // Thử quét Server 1 bằng Proxy trước
                    const response = await axios.get(serverEndpoints[0], proxyConfig);
                    let responseData = response.data;
                    if (responseData) {
                        if (typeof responseData === 'object') {
                            finalKey = responseData.key || (responseData.bypassed ? responseData.bypassed.key || responseData.bypassed : null) || (responseData.data ? responseData.data.key : null) || responseData.result;
                        } else if (typeof responseData === 'string') {
                            finalKey = responseData;
                        }
                    }
                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                        usedServer = "Bypass.tools Premium Core (Mạng Nhà)";
                    }
                } catch (pError) {
                    console.warn('[CẢNH BÁO] Proxy mạng nhà bị lỗi hoặc treo cổng, tự động ngắt để chuyển sang mạng gốc:', pError.message);
                    debugLogs.push(`**Proxy nhà:** Gặp lỗi kết nối/Treo cổng.`);
                }
            }

            // 🚀 LUỒNG 2: NẾU PROXY TREO HOẶC KHÔNG RA KEY -> TỰ ĐỘNG CHẠY MẠNG GỐC SIÊU TỐC CỦA HOST
            if (!finalKey) {
                console.log('[SYSTEM] Chuyển cấu hình sang luồng mạng gốc siêu tốc...');
                let nativeConfig = {
                    timeout: 12000, // Đợi tối đa 12 giây mỗi cổng máy chủ
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*'
                    }
                };

                for (let i = 0; i < serverEndpoints.length; i++) {
                    try {
                        console.log(`[NETWORK] Kết nối trực tiếp đến Server ${i + 1}...`);
                        const response = await axios.get(serverEndpoints[i], nativeConfig);
                        let responseData = response.data;

                        if (responseData) {
                            if (typeof responseData === 'object') {
                                finalKey = responseData.key || (responseData.bypassed ? responseData.bypassed.key || responseData.bypassed : null) || (responseData.data ? responseData.data.key : null) || responseData.result;
                            } else if (typeof responseData === 'string') {
                                finalKey = responseData;
                            }
                        }

                        if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                            usedServer = i === 0 ? "Bypass.tools API Gốc" : `Cổng Máy Chủ Dự Phòng ${i + 1}`;
                            break; 
                        } else {
                            debugLogs.push(`**Server ${i + 1}:** Phản hồi trống hoặc bị Cloudflare chặn.`);
                        }
                    } catch (netError) {
                        const status = netError.response ? netError.response.status : "Timeout";
                        debugLogs.push(`**Server ${i + 1}:** Gặp lỗi kết nối (HTTP: ${status})`);
                    }
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            // Xuất dữ liệu trả về cho người dùng Discord công khai
            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý an toàn qua: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Liên kết bị chặn hoặc hết hạn.\n\n📊 **Nhật ký hệ thống:**\n${errorLogString}\n\n💡 *Cách khắc phục:* Hãy chắc chắn rằng bạn đã copy đường link Get Key **mới tinh** vừa lấy từ game ra, không dùng lại link cũ đã test nhé!` 
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
    res.end('Bot Smart Fallback Online!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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

            // 🚀 LUỒNG 1: CHẠY QUA PROXY RIÊNG CỦA BẠN (NẾU CÓ - GIỚI HẠN CHỜ ĐÚNG 4 GIÂY)
            if (process.env.PROXY_URL) {
                console.log('[SYSTEM] Kiểm tra kết nối luồng Proxy mạng nhà...');
                let proxyConfig = {
                    timeout: 4000, 
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                };

                try {
                    const agent = new HttpsProxyAgent(process.env.PROXY_URL);
                    proxyConfig.httpsAgent = agent;
                    proxyConfig.proxy = false;

                    const response = await axios.get(serverEndpoints[0], proxyConfig);
                    let responseData = response.data;
                    if (responseData) {
                        if (typeof responseData === 'object') {
                            finalKey = responseData.key || (responseData.bypassed ? responseData.bypassed.key || responseData.bypassed : null) || (responseData.data ? responseData.data.key : null);
                        } else if (typeof responseData === 'string') {
                            finalKey = responseData;
                        }
                    }
                    if (finalKey && finalKey.trim().length > 5 && !finalKey.toLowerCase().includes('error')) {
                        usedServer = "Bypass.tools Premium (Mạng Nhà)";
                    }
                } catch (pError) {
                    console.warn('[CẢNH BÁO] Treo mạng nhà, tự động ngắt chuyển sang mạng gốc.');
                }
            }

            // 🚀 LUỒNG 2: NẾU MẠNG NHÀ TREO HOẶC LỖI -> TỰ ĐỘNG CHẠY MẠNG GỐC CỦA HOST
            if (!finalKey) {
                let nativeConfig = {
                    timeout: 10000, 
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
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
                            debugLogs.push(`**Server ${i + 1}:** Phản hồi trống/Bị chặn.`);
                        }
                    } catch (netError) {
                        const status = netError.response ? netError.response.status : "Timeout";
                        debugLogs.push(`**Server ${i + 1}:** Lỗi kết nối (HTTP: ${status})`);
                    }
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý qua: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Cụm máy chủ từ chối kết nối.\n\n📊 **Nhật ký hệ thống:**\n${errorLogString}\n\n💡 *Cách sửa:* Hãy chắc chắn bạn đã lấy đường link Get Key **mới tinh** từ game ra và thử lại nhé!` 
                });
            }

        } catch (globalError) {
            console.error('Lỗi luồng mạng:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình xử lý hệ thống." });
            } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Online!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

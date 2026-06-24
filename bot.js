const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent'); // Nạp thư viện xử lý proxy nâng cao
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Tích hợp Proxy của bạn')
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
                .setDescription('Đang định tuyến qua Proxy riêng của bạn để vượt Cloudflare Delta...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            const serverEndpoints = [
                `https://bypass.tools{encodeURIComponent(url)}`,
                `https://bypass.city{encodeURIComponent(url)}`,
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let debugLogs = [];

            // Cấu hình mạng tiêu chuẩn giả lập trình duyệt thật
            let axiosConfig = {
                timeout: 18000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*'
                }
            };

            // 🔥 TỰ ĐỘNG ĐỌC VÀ KẾT NỐI PROXY RIÊNG CỦA BẠN TỪ CÀI ĐẶT HOSTING
            if (process.env.PROXY_URL) {
                console.log('[SYSTEM] Đang mượn ID mạng từ Proxy cấu hình...');
                const agent = new HttpsProxyAgent(process.env.PROXY_URL);
                axiosConfig.httpsAgent = agent;
                axiosConfig.proxy = false; // Tắt cấu hình proxy mặc định của axios để ép chạy qua Agent
            } else {
                console.log('[CẢNH BÁO] Chưa cấu hình PROXY_URL trên Hosting, đang chạy mạng mặc định!');
            }

            for (let i = 0; i < serverEndpoints.length; i++) {
                try {
                    const response = await axios.get(serverEndpoints[i], axiosConfig);
                    let responseData = response.data;

                    if (responseData) {
                        if (typeof responseData === 'object') {
                            finalKey = responseData.key || 
                                       (responseData.bypassed ? responseData.bypassed.key || responseData.bypassed : null) || 
                                       (responseData.data ? responseData.data.key || responseData.data : null) ||
                                       responseData.result;
                        } else if (typeof responseData === 'string') {
                            finalKey = responseData;
                        }
                    }

                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                        usedServer = i === 0 ? "Bypass.tools Premium Core" : `Cổng Dự Phòng ${i + 1}`;
                        break; 
                    } else {
                        debugLogs.push(`**Server ${i + 1}:** Phản hồi rỗng.`);
                    }
                } catch (netError) {
                    const status = netError.response ? netError.response.status : "Timeout/Proxy Chết";
                    debugLogs.push(`**Server ${i + 1}:** Lỗi (Trạng thái: ${status})`);
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý qua mạng Proxy riêng: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Cụm máy chủ từ chối phản hồi.\n\n📊 **Nhật ký kết nối:**\n${errorLogString}\n\n💡 *Cách sửa:* Hãy kiểm tra lại xem Proxy riêng của bạn còn sống không, hoặc lấy link Delta mới tinh từ game rồi thử lại.` 
                });
            }

        } catch (globalError) {
            console.error('Lỗi ngầm:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình bẻ hướng luồng mạng Proxy." });
            } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Proxy Custom Da On!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

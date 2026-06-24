const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Phiên Bản Gỡ Lỗi Sâu')
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
        console.error('[THẤT BẠI] Lỗi nạp lệnh:', error.message);
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
                .setDescription('Đang cố bẻ khóa qua cụm máy chủ và phân tích phản hồi hệ thống...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // Hệ thống 3 cụm Server chính xác theo cấu hình tài liệu mới nhất
            const serverEndpoints = [
                `https://bypass.tools{encodeURIComponent(url)}`,
                `https://bypass.city{encodeURIComponent(url)}`,
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let debugLogs = []; // Lưu lại log phản hồi của từng server để người dùng kiểm tra

            const requestHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            };

            for (let i = 0; i < serverEndpoints.length; i++) {
                try {
                    console.log(`[NETWORK] Thử kết nối cổng Server ${i + 1}...`);
                    const response = await axios.get(serverEndpoints[i], { headers: requestHeaders, timeout: 15000 });
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

                    // Kiểm tra tính hợp lệ của Key thu được từ API
                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                        usedServer = i === 0 ? "Bypass.tools Core" : `Cổng Dự Phòng ${i + 1}`;
                        break; 
                    } else {
                        debugLogs.push(`**Server ${i + 1}:** Trả dữ liệu trống hoặc không đúng cấu hình.`);
                    }
                } catch (netError) {
                    // Trích xuất mã phản hồi thô từ máy chủ (ví dụ: 403, 429, 502)
                    const status = netError.response ? netError.response.status : "Nghẽn Mạng/Timeout";
                    debugLogs.push(`**Server ${i + 1}:** Thất bại (Mã lỗi HTTP: ${status})`);
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý qua hệ thống: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                // Xuất trực tiếp bảng mã lỗi chi tiết của từng Server lên Discord để chẩn đoán
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Cụm máy chủ từ chối phân tách.\n\n📊 **Nhật ký phản hồi lỗi từ API:**\n${errorLogString}\n\n💡 *Lời khuyên:* Nếu tất cả đều báo lỗi HTTP 403 hoặc Timeout, IP của Hosting bạn đang dùng đã bị Cloudflare chặn hoàn toàn. Hãy thử lấy link Get Key mới tinh hoặc đổi môi trường chạy bot sang máy cá nhân/VPS sạch.` 
                });
            }

        } catch (globalError) {
            console.error('Lỗi sập luồng ngầm:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình xử lý hệ thống." });
            } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Debug Active!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
client.login(botToken);

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Bản Tối Ưu Tường Lửa')
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
                .setDescription('Đang sử dụng cụm máy chủ ẩn danh để lách bộ lọc Cloudflare Delta...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🌟 ĐÃ CẬP NHẬT: Thay đổi sang cụm cổng kết nối ngầm có hệ thống tự giải mã Captcha
            const serverEndpoints = [
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`,
                `https://bypass.tools{encodeURIComponent(url)}`,
                `https://bypass.city{encodeURIComponent(url)}`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let debugLogs = [];

            // Giả lập siêu sâu cấu hình trình duyệt Chrome thật trên máy tính để tránh bị Cloudflare chặn IP
            const axiosConfig = {
                timeout: 20000, // Tăng thời gian chờ lên 20 giây cho mỗi máy chủ
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site'
                }
            };

            for (let i = 0; i < serverEndpoints.length; i++) {
                try {
                    console.log(`[NETWORK] Gửi request ẩn danh đến Server ${i + 1}...`);
                    const response = await axios.get(serverEndpoints[i], axiosConfig);
                    let responseData = response.data;

                    if (responseData) {
                        if (typeof responseData === 'object') {
                            finalKey = responseData.key || 
                                       responseData.result || 
                                       (responseData.bypassed ? responseData.bypassed.key || responseData.bypassed : null) || 
                                       (responseData.data ? responseData.data.key || responseData.data.result : null);
                        } else if (typeof responseData === 'string') {
                            finalKey = responseData;
                        }
                    }

                    // Điều kiện kiểm tra Key nghiêm ngặt
                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && !finalKey.toLowerCase().includes('cloudflare')) {
                        usedServer = i === 0 ? "StickX Core Premium" : i === 1 ? "Bypass.tools Core" : "Bypass.City Engine";
                        break; 
                    } else {
                        debugLogs.push(`**Server ${i + 1}:** Phản hồi không đúng cấu trúc Key.`);
                    }
                } catch (netError) {
                    const status = netError.response ? netError.response.status : "Timeout";
                    debugLogs.push(`**Server ${i + 1}:** Bị tường lửa chặn dữ liệu (HTTP: ${status})`);
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Vượt tường lửa thành công qua cụm: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Toàn bộ cụm máy chủ bẻ khóa đều bị hệ thống Delta chặn kết nối.\n\n📊 **Nhật ký hệ thống:**\n${errorLogString}\n\n💡 *Cách khắc phục:* Bạn hãy bật Roblox lên, bấm lấy một **đường link Get Key mới tinh chưa dùng bao giờ**, sau đó dán trực tiếp vào lệnh Discord để hệ thống lách qua bộ lọc nhé!` 
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
    res.end('Bot Anti-Cloudflare Online!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

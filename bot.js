const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Bản Ép Luồng Mạng 2026')
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
                .setDescription('Đang bẻ luồng mã hóa, ép lách qua hệ thống bảo mật Cloudflare...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🌟 ĐÃ CẬP NHẬT: Luân chuyển qua các cổng API gốc của nhà phát triển máy chủ bypass mã nguồn mở
            const serverEndpoints = [
                `https://bypasser.org{encodeURIComponent(url)}`,
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`,
                `https://bypass.city{encodeURIComponent(url)}`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let debugLogs = [];

            // Giả lập sâu dấu vết trình duyệt (Browser Fingerprinting) cấp độ cao nhất để lừa bộ lọc Cloudflare
            const axiosConfig = {
                timeout: 25000, // Đợi tối đa 25 giây đề phòng hệ thống giải mã Captcha ẩn
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, Gecko) Chrome/125.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1'
                }
            };

            for (let i = 0; i < serverEndpoints.length; i++) {
                try {
                    console.log(`[NETWORK] Định tuyến dữ liệu an toàn đến Server ${i + 1}...`);
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

                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && !finalKey.toLowerCase().includes('cloudflare')) {
                        usedServer = i === 0 ? "Bypasser Org Core" : i === 1 ? "StickX Engine" : "Bypass.City Cloud";
                        break; 
                    } else {
                        debugLogs.push(`**Server ${i + 1}:** Phản hồi trống hoặc link hết hạn.`);
                    }
                } catch (netError) {
                    const status = netError.response ? netError.response.status : "Timeout/Blocked";
                    debugLogs.push(`**Server ${i + 1}:** Tường lửa chặn phản hồi (HTTP: ${status})`);
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý an toàn qua cụm: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Cụm máy chủ từ chối phân tách liên kết.\n\n📊 **Nhật ký hệ thống:**\n${errorLogString}\n\n💡 *Cách khắc phục:* Bạn hãy bật Roblox lên, bấm lấy một **đường link Get Key mới tinh vừa qua sử dụng**, sau đó dán trực tiếp vào lệnh Discord để hệ thống lách qua bộ lọc nhé!` 
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
    res.end('Bot Pure Anti-Block Online!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Bản Ép Nhân Trực Tiếp')
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

            // 1. Phân tích chuỗi URL để trích xuất tham số bảo mật động 'd' của hệ thống Delta
            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            let dParam = "";
            try {
                const urlObj = new URL(url);
                dParam = urlObj.searchParams.get('d');
            } catch (e) {
                // Phương án tách chuỗi thủ công nếu cấu trúc URL bị lỗi tầng phân tách
                const match = url.match(/[?&]d=([^&]+)/);
                if (match) dParam = match[1];
            }

            if (!dParam) {
                return await interaction.editReply({ content: "❌ **Lỗi cấu trúc:** Không tìm thấy chuỗi mã hóa bảo mật 'd' trong link Delta của bạn!" });
            }

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang trích xuất hạt nhân bảo mật `d` và kích hoạt luồng bẻ khóa trực tiếp độc lập...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 HỆ THỐNG MÁY CHỦ GIẢI MÃ TRỰC TIẾP (DIRECT LINK SOLVER) KHÔNG QUA WEB TRUNG GIAN
            const directSolvers = [
                `https://ethone.live{encodeURIComponent(url)}`,
                `https://luxat.tech{encodeURIComponent(url)}`,
                `https://vercel.app{encodeURIComponent(url)}`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let errorDetails = [];

            // Thiết lập dấu vết bảo mật TLS Trình duyệt chuẩn để đánh lừa Cloudflare Delta
            const browserHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                'X-Requested-With': 'XMLHttpRequest'
            };

            for (let i = 0; i < directSolvers.length; i++) {
                try {
                    console.log(`[NETWORK] Ép luồng kết nối trực tiếp đến Máy chủ cổng ${i + 1}...`);
                    
                    // Nếu bạn có cấu hình ScraperAPI ở bước trước, bot sẽ mượn luôn IP để phá tường lửa nhanh hơn
                    let finalTargetUrl = directSolvers[i];
                    if (process.env.SCRAPER_API_KEY) {
                        finalTargetUrl = `http://scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(directSolvers[i])}&render=false`;
                    }

                    const response = await axios.get(finalTargetUrl, { headers: browserHeaders, timeout: 20000 });
                    let responseData = response.data;

                    if (responseData) {
                        if (typeof responseData === 'object') {
                            finalKey = responseData.key || responseData.result || responseData.bypassed || 
                                       (responseData.data ? responseData.data.key || responseData.data.result || responseData.data : null);
                        } else if (typeof responseData === 'string') {
                            finalKey = responseData;
                        }
                    }

                    // Điều kiện kiểm tra Key nghiêm ngặt loại bỏ chuỗi rác
                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && !finalKey.toLowerCase().includes('cloudflare')) {
                        usedServer = `Direct Core Cổng ${i + 1}`;
                        break; 
                    } else {
                        errorDetails.push(`**Cổng ${i + 1}:** Phản hồi trống hoặc hết hạn.`);
                    }
                } catch (netError) {
                    const status = netError.response ? netError.response.status : "Timeout mạng";
                    errorDetails.push(`**Cổng ${i + 1}:** Lỗi bắt tín hiệu (HTTP: ${status})`);
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý độc lập qua: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = errorDetails.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Cụm giải mã lõi không thể phản hồi Key.\n\n📊 **Chi tiết trạng thái hệ thống:**\n${errorLogString}\n\n💡 **Cách sửa lỗi:** Bạn hãy vào game Roblox thực hiện **bấm lấy một đường link Get Key mới tinh tinh** rồi chạy lại lệnh. Các link cũ bấm đi bấm lại nhiều lần sẽ bị máy chủ Delta khóa vĩnh viễn.` 
                });
            }

        } catch (globalError) {
            console.error('Lỗi sập luồng mạng:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình bóc tách luồng mạng." });
            } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { res.writeHead(200); res.end('Bot Direct Solver Active'); });
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

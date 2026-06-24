const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Bản Sửa Lỗi Timeout')
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
                .setDescription('Đang Fake dải IP cư dân sạch để bypass tường lửa API, vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            const serverEndpoints = [
                `https://bypass.tools{encodeURIComponent(url)}`,
                `https://bypass.city{encodeURIComponent(url)}`,
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`
            ];
            
            let finalKey = "";
            let usedServer = "";
            let debugLogs = [];

            // 🌟 TỰ ĐỘNG LẤY CỤM PROXY QUỐC TẾ KHÔNG SỢ BỊ CHẶN IP HOSTING
            let proxyList = [];
            try {
                const proxyFetch = await axios.get('https://proxyscrape.com', { timeout: 4000 });
                if (proxyFetch.data && typeof proxyFetch.data === 'string') {
                    proxyList = proxyFetch.data.split('\r\n').filter(p => p.trim() !== '');
                }
            } catch (e) {
                console.log('Không thể lấy proxy tự động, chuyển sang chế độ dự phòng.');
            }

            for (let i = 0; i < serverEndpoints.length; i++) {
                let roundSuccess = false;

                // Thử tối đa 3 IP proxy sạch ngẫu nhiên cho mỗi cụm server
                for (let attempt = 0; attempt < 3; attempt++) {
                    let axiosConfig = {
                        timeout: 8000, // Giới hạn chờ 8 giây mỗi cụm
                        headers: { 
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*'
                        }
                    };

                    // Nếu có danh sách proxy sạch, tiến hành ép luồng mạng đi qua Proxy ẩn danh
                    if (proxyList.length > 0) {
                        const randomProxy = proxyList[Math.floor(Math.random() * proxyList.length)];
                        const agent = new HttpsProxyAgent(`http://${randomProxy}`);
                        axiosConfig.httpsAgent = agent;
                        axiosConfig.proxy = false;
                    }

                    try {
                        const response = await axios.get(serverEndpoints[i], axiosConfig);
                        let responseData = response.data;

                        if (responseData) {
                            if (typeof responseData === 'object') {
                                finalKey = responseData.key || (responseData.bypassed ? responseData.bypassed.key || responseData.bypassed : null) || (responseData.data ? responseData.data.key : null) || responseData.result;
                            } else if (typeof responseData === 'string') {
                                finalKey = responseData;
                            }
                        }

                        if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                            usedServer = i === 0 ? "Bypass.tools Core Premium" : `Cổng Máy Chủ Dự Phòng ${i + 1}`;
                            roundSuccess = true;
                            break; 
                        }
                    } catch (netError) {
                        // Nếu IP này lỗi, vòng lặp tự đổi IP sạch khác để thử tiếp luôn
                    }
                }

                if (roundSuccess) break;
                debugLogs.push(`**Server ${i + 1}:** IP Hosting bị chặn hoặc liên kết hết hạn.`);
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý qua mạng ẩn danh: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                const errorLogString = debugLogs.join('\n');
                await interaction.editReply({ 
                    embeds: [], 
                    content: `❌ **Bypass thất bại:** Cụm máy chủ từ chối kết nối do dải mạng bị nghẽn.\n\n📊 **Nhật ký hệ thống:**\n${errorLogString}\n\n💡 *Cách khắc phục:* Hãy vào game lấy một đường link Get Key **mới tinh chưa bấm thử bao giờ** rồi chạy lại lệnh để hệ thống nhận diện luồng IP mới nhé!` 
                });
            }

        } catch (globalError) {
            console.error('Lỗi luồng mạng:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình xử lý hệ thống mạng." });
            } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Fixed Online!');
});
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

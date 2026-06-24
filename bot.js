const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Cổng Miễn Phí 100%')
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
                .setDescription('Đang bẻ khóa qua cụm 3 Máy Chủ Cộng Đồng Miễn Phí, vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 CỤM CỔNG MIỄN PHÍ VĨNH VIỄN - KHÔNG YÊU CẦU ĐIỀN TÀI KHOẢN/MÃ THANH TOÁN
            const publicFreeServers = [
                `https://bypass.vip{encodeURIComponent(url)}`,
                `https://ethone.live{encodeURIComponent(url)}`,
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`
            ];
            
            let finalKey = "";
            let usedServer = "";

            const browserHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36'
            };

            for (let i = 0; i < publicFreeServers.length; i++) {
                try {
                    console.log(`[NETWORK] Đang quét cổng miễn phí số ${i + 1}...`);
                    const response = await axios.get(publicFreeServers[i], { headers: browserHeaders, timeout: 20000 });
                    let resData = response.data;

                    if (resData) {
                        if (typeof resData === 'object') {
                            finalKey = resData.key || resData.result || (resData.data ? resData.data.key || resData.data : null);
                        } else if (typeof resData === 'string') {
                            finalKey = resData;
                        }
                    }

                    // Nếu lấy được chuỗi Key chuẩn sạch thì dừng quét ngay
                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                        usedServer = `Cổng Miễn Phí ${i + 1}`;
                        break; 
                    }
                } catch (netError) {
                    console.warn(`Cổng miễn phí ${i + 1} đang bận:`, netError.message);
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý miễn phí qua: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: "❌ **Bypass thất bại:** Cả 3 cổng miễn phí hiện tại đều bị Delta từ chối kết nối IP.\n\n💡 **Cách sửa lỗi:** Hãy vào lại game Roblox **bấm lấy một đường link mới tinh tinh** rồi gõ lại lệnh. Tuyệt đối không dùng lại link cũ đã bị kẹt tường lửa trước đó." 
                });
            }

        } catch (globalError) {
            console.error('Lỗi luồng mạng:', globalError.message);
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Hệ thống gặp lỗi xử lý luồng mạng ngầm." }); } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { res.writeHead(200); res.end('Bot Free Active'); });
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

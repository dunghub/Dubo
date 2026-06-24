const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta v8 - Cổng Tự Động Phá Bản Vá')
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
                .setDescription('Đang sử dụng cổng phá bản vá thế hệ mới, vui lòng chờ từ 10-15 giây...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 SỬ DỤNG ENDPOINT KHÁNG CHẶN ĐỘC LẬP MỚI CỦA KHỐI CỘNG ĐỒNG
            const updatedServers = [
                `https://lootsolvers.xyz{encodeURIComponent(url)}`,
                `https://bypass.vip{encodeURIComponent(url)}`,
                `https://vanyar.cfd{encodeURIComponent(url)}`
            ];
            
            let finalKey = "";
            let usedServer = "";

            const browserHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36'
            };

            for (let i = 0; i < updatedServers.length; i++) {
                try {
                    console.log(`[NETWORK] Đang gọi cổng phá bản vá số ${i + 1}...`);
                    const response = await axios.get(updatedServers[i], { headers: browserHeaders, timeout: 25000 });
                    let resData = response.data;

                    if (resData) {
                        if (typeof resData === 'object') {
                            finalKey = resData.key || resData.result || (resData.data ? resData.data.key || resData.data : null);
                        } else if (typeof resData === 'string') {
                            finalKey = resData;
                        }
                    }

                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                        usedServer = `Cụm Máy Chủ Kháng Chặn ${i + 1}`;
                        break; 
                    }
                } catch (netError) {
                    console.warn(`Cổng số ${i + 1} quá tải:`, netError.message);
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý ổn định qua: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: "❌ **Bypass thất bại:** Hệ thống Delta vừa cập nhật mã độc quyền chặn dải IP diện rộng.\n\n💡 **Mẹo thành công:** Bạn hãy vào game Roblox **bấm lấy một đường link mới tinh chưa gõ vào bot lần nào**, sau đó thực hiện lại lệnh ngay lập tức để hệ thống bẻ khóa đúng tiến trình." 
                });
            }

        } catch (globalError) {
            console.error('Lỗi luồng mạng:', globalError.message);
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Hệ thống gặp lỗi xử lý luồng mạng ngầm." }); } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); });
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

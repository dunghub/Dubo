const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cooldowns = new Map();

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc v8 - Bản Ép Luồng Sạch')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay hoặc Platoboost cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot Online hệ thống: ${client.user.tag}`);
    try {
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID || client.user.id), { body: commands });
        console.log(`[OK] Kích hoạt hệ thống lệnh toàn cầu thành công!`);
    } catch (e) { console.error('Lỗi cấu hình:', e.message); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const cooldownAmount = 5 * 1000; // 5 giây chờ chống spam

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (currentTime < expirationTime) {
                const timeLeft = ((expirationTime - currentTime) / 1000).toFixed(1);
                return await interaction.reply({ content: `⏳ Vui lòng đợi **${timeLeft} giây** để gõ lệnh tiếp theo.`, ephemeral: true });
            }
        }

        const url = interaction.options.getString('url').trim();

        try {
            await interaction.deferReply();

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            const startTime = Date.now();
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang kết nối cụm máy chủ trung gian để quét dải IP sạch vượt Cloudflare Delta...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // Cụm máy chủ bẻ khóa độc lập tự động xoay dải IP dân cư sạch
            const apiServers = [
                `https://luxat.tech{encodeURIComponent(url)}`,
                `https://bypass.vip{encodeURIComponent(url)}`,
                `https://lootsolvers.xyz{encodeURIComponent(url)}`
            ];
            
            let finalKey = "";
            let usedServer = "";

            for (let i = 0; i < apiServers.length; i++) {
                try {
                    const response = await axios.get(apiServers[i], { 
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                        timeout: 15000 
                    });
                    
                    let resData = response.data;
                    if (resData) {
                        if (typeof resData === 'object') {
                            finalKey = resData.key || resData.result || (resData.data ? resData.data.key : null);
                        } else if (typeof resData === 'string') {
                            finalKey = resData;
                        }
                    }

                    if (finalKey && typeof finalKey === 'string' && finalKey.trim().length > 5 && 
                        !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail')) {
                        usedServer = `Tuyến Mạng Sạch Số ${i + 1}`;
                        break; 
                    }
                } catch (err) {
                    console.log(`Chuyển hướng luồng mạng cứu hộ sang cổng tiếp theo...`);
                }
            }

            if (finalKey) finalKey = finalKey.trim();
            const executionTime = Date.now() - startTime;

            if (finalKey && finalKey.length > 5 && !finalKey.toLowerCase().includes('error')) {
                cooldowns.set(userId, currentTime);
                setTimeout(() => cooldowns.delete(userId), cooldownAmount);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Vượt Tường Lửa Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .addFields({ name: '⚡ Tốc độ bẻ khóa', value: `\`${executionTime}ms\``, inline: true })
                    .setFooter({ text: `Xử lý an toàn qua: ${usedServer}` });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Bấm Để Xem Bản Thô (Dễ Copy Trên ĐT)')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://luxat.tech{encodeURIComponent(url)}`)
                );

                await interaction.editReply({ embeds: [successEmbed], components: [row] });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: "❌ **Bypass thất bại:** Cụm máy chủ trung gian đang quá tải hoặc liên kết Delta của bạn đã hết hạn.\n\n💡 **Cách xử lý:** Hãy vào game Roblox **bấm lấy một đường link Get Key hoàn toàn mới tinh tinh**, dán ngay vào lệnh \`/bypass\` để bot bóc tách chuẩn xác." 
                });
            }

        } catch (globalError) {
            try { await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Hệ thống mạng gặp lỗi luồng ngầm cục bộ." }); } catch (e) {}
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => { res.writeHead(200); res.end('Bot Core Running'); });
server.listen(process.env.PORT || 3000);

const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (botToken) client.login(botToken);

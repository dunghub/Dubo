const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Cấu hình Slash Command đồng bộ hệ thống mới
const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc v8 - Cụm 3 Server Dự Phòng')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot đã kết nối thành công: ${client.user.tag}`);
    try {
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        const rest = new REST({ version: '10' }).setToken(token);
        
        const CLIENT_ID = process.env.CLIENT_ID || client.user.id;
        const GUILD_ID = process.env.GUILD_ID; // Cấu hình ID Server tại biến môi trường để nhận lệnh ngay lập tức

        console.log('[⏳] Đang tích hợp lệnh Slash vào cụm máy chủ mới...');
        
        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), 
                { body: commands }
            );
            console.log(`[OK] Kích hoạt lệnh siêu tốc thành công tại Server ID: ${GUILD_ID}`);
        } else {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID), 
                { body: commands }
            );
            console.log('[OK] Đã đăng ký lệnh Slash Toàn Cầu (Mất vài phút để hiển thị)!');
        }
    } catch (error) {
        console.error('[THẤT BẠI] Lỗi nạp lệnh lên API Discord:', error.message);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url').trim();

        try {
            // Hoãn phản hồi chống lỗi "Ứng dụng không phản hồi" trong vòng 3 giây
            await interaction.deferReply();

            // Kiểm tra cấu trúc link hệ thống Delta
            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            // Gửi thông báo trạng thái kết nối cụm server
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang quét lệnh trên cụm **3 máy chủ nâng cấp v8**, vui lòng chờ trong giây lát...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 ĐÃ NẠP CỤM 3 SERVER UPDATE SIÊU TỐC TỰ ĐỘNG XOAY VÒNG
            const serverEndpoints = [
                `https://bypass.city{encodeURIComponent(url)}`,                       // Server chính 1
                `https://bypass.vip{encodeURIComponent(url)}`,                    // Server dự phòng 2
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`    // Server dự phòng 3 (Cổng StickX)
            ];
            
            let finalKey = "";
            let usedServer = "";

            // Vòng lặp tự động cào qua từng server cho đến khi ra Key
            for (let i = 0; i < serverEndpoints.length; i++) {
                try {
                    console.log(`[NETWORK] Đang thử bẻ khóa tại Server ${i + 1}...`);
                    const response = await axios.get(serverEndpoints[i], { timeout: 12000 }); // Đợi tối đa 12 giây mỗi cổng
                    
                    let responseData = response.data;
                    if (responseData) {
                        // Trích xuất linh hoạt theo mọi cấu trúc dữ liệu JSON đầu ra của các bên
                        if (typeof responseData === 'object') {
                            finalKey = responseData.key || responseData.result || responseData.query || responseData.bypassed || responseData.data;
                        } else if (typeof responseData === 'string') {
                            finalKey = responseData;
                        }
                    }

                    // Điều kiện: Nếu tìm thấy key hợp lệ thì ghi nhận server và thoát vòng lặp ngay
                    if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                        usedServer = `Cổng Máy Chủ Dự Phòng ${i + 1}`;
                        break;
                    }
                } catch (netError) {
                    console.warn(`[CẢNH BÁO] Server ${i + 1} phản hồi lỗi hoặc hết hạn:`, netError.message);
                }
            }

            if (finalKey) finalKey = finalKey.trim();

            // Phân tích và xuất kết quả cuối cùng ra màn hình Discord
            if (finalKey && !finalKey.toLowerCase().includes('error') && !finalKey.toLowerCase().includes('fail') && finalKey.length > 5) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta của bạn đã sẵn sàng:**\n\`\`\`text\n${finalKey}\n\`\`\``)
                    .setFooter({ text: `Xử lý thành công qua: ${usedServer}` });

                await interaction.editReply({ embeds: [successEmbed], content: null });
            } else {
                await interaction.editReply({ 
                    embeds: [], 
                    content: "❌ **Bypass thất bại:** Cả 3 cụm máy chủ đều không thể bẻ khóa liên kết này. Nguyên nhân có thể do Link Get Key đã hết hạn hoặc Delta vừa cập nhật bản vá chống bot. Hãy lấy link mới tinh trong game và thử lại." 
                });
            }

        } catch (globalError) {
            console.error('Lỗi sập luồng ngầm:', globalError.message);
            try {
                await interaction.editReply({ embeds: [], content: "❌ **Sự cố:** Có lỗi xảy ra trong quá trình xử lý luồng mạng hệ thống." });
            } catch (e) {}
        }
    }
});

// Giữ cổng mạng mở liên tục để tránh tình trạng bot bị đưa vào trạng thái ngủ (Sleep) trên hosting mới
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Dubo - Cum 3 May Chu Moi Da Kich Hoat!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[SERVER] Cổng mạng giữ ứng dụng đã mở tại port: ${PORT}`);
});

// Khởi chạy nạp Token đăng nhập
const botToken = process.env.DISCORD_TOKEN || process.env.TOKEN;
client.login(botToken).catch(err => {
    console.error("[LỖI CHÍ MẠNG] Token điền trên Hosting bị sai hoặc chưa bật quyền Privileged Intents:", err.message);
});

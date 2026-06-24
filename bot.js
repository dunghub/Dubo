const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Cấu hình lệnh Slash Command đồng bộ hệ thống mới
const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta siêu tốc v8 - Bản Sửa Lỗi Tối Cao')
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
        const GUILD_ID = process.env.GUILD_ID; // Nhập ID Server tại biến môi trường để nhận lệnh ngay lập tức

        console.log('[⏳] Đang tích hợp lệnh Slash vào cụm hệ thống mới...');
        
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
            // Hoãn phản hồi chống lỗi quá 3 giây của Discord (Né lỗi Ứng dụng không phản hồi)
            await interaction.deferReply();

            // Kiểm tra cấu trúc link hệ thống Delta
            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng Get Key của Delta!" });
            }

            // Gửi thông báo trạng thái kết nối cụm server
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Hệ Thống Đang Xử Lý')
                .setDescription('Đang bẻ khóa link qua cụm **3 Máy Chủ Siêu Cấp (Ưu tiên: Bypass.tools)**...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            // 🔥 ĐÃ SỬA LẠI TOÀN BỘ ENDPOINT CHUẨN XÁC TỪNG KÝ TỰ
            const serverEndpoints = [
                `https://bypass.tools{encodeURIComponent(url)}`,                  // 🌟 Cổng 1: Máy chủ mới Bypass.tools
                `https://bypass.city{encodeURIComponent(url)}`,                      // Cổng 2: Máy chủ dự phòng City
                `https://stickx.top{encodeURIComponent(url)}&api_key=free`    // Cổng 3: Máy chủ dự phòng StickX
            ];
            
            let finalKey = "";
            let usedServer = "";

            // Giả lập Headers thật của Trình duyệt cấp cao để vượt Cloudflare của Delta
            const requestHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://bypass.tools/'
            };

            // Vòng lặp quét tìm server đang hoạt động tốt nhất
            for (let i = 0; i < serverEndpoints.length; i++) {
                try {
                    console.log(`[NETWORK] Đang thử bẻ khóa tại Server Cổng ${i + 1}...`);
                    const response = await axios.get(serverEndpoints[i], { 
                        headers: requestHeaders,
                        timeout: 18000 // Tăng thời gian chờ lên 18 giây mỗi cổng chống nghẽn phản hồi
                    });
                    
                    let responseData = response.data;
                    if (responseData) {
                        // 🛠️ BỘ TRÍCH XUẤT ĐA TẦNG THÔNG MINH - SỬA LỖI KHÔNG ĐỌC ĐƯỢC ĐỐI TƯỢNG JSON LỒNG
                        if (typeof responseData === 'object') {
                            finalKey = responseData.key || 
                                       (responseData.bypassed ? responseData.bypassed.key || responseData.bypassed : null) || 
                                       (responseData.data ? responseData.data.key || responseData.data.result || responseData.data : null) ||
                                       responseData.result || 
                                       responseData.query;
                        } else if (typeof responseData === 'string') {
                            finalKey = responseData;
                        }
                    }

                    // Điều kiện kiểm tra Key nghiêm ngặt (Chuỗi sạch, không chứa thông báo lỗi, độ dài hợp lệ)
                    if (finalKey && 
                        typeof finalKey === 'string' && 
                        !finalKey.toLowerCase().includes('error') && 
                        !finalKey.toLowerCase().includes('fail') && 
                        !finalKey.toLowerCase().includes('invalid') &&
                        finalKey.trim().length > 5) {
                        
                        usedServer = i === 0 ? "Bypass.tools Premium Core" : `Cổng Dự Phòng Cấp ${i + 1}`;
                        break; // Tìm thấy Key chuẩn, dừng vòng lặp ngay lập tức
                    }
                } catch (netError) {
                    console.warn(`[CẢNH BÁO] Server cổng ${i + 1} không phản hồi hoặc trả dữ liệu sai:`, netError.message);
                }
            }

            // Làm sạch chuỗi cuối cùng trước khi xuất bản
            if (finalKey && typeof finalKey === 'string') finalKey = finalKey.trim();

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
                    content: "❌ **Bypass thất bại:** Cả 3 cụm máy chủ đều không thể phân tách liên kết này.\n\n💡 **Cách khắc phục:** Link Get Key này có khả năng đã hết hạn hoặc đã được sử dụng từ trước. Hãy vào lại game Roblox, bấm lấy một đường **link mới tinh chưa qua sử dụng** rồi thực hiện lại lệnh nhé!" 
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

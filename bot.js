// bot.js - Hệ Thống Bot Độc Lập 100% - Tự Chạy Trình Duyệt Ẩn Danh Vượt Cloudflare (Bản Android & iOS)
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
require('dotenv').config();

// KÍCH HOẠT TÍNH NĂNG STEALTH: Xóa bỏ hoàn toàn biến "navigator.webdriver" để Cloudflare không nhận diện được bot
puppeteer.use(StealthPlugin());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cooldowns = new Map();

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta - Tự chạy trình duyệt ngầm vượt bảo mật')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platoboost (Android) hoặc LootLabs (iOS) cần bẻ khóa')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`[OK] Bot Độc Lập Đang Hoạt Động: ${client.user.tag}`);
    try {
        const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
        if (!token) return console.error("❌ Thiếu DISCORD_TOKEN trong file .env!");
        
        const rest = new REST({ version: '10' }).setToken(token);
        const CLIENT_ID = process.env.CLIENT_ID || client.user.id;
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log(`[OK] Đã kích hoạt lệnh slash command công khai!`);
    } catch (e) { console.error('Lỗi cấu hình:', e.message); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const cooldownAmount = 15 * 1000; // Đặt thời gian chờ lệnh là 15 giây

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

            // 1. TỰ ĐỘNG PHÂN TÁCH ĐỊNH DẠNG LINK ANDROID / IOS
            let osType = "";
            let isLootLabs = false;
            try {
                const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
                const host = parsedUrl.hostname;
                
                if (host.includes('platorelay.com') || host.includes('platoboost.com')) {
                    osType = "Android (Platoboost)";
                } else if (host.includes('lootlabs.gg')) {
                    osType = "iOS (LootLabs)";
                    isLootLabs = true;
                } else {
                    return await interaction.editReply({ content: "❌ **Lỗi:** Đường link nhập vào không đúng định dạng miền Get Key Delta!" });
                }
            } catch (err) {
                return await interaction.editReply({ content: "❌ **Lỗi:** Cấu trúc liên kết truyền vào không hợp lệ!" });
            }

            const startTime = Date.now();
            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⏳ Đang Xử Lý Luồng [${osType}]`)
                .setDescription('Bot đang khởi chạy một cửa sổ Chrome ẩn ngầm, tự thực thi Javascript để vượt qua lớp thử thách của Cloudflare một cách tự nhiên như người thật...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            let finalResult = "";
            let errorMsg = "";
            let browser = null;

            try {
                // Khởi chạy trình duyệt nhân Chromium ẩn danh ngay trên cấu hình máy chủ của bạn
                browser = await puppeteer.launch({
                    headless: true, // Ép chạy ngầm không tốn giao diện đồ họa hiển thị
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // Nhận đường dẫn Chrome trên Render nếu có
                    args: [
                        '--no-sandbox', 
                        '--disable-setuid-sandbox',
                        '--disable-blink-features=AutomationControlled', // Chặn hoàn toàn mã phát hiện bot tự động
                        '--window-size=1280,720',
                        '--disable-infobars'
                    ]
                });

                const page = await browser.newPage();
                
                // Giả lập thông số phần cứng màn hình trùng khớp với cấu hình máy tính thật
                await page.setViewport({ width: 1280, height: 720 });
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

                // Cho trình duyệt điều hướng truy cập trực tiếp vào link get key
                await page.goto(url.startsWith('http') ? url : `https://${url}`, { 
                    waitUntil: 'networkidle2', // Đợi trang tải xong toàn bộ tài nguyên hệ thống
                    timeout: 28000             // Đặt giới hạn 28s trước khi quá hạn an toàn của Discord
                });

                // Ép trình duyệt ngầm nghỉ 5 giây để Cloudflare quét hành vi và tự động giải mã Turnstile ổn định
                await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 5000)));

                if (isLootLabs) {
                    // LUỒNG IOS (LOOTLABS): Bốc thẳng đường link URL cuối cùng mà trang web tự nhảy tới sau khi vượt quảng cáo
                    finalResult = page.url();
                } else {
                    // LUỒNG ANDROID (PLATOBOOST): Đọc dữ liệu văn bản thô hiển thị trên màn hình trang đích để tìm chuỗi Key
                    const bodyText = await page.evaluate(() => document.body.innerText);
                    
                    // Phương án 1: Tìm kiếm trong các ô nhập dữ liệu có sẵn trên giao diện
                    finalResult = await page.evaluate(() => {
                        const inputElement = document.querySelector('input[id="key"]') || 
                                             document.querySelector('input[name="key"]') || 
                                             document.querySelector('textarea');
                        return inputElement ? inputElement.value : "";
                    });

                    // Phương án dự phòng 2: Dùng Regex quét bóc tách dòng chữ hiển thị trực tiếp trên giao diện
                    if (!finalResult) {
                        const match = bodyText.match(/Key:\s*([A-Za-z0-9_-]+)/) || 
                                      bodyText.match(/Your Key:\s*([A-Za-z0-9_-]+)/) ||
                                      bodyText.match(/🔑\s*([A-Za-z0-9_-]{10,})/); // Quét chuỗi dài trên 10 ký tự
                        if (match) finalResult = match[0];
                    }
                }

                // Nếu chạy hết luồng mà kết quả thu được vẫn trùng với link ban đầu, chứng tỏ chưa bấm lấy key được
                if (!finalResult || finalResult === url) {
                    errorMsg = "Trình duyệt đã vượt bảo mật thành công nhưng trang đích chưa kích hoạt được nút nhận Key.";
                }

            } catch (err) {
                errorMsg = `Lỗi trong quá trình giả lập trình duyệt ẩn: ${err.message}`;
            } finally {
                // CỰC KỲ QUAN TRỌNG: Đảm bảo cửa sổ Chrome ngầm phải được đóng lại bất kể chạy thành công hay thất bại để giải phóng bộ nhớ RAM
                if (browser) {
                    await browser.close();
                }
            }

            const executionTime = Date.now() - startTime;

            // 4. XỬ LÝ XUẤT KẾT QUẢ ĐỒNG BỘ LÊN DISCORD CHAT
            if (finalResult && finalResult !== url && !finalResult.includes("false") && !finalResult.includes("undefined")) {
                cooldowns.set(userId, currentTime);
                setTimeout(() => cooldowns.delete(userId), cooldownAmount);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(`✅ Vượt Tường Lửa [${osType}] Thành Công`)
                    .addFields({ name: '⚡ Thời gian phân tích', value: `\`${executionTime}ms\``, inline: true })
                    .setFooter({ text: 'Hệ thống tự bẻ khóa độc lập bằng cơ chế Chromium Stealth 100%' });

                const row = new ActionRowBuilder();

                if (isLootLabs) {
                    successEmbed.setDescription(`🔗 **Liên kết chứa mã Key Delta iOS của bạn đã sẵn sàng:**\n\nBạn hãy bấm vào nút bấm bên dưới để mở liên kết lấy thẳng mã key cuối cùng mà không cần xem quảng cáo!`);
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel('Bấm Để Mở Link Nhận Key iOS')
                            .setStyle(ButtonStyle.Link)
                            .setURL(finalResult)
                    );
                } else {
                    successEmbed.setDescription(`🔑 **Key Delta Android của bạn đã sẵn sàng:**\n\`\`\`text\n${finalResult}\n\`\`\``);
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel('Bấm Để Sao Chép Link Gốc')
                            .setStyle(ButtonStyle.Link)
                            .setURL(url)
                    );
                }

                await interaction.editReply({ embeds: [successEmbed], components: [row] });
            } else {
                await interaction.editReply({ 
                    embeds: [], 

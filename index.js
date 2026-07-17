const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ChannelType, REST, Routes } = require('discord.js');

// =========================================================================
// ⚙️ 1. CẤU HÌNH HỆ THỐNG (ĐIỀN 3 ID SỐ CỦA BẠN VÀO ĐÂY)
// =========================================================================
// 🎯 Token được lấy tự động từ mục Environment Variables trên Render, KHÔNG CẦN THAY THẾ DÒNG NÀY:
const TOKEN = process.env.TOKEN; 

// 🎯 Bắt buộc điền chính xác 3 dãy số ID này để không bị lỗi UND_ERR_INVALID_ARG:
const CLIENT_ID = 'THAY_ID_BOT_CỦA_BẠN_VÀO_ĐÂY';       // ID con bot của bạn
const MY_SERVER_ID = 'THAY_ID_SERVER_CỦA_BẠN_VÀO_ĐÂY';   // ID server Discord của bạn
const OWNER_ID = 'THAY_ID_DISCORD_CỦA_BẠN_VÀO_ĐÂY';       // ID tài khoản Discord cá nhân của bạn (Chủ bot)

// Khởi tạo Client Bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites
    ]
});

// Bộ nhớ cache lưu số lần dùng link mời và cấu hình kênh
const invitesCache = new Map();
let WELCOME_CONFIG = {
    welcomeChannelId: null,      
    announcementChannelId: null, 
    rulesChannelId: null         
};

// Danh sách chặn spam lượt mời khi thành viên cũ out ra vào lại
const historicalMembers = new Set();

// =========================================================================
// 🚀 2. SỰ KIỆN BOT ONLINE & ĐĂNG KÝ SLASH COMMANDS (AN TOÀN TRÊN RENDER)
// =========================================================================
client.once('ready', async () => {
    console.log(`🤖 Bot đã kích hoạt thành công: ${client.user.tag}`);

    // Kiểm tra rào chắn Token & ID trước khi chạy tiếp để chặn crash sập bot trên Render
    if (!TOKEN) {
        return console.error("❌ CRASH CHẶN: Không tìm thấy biến môi trường TOKEN trên Render. Hãy kiểm tra lại mục Environment Variables!");
    }
    if (!CLIENT_ID || CLIENT_ID.includes('THAY_') || !MY_SERVER_ID || MY_SERVER_ID.includes('THAY_')) {
        return console.error("❌ CRASH CHẶN: Bạn chưa thay đổi CLIENT_ID hoặc MY_SERVER_ID thành các dãy số thật trong file code!");
    }

    // Nạp link mời hiện tại của Server vào cache lúc khởi động
    try {
        const guild = await client.guilds.fetch(MY_SERVER_ID).catch(() => null);
        if (guild) {
            const firstInvites = await guild.invites.fetch().catch(() => null);
            if (firstInvites) {
                firstInvites.forEach(inv => {
                    if (inv && inv.code) invitesCache.set(inv.code, inv.uses);
                });
                console.log(`✅ Đã nạp thành công ${invitesCache.size} link mời vào bộ đếm tạm.`);
            }
        }
    } catch (err) {
        console.error('⚠️ Lỗi nạp link mời lúc khởi động (Đã chặn sập):', err.message);
    }

    // Định nghĩa cấu trúc lệnh /invite và /set-welcome
    const commands = [
        new SlashCommandBuilder()
            .setName('invite')
            .setDescription('Lấy link mời độc quyền của server'),

        new SlashCommandBuilder()
            .setName('set-welcome')
            .setDescription('Thiết lập các kênh hiển thị bảng Chào Mừng, Thông Báo và Quy Tắc')
            .setDefaultMemberPermissions(0)
            .addChannelOption(option => 
                option.setName('kenh-chao-mung')
                    .setDescription('Chọn kênh text để bot nổ khung văn bản chào mừng')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
            .addChannelOption(option => 
                option.setName('kenh-thong-bao')
                    .setDescription('Chọn kênh thông báo để làm link điều hướng')
                    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                    .setRequired(true)
            )
            .addChannelOption(option => 
                option.setName('kenh-quy-tac')
                    .setDescription('Chọn kênh quy tắc/rules để làm link điều hướng')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
    ].map(command => command.toJSON());

    // Đăng ký lệnh Slash trực tiếp lên Server thông qua API Discord
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, MY_SERVER_ID), 
            { body: commands }
        );
        console.log('✅ Đã đăng ký thành công hệ thống lệnh Slash Commands lên Server!');
    } catch (error) {
        console.error('⚠️ Lỗi đăng ký lệnh Slash (Đã chặn sập):', error.message);
    }
});

// Cập nhật cache khi có link mời mới được tạo
client.on('inviteCreate', (invite) => {
    if (invite && invite.code) invitesCache.set(invite.code, invite.uses);
});

// =========================================================================
// 🎯 3. XỬ LÝ PHẢN HỒI KHI THÀNH VIÊN SỬ DỤNG LỆNH GÕ
// =========================================================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction || !interaction.isChatInputCommand()) return;

    // Xử lý lệnh /invite
    if (interaction.commandName === 'invite') {
        return interaction.reply({ 
            content: `🔗 **Link tham gia server độc quyền:** https://discord.gg/dubobypass\nChúc bạn chơi game vui vẻ!`, 
            ephemeral: false 
        }).catch(console.error);
    }

    // Xử lý lệnh cấu hình /set-welcome
    if (interaction.commandName === 'set-welcome') {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '❌ Bạn không có quyền hạn cấu hình hệ thống này!', ephemeral: true }).catch(console.error);
        }

        await interaction.deferReply({ ephemeral: true }).catch(() => null);

        const chaoMungKenh = interaction.options.getChannel('kenh-chao-mung');
        const thongBaoKenh = interaction.options.getChannel('kenh-thong-bao');
        const quyTacKenh = interaction.options.getChannel('kenh-quy-tac');

        if (!chaoMungKenh || !thongBaoKenh || !quyTacKenh) {
            return interaction.editReply({ content: '❌ Thao tác lỗi. Không nhận diện được các kênh.' }).catch(console.error);
        }

        WELCOME_CONFIG.welcomeChannelId = chaoMungKenh.id;
        WELCOME_CONFIG.announcementChannelId = thongBaoKenh.id;
        WELCOME_CONFIG.rulesChannelId = quyTacKenh.id;

        const setupEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ THIẾT LẬP HỆ THỐNG GIAO DIỆN THÀNH CÔNG')
            .setDescription(
                `Hệ thống bot đã đồng bộ cấu hình hiển thị đa kênh:\n\n` +
                `🖼️ **Kênh gửi Embed Chào mừng:** <#${WELCOME_CONFIG.welcomeChannelId}>\n` +
                `📢 **Kênh điều hướng Thông báo:** <#${WELCOME_CONFIG.announcementChannelId}>\n` +
                `📜 **Kênh điều hướng Quy tắc/Rules:** <#${WELCOME_CONFIG.rulesChannelId}>`
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [setupEmbed] }).catch(console.error);
    }
});

// =========================================================================
// 👋 4. XỬ LÝ SỰ KIỆN CHÀO MỪNG THÀNH VIÊN VÀ QUÉT CHẶN NGƯỜI CŨ
// =========================================================================
client.on('guildMemberAdd', async (member) => {
    if (!member || !member.guild || member.guild.id !== MY_SERVER_ID) return;
    
    // Nếu chưa cấu hình /set-welcome thì bỏ qua không chạy để tránh lỗi
    if (!WELCOME_CONFIG.welcomeChannelId || !WELCOME_CONFIG.announcementChannelId || !WELCOME_CONFIG.rulesChannelId) {
        return console.log("⚠️ Hệ thống bỏ qua sự kiện: Chưa chạy cấu hình /set-welcome trên Discord.");
    }

    const guild = member.guild;
    let inviterName = "Không rõ / Không xác định";
    let isOldMember = historicalMembers.has(member.id);

    try {
        const newInvites = await guild.invites.fetch().catch(() => null);
        
        if (newInvites) {
            // Quét link mời vừa tăng số lần sử dụng
            const usedInvite = newInvites.find(inv => {
                if (!inv || !inv.code) return false;
                const cachedUses = invitesCache.get(inv.code);
                const dynamicCached = cachedUses !== undefined ? cachedUses : 0;
                return inv.uses > dynamicCached;
            });

            // Cập nhật nhanh số lượt dùng vào cache
            newInvites.forEach(inv => {
                if (inv && inv.code) invitesCache.set(inv.code, inv.uses);
            });

            // Chỉ tính lượt mời nếu đây là tài khoản mới tinh (không có trong historicalMembers)
            if (!isOldMember && usedInvite && usedInvite.inviter) {
                inviterName = `<@${usedInvite.inviter.id}>`; 
            }
        }
    } catch (err) {
        console.error('⚠️ Lỗi quét link mời sử dụng (Đã chặn sập):', err.message);
    }

    // Đã vào server thì lưu ID vào danh sách để chặn tính điểm mời nếu lần sau out-in lại
    historicalMembers.add(member.id);

    const serverName = guild.name || "Server"; 

    // 🎨 BẢNG ĐỊNH DẠNG KHUNG VĂN BẢN (EMBED) CHUẨN ĐÉT THEO MẪU ẢNH
    const welcomeEmbed = new EmbedBuilder()
        .setColor('#2ecc71') // Thanh viền màu xanh lá
        .setAuthor({ name: serverName, iconURL: guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL() })
        .setDescription(
            `Chào mừng ${member} 🐧🐧🐧🐧🐧🐧🐧🐧 đã đến với **${serverName}**\n` +
            `chúc bạn vui vẻ trong server và 1 ngày tốt lành nhé\n\n` +
            `### **Cập nhật thông báo mới nhất của ${serverName} tại**\n\n` +
            `📢 <#${WELCOME_CONFIG.announcementChannelId}>\n\n` +
            `### **Xem qua những quy tắc của ${serverName} tại**\n\n` +
            `# <#${WELCOME_CONFIG.rulesChannelId}>\n\n` +
            `--------------------------------------------------\n` +
            `👤 **NGƯỜI MỜI:** ${inviterName}` // Nằm ở cuối văn bản theo đúng yêu cầu của bạn
        )
        .setFooter({ text: `${serverName} | Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}` });

    // Tiến hành bắn tin nhắn công khai lên kênh hiển thị chào mừng
    try {
        const channelToSend = await guild.channels.fetch(WELCOME_CONFIG.welcomeChannelId).catch(() => null);
        if (channelToSend && channelToSend.isTextBased()) {
            
            // Ở đầu văn bản: chỉ tag người vừa vào server giống ảnh app Mimu
            let topMessage = `Có thành viên **${member.user?.username || "Thành viên"}** mới vào nè 🐱`;
            
            // Lời thoại thông minh nếu là người cũ quay về server
            if (isOldMember) {
                topMessage = `Thành viên cũ **${member.user?.username || "Thành viên"}** vừa quay trở lại server!`;
            }

            await channelToSend.send({ 
                content: topMessage, 
                embeds: [welcomeEmbed] 
            });
        }
    } catch (error) {
        console.error('⚠️ Lỗi gửi tin nhắn chào mừng (Đã chặn crash):', error.message);
    }
});

// Giữ lại ID khi member out khỏi server để làm dữ liệu chặn spam tính điểm mời
client.on('guildMemberRemove', (member) => {
    if (member && member.guild && member.guild.id === MY_SERVER_ID) {
        historicalMembers.add(member.id);
    }
});

// Đăng nhập kết nối bot
client.login(TOKEN).catch(err => console.error("❌ LỖI ĐĂNG NHẬP BOT: Vui lòng xem lại chuỗi mã TOKEN trên Render.", err.message));

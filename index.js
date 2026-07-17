const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ChannelType, REST, Routes } = require('discord.js');

// --- ⚙️ CẤU HÌNH HỆ THỐNG BAN ĐẦU ---
const TOKEN = 'THAY_TOKEN_BOT_CỦA_BẠN_VÀO_ĐÂY';
const CLIENT_ID = 'THAY_ID_BOT_CỦA_BẠN_VÀO_ĐÂY';
const MY_SERVER_ID = 'THAY_ID_SERVER_CỦA_BẠN_VÀO_ĐÂY';
const OWNER_ID = 'THAY_ID_DISCORD_CỦA_BẠN_VÀO_ĐÂY'; // ID của bạn (Chủ bot) để dùng lệnh setup

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites
    ]
});

// 📁 BỘ LƯU TRỮ LINK MỜI VÀ CẤU HÌNH KÊNH CHÀO MỪNG
const invitesCache = new Map();
let WELCOME_CONFIG = {
    welcomeChannelId: null,      // Kênh nổ tin nhắn embed chào mừng
    announcementChannelId: null, // Kênh dẫn player đến đọc Thông báo
    rulesChannelId: null         // Kênh dẫn player đến đọc Quy tắc
};

// 👥 BỘ LƯU TRỮ THÀNH VIÊN CŨ (Tránh tính lượt mời khi họ thoát ra vào lại)
const historicalMembers = new Set();

// =========================================================================
// 🚀 SỰ KIỆN KHI BOT SẴN SÀNG & ĐĂNG KÝ SLASH COMMANDS
// =========================================================================
client.once('ready', async () => {
    console.log(`🤖 Bot đã trực tuyến với tên: ${client.user.tag}`);

    // Nạp toàn bộ link mời hiện tại của Server vào bộ nhớ tạm (Cache)
    try {
        const guild = await client.guilds.fetch(MY_SERVER_ID);
        const firstInvites = await guild.invites.fetch();
        firstInvites.forEach(inv => invitesCache.set(inv.code, inv.uses));
        console.log(`✅ Đã nạp ${firstInvites.size} link mời vào bộ nhớ cache.`);
    } catch (err) {
        console.error('Không thể nạp link mời lúc khởi động:', err);
    }

    // --- 🛠️ ĐỊNH NGHĨA DANH SÁCH LỆNH SLASH COMMAND ---
    const commands = [
        // Lệnh lấy link mời độc quyền công khai
        new SlashCommandBuilder()
            .setName('invite')
            .setDescription('Lấy link mời độc quyền của server'),

        // Lệnh cấu hình hệ thống đa kênh chào mừng (Chỉ duy nhất bạn/Chủ bot thấy và dùng được)
        new SlashCommandBuilder()
            .setName('set-welcome')
            .setDescription('Thiết lập các kênh hiển thị bảng Chào Mừng, Thông Báo và Quy Tắc')
            .setDefaultMemberPermissions(0)
            .addChannelOption(option => 
                option.setName('kenh-chao-mung')
                    .setDescription('Chọn kênh cộng đồng để bot nổ khung văn bản chào mừng')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
            .addChannelOption(option => 
                option.setName('kenh-thong-bao')
                    .setDescription('Chọn kênh thông báo để gắn link điều hướng')
                    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                    .setRequired(true)
            )
            .addChannelOption(option => 
                option.setName('kenh-quy-tac')
                    .setDescription('Chọn kênh quy tắc/rules để gắn link điều hướng')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
    ].map(command => command.toJSON());

    // Đăng ký lệnh Slash trực tiếp lên server của bạn
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, MY_SERVER_ID), { body: commands });
        console.log('✅ Đã đăng ký thành công danh sách Slash Commands lên Server!');
    } catch (error) {
        console.error('Lỗi khi đăng ký Slash Commands:', error);
    }
});

// Cập nhật cache ngay lập tức khi có link mời mới được tạo trong Server
client.on('inviteCreate', (invite) => {
    invitesCache.set(invite.code, invite.uses);
});

// =========================================================================
// 🎯 XỬ LÝ KHI NGƯỜI DÙNG TƯƠNG TÁC GÕ LỆNH (INTERACTION)
// =========================================================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // 1. XỬ LÝ LỆNH /invite
    if (interaction.commandName === 'invite') {
        return interaction.reply({ 
            content: `🔗 **Link tham gia server độc quyền:** https://discord.gg/dubobypass\nChúc bạn chơi game vui vẻ!`, 
            ephemeral: false // Mọi người trong chat đều nhìn thấy
        });
    }

    // 2. XỬ LÝ LỆNH /set-welcome (Chỉ chủ bot được dùng)
    if (interaction.commandName === 'set-welcome') {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh cấu hình hệ thống này!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        WELCOME_CONFIG.welcomeChannelId = interaction.options.getChannel('kenh-chao-mung').id;
        WELCOME_CONFIG.announcementChannelId = interaction.options.getChannel('kenh-thong-bao').id;
        WELCOME_CONFIG.rulesChannelId = interaction.options.getChannel('kenh-quy-tac').id;

        const setupEmbed = new EmbedBuilder()
            .setColor('#00ff55')
            .setTitle('✅ THIẾT LẬP HỆ THỐNG CHÀO MỪNG THÀNH CÔNG')
            .setDescription(
                `Bot đã ghi nhận cấu hình hiển thị mới:\n\n` +
                `📢 **Kênh gửi Embed Chào mừng:** <#${WELCOME_CONFIG.welcomeChannelId}>\n` +
                `📢 **Kênh điều hướng Thông báo:** <#${WELCOME_CONFIG.announcementChannelId}>\n` +
                `📜 **Kênh điều hướng Quy tắc:** <#${WELCOME_CONFIG.rulesChannelId}>`
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [setupEmbed] });
    }
});

// =========================================================================
// 👋 KIỂM TRA SỰ KIỆN CHÀO MỪNG & LỌC TÀI KHOẢN CŨ QUAY LẠI
// =========================================================================
client.on('guildMemberAdd', async (member) => {
    const guild = member.guild;

    if (guild.id === MY_SERVER_ID) {
        // Nếu bạn chưa gõ /set-welcome để cài đặt kênh thì bot sẽ bỏ qua không lỗi
        if (!WELCOME_CONFIG.welcomeChannelId) {
            return console.log("Hệ thống chưa được thiết lập kênh bằng lệnh /set-welcome");
        }

        let inviterName = "Không rõ / Không xác định";
        let isOldMember = historicalMembers.has(member.id);

        try {
            const newInvites = await guild.invites.fetch();
            
            // Tìm link mời vừa tăng số lần dùng (uses)
            const usedInvite = newInvites.find(inv => {
                const cachedUses = invitesCache.get(inv.code);
                const dynamicCached = cachedUses !== undefined ? cachedUses : 0;
                return inv.uses > dynamicCached;
            });

            // Cập nhật lại bộ đếm của cache link mời
            newInvites.forEach(inv => invitesCache.set(inv.code, inv.uses));

            // Chỉ lấy thông tin người mời nếu đây là tài khoản mới tinh (chưa từng ở trong server)
            if (!isOldMember && usedInvite) {
                if (usedInvite.inviter) {
                    inviterName = `<@${usedInvite.inviter.id}>`; 
                }
            }
        } catch (err) {
            console.error('Lỗi phân tích link mời:', err);
        }

        // Đánh dấu lưu ID người này vào danh sách thành viên để check nếu họ out ra vào lại
        historicalMembers.add(member.id);

        const serverName = guild.name; 

        // 🎨 KHUNG VĂN BẢN (EMBED) - THIẾT KẾ GIỐNG 100% ẢNH MẪU CỦA BẠN
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#2ecc71') // Thanh màu xanh lá dọc khung
            .setAuthor({ name: serverName, iconURL: guild.iconURL({ dynamic: true }) })
            .setDescription(
                `Chào mừng ${member} 🐧🐧🐧🐧🐧🐧🐧🐧 đã đến với **${serverName}**\n` +
                `chúc bạn vui vẻ trong server và 1 ngày tốt lành nhé\n\n` +
                `### **Cập nhật thông báo mới nhất của ${serverName} tại**\n\n` +
                `📢 <#${WELCOME_CONFIG.announcementChannelId}>\n\n` +
                `### **Xem qua những quy tắc của ${serverName} tại**\n\n` +
                `# <#${WELCOME_CONFIG.rulesChannelId}>\n\n` +
                `--------------------------------------------------\n` +
                `👤 **NGƯỜI MỜI:** ${inviterName}` // Ghi rõ chữ NGƯỜI MỜI và tag ở cuối văn bản
            )
            .setFooter({ text: `${serverName} | Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}` });

        try {
            const channelToSend = await guild.channels.fetch(WELCOME_CONFIG.welcomeChannelId).catch(() => null);
            if (channelToSend) {
                // ĐẦU VĂN BẢN: Báo tên người vào giống hệt app Mimu trong ảnh
                let topMessage = `Có thành viên **${member.user.username}** mới vào nè 🐱`;
                
                // Nếu là người cũ out ra vào lại, bot đổi lời thoại thông minh
                if (isOldMember) {
                    topMessage = `Thành viên cũ **${member.user.username}** vừa quay trở lại server!`;
                }

                await channelToSend.send({ 
                    content: topMessage, 
                    embeds: [welcomeEmbed] 
                });
            }
        } catch (error) {
            console.error('Không thể gửi khung chào mừng lên kênh chỉ định:', error.message);
        }
    }
});

// Giữ lại ID khi member thoát/bị kick khỏi server để làm dữ liệu chặn spam lượt mời
client.on('guildMemberRemove', (member) => {
    if (member.guild.id === MY_SERVER_ID) {
        historicalMembers.add(member.id);
    }
});

// Đăng nhập bot
client.login(TOKEN);

// =========================================================================
// 👋 KIỂM TRA SỰ KIỆN CHÀO MỪNG & LỌC TÀI KHOẢN CŨ QUAY LẠI (CHỐNG CRASH)
// =========================================================================
client.on('guildMemberAdd', async (member) => {
    // Bảo vệ 1: Nếu member hoặc guild không tồn tại thì bỏ qua ngay
    if (!member || !member.guild) return;
    
    const guild = member.guild;

    if (guild.id === MY_SERVER_ID) {
        // Cảnh báo nếu chưa dùng lệnh /set-welcome để cài đặt kênh
        if (!WELCOME_CONFIG.welcomeChannelId || !WELCOME_CONFIG.announcementChannelId || !WELCOME_CONFIG.rulesChannelId) {
            return console.log("⚠️ Hệ thống chưa được thiết lập đầy đủ 3 kênh bằng lệnh /set-welcome");
        }

        let inviterName = "Không rõ / Không xác định";
        let isOldMember = historicalMembers.has(member.id);

        try {
            const newInvites = await guild.invites.fetch().catch(() => null);
            
            if (newInvites) {
                // Tìm link mời vừa tăng số lần dùng
                const usedInvite = newInvites.find(inv => {
                    if (!inv || !inv.code) return false;
                    const cachedUses = invitesCache.get(inv.code);
                    const dynamicCached = cachedUses !== undefined ? cachedUses : 0;
                    return inv.uses > dynamicCached;
                });

                // Cập nhật lại bộ đếm của cache link mời an toàn
                newInvites.forEach(inv => {
                    if (inv && inv.code) invitesCache.set(inv.code, inv.uses);
                });

                // Chỉ lấy thông tin người mời nếu đây là tài khoản mới tinh
                if (!isOldMember && usedInvite && usedInvite.inviter) {
                    inviterName = `<@${usedInvite.inviter.id}>`; 
                }
            }
        } catch (err) {
            console.error('Lỗi phân tích link mời nhưng đã được chặn crash:', err.message);
        }

        // Đánh dấu lưu ID người này vào danh sách thành viên
        historicalMembers.add(member.id);

        const serverName = guild.name || "Server"; 

        // 🎨 KHUNG VĂN BẢN (EMBED)
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setAuthor({ name: serverName, iconURL: guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL() })
            .setDescription(
                `Chào mừng ${member} 🐧🐧🐧🐧🐧🐧🐧🐧 đã đến với **${serverName}**\n` +
                `chúc bạn vui vẻ trong server và 1 ngày tốt lành nhé\n\n` +
                `### **Cập nhật thông báo mới nhất của ${serverName} tại**\n\n` +
                `📢 <#${WELCOME_CONFIG.announcementChannelId}>\n\n` +
                `### **Xem qua những quy tắc của ${serverName} tại**\n\n` +
                `# <#${WELCOME_CONFIG.rulesChannelId}>\n\n` +
                `--------------------------------------------------\n` +
                `👤 **NGƯỜI MỜI:** ${inviterName}`
            )
            .setFooter({ text: `${serverName} | Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}` });

        try {
            const channelToSend = await guild.channels.fetch(WELCOME_CONFIG.welcomeChannelId).catch(() => null);
            if (channelToSend && channelToSend.isTextBased()) {
                let topMessage = `Có thành viên **${member.user?.username || "Thành viên"}** mới vào nè 🐱`;
                
                if (isOldMember) {
                    topMessage = `Thành viên cũ **${member.user?.username || "Thành viên"}** vừa quay trở lại server!`;
                }

                await channelToSend.send({ 
                    content: topMessage, 
                    embeds: [welcomeEmbed] 
                });
            } else {
                console.log("⚠️ Không tìm thấy kênh chào mừng hợp lệ hoặc bot không có quyền xem kênh.");
            }
        } catch (error) {
            console.error('Lỗi gửi tin nhắn chào mừng:', error.message);
        }
    }
});

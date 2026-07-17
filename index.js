const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Tạo khung giới thiệu và điều hướng thành viên')
        // Mục chọn 1: Chọn kênh để bot gửi Embed vào
        .addChannelOption(option => 
            option.setName('kenh_gui')
                .setDescription('Chọn kênh bot sẽ gửi bảng thông tin này vào')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        // Mục chọn 2: Chọn kênh thông báo để hiển thị trong văn bản
        .addChannelOption(option => 
            option.setName('kenh_thong_bao')
                .setDescription('Chọn kênh thông báo để hiển thị ở mục cập nhật')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        )
        // Mục chọn 3: Chọn kênh luật để hiển thị trong văn bản
        .addChannelOption(option => 
            option.setName('kenh_luat')
                .setDescription('Chọn kênh quy tắc/luật để hiển thị ở mục xem quy tắc')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    
    async execute(interaction) {
        // Lấy thông tin từ các mục chọn của người dùng
        const targetChannel = interaction.options.getChannel('kenh_gui');
        const announcementChannel = interaction.options.getChannel('kenh_thong_bao');
        const rulesChannel = interaction.options.getChannel('kenh_luat');

        try {
            // Khởi tạo Embed với thiết kế giống như trong ảnh của bạn
            const inviteEmbed = new EmbedBuilder()
                .setColor('#2ecc71') // Màu viền xanh lá (hoặc bạn có thể đổi mã màu hex tùy ý)
                .setAuthor({ 
                    name: 'Dolphin', 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) || null 
                })
                .setDescription(
                    `Chào mừng các thành viên đã đến với **Dolphin** 🐧🐧🐧\n` +
                    `Chúc các bạn vui vẻ trong server và có 1 ngày tốt lành nhé!\n\n` +
                    `### **Cập nhật thông báo mới nhất của Dolphin tại**\n` +
                    `📢 ${announcementChannel}\n\n` +
                    `### **Xem qua những quy tắc của Dolphin tại**\n` +
                    `📚 ${rulesChannel}`
                )
                .setFooter({ 
                    text: `Dolphin | Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` 
                });

            // Gửi khung Embed vào kênh được chọn ở mục 1
            await targetChannel.send({ embeds: [inviteEmbed] });

            // Phản hồi ẩn thông báo thành công cho người thực hiện lệnh
            await interaction.reply({ 
                content: `✅ Đã gửi bảng giới thiệu thành công vào kênh ${targetChannel}!`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ Đã xảy ra lỗi khi gửi Embed. Hãy chắc chắn rằng bot có quyền gửi tin nhắn và nhúng liên kết (Embed Links) trong kênh đó!', 
                ephemeral: true 
            });
        }
    },
};

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Lệnh bypass get key Delta sử dụng API PHP Riêng')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Nhập đường link Platorelay cần bẻ khóa')
                .setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Đang đăng ký lệnh...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Đăng ký lệnh thành công!');
    } catch (error) { console.error(error); }
})();

client.once('ready', () => {
    console.log(`Bot đã online: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bypass') {
        const url = interaction.options.getString('url');

        try {
            // Hoãn phản hồi để tránh lỗi "Ứng dụng không phản hồi" quá 3 giây của Discord
            await interaction.deferReply();

            const pendingEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⏳ Kết Nối API Riêng')
                .setDescription('Bot đang gửi yêu cầu giải mã qua máy chủ API PHP riêng của bạn, vui lòng đợi...');
            await interaction.editReply({ embeds: [pendingEmbed] });

            if (!url.includes('platorelay.com') && !url.includes('platoboost.com')) {
                const invalidEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Lỗi').setDescription('Đường link bạn nhập không thuộc hệ thống Get Key của Delta.');
                return await interaction.editReply({ embeds: [invalidEmbed] });
            }

            // KẾT NỐI ĐẾN ĐƯỜNG LINK API PHP RIÊNG CỦA BẠN VỪA TẠO
            const myPhpApiUrl = `https://free.nf{encodeURIComponent(url)}`;
            
            // Gửi request lấy dữ liệu với thời gian chờ tối đa 25 giây
            const response = await axios.get(myPhpApiUrl, { timeout: 25000 });
            const data = response.data;

            if (data && data.success) {
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Bypass Thành Công')
                    .setDescription(`🔑 **Key Delta thu thập từ API PHP của bạn:**\n\`\`\`text\n${data.result}\n\`\`\``)
                    .setFooter({ text: 'Vận hành bởi hệ thống API độc lập' });
                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const failEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Xử Lý Thất Bại')
                    .setDescription(data.message || 'Mã lỗi không xác định từ API PHP.');
                await interaction.editReply({ embeds: [failEmbed] });
            }

        } catch (error) {
            console.error('Lỗi kết nối API PHP:', error.message);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Sự Cố Máy Chủ API')
                .setDescription('Không thể kết nối đến máy chủ Web Host cá nhân hoặc API đang gặp lỗi hàng đợi.');
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

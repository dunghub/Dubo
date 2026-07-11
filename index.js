const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    EmbedBuilder
} = require('discord.js');

// Bot lấy Token từ môi trường Render
const BOT_TOKEN = process.env.TOKEN; 

if (!BOT_TOKEN) {
    console.error("LỖI: Bạn chưa cấu hình biến TOKEN trên Render!");
    process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Mảng chứa tên hiển thị VÀ đoạn code script thực tế của bạn
const scriptList = [
    { name: "gravity hub ☄️", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Dev-GravityHub/BloxFruit/refs/heads/main/Main.lua"))()` },
    { name: "TEDDY hub", code: `repeat task.wait() until game:IsLoaded() and game:GetService("Players") and game.Players.LocalPlayer and game.Players.LocalPlayer:FindFirstChild("PlayerGui")
loadstring(game:HttpGet("https://raw.githubusercontent.com/Teddyseetink/Haidepzai/refs/heads/main/TEDDYHUB-FREEMIUM"))()` },
    { name: "banana fake 🍌", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/tamdznanatv/bananapremium/refs/heads/main/nanaXbanana.luau"))()` },
    { name: "SELENE hub auto bounty M1 fruit", code: `repeat task.wait() until game:IsLoaded() and game:GetService("Players") and game.Players.LocalPlayer and game.Players.LocalPlayer:FindFirstChild("PlayerGui")
_G.SeleneCFG = {
    Team                          = "Pirates",
    Region                       = "",
    WebhookURL          = "",
    DiscordID                  = "",
    BulkAcc                    = false,
    FruitTarget               = "",
    SuperBoostFps       = false,
}
loadstring(game:HttpGet("https://raw.githubusercontent.com/Idontknowbrodontstalk/SELENE/refs/heads/main/M1Autobounty"))()` },
    { name: "Realkid hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/realkidhub/realkid/refs/heads/main/main.lua"))()` },
    { name: "DatThgVnV4", code: `loadstring(game:HttpGet("https://github.com/LuaCrack/DatThg/raw/refs/heads/main/DatThgVnV4"))()` },
    { name: "MeoX hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/VanHoangIOS/MeoXHub/refs/heads/main/Main.lua"))()` },
    { name: "Bacon hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/vinh129150/hack/refs/heads/main/BaconHub.lua"))()` },
    { name: "Orange hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/HieuDepTrai-Z/Dev_Orange/refs/heads/main/OrangeHub.lua"))()` },
    { name: "Real_AnhKhoaVn", code: `repeat wait() until game:IsLoaded() and game.Players.LocalPlayer
loadstring(game:HttpGet("https://raw.githubusercontent.com/NguyenAnhKhoaVN/Real_AnhKhoa_2279/refs/heads/main/Main-BloxFruitsNX.lua"))()` },
    { name: "BlueX hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Dev-BlueX/BlueX-Hub/refs/heads/main/Main.lua"))()` },
    { name: "NgocBongV2", code: `loadstring(game:HttpGet("https://github.com/LuaCrack/NgocBong/raw/refs/heads/main/NgocBongV2"))()` },
    { name: "redz", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/newredzv3/Scripts/refs/heads/main/main.luau"))(Settings)` },
    { name: "night hub hop sever", code: `loadstring(game:HttpGet("https://github.com/WhiteX1208/Scripts/blob/main/HopScript.luau?raw=true"))()` }
];

// Tự động đăng ký lệnh gõ /script với Discord
client.once('ready', async () => {
    console.log(`Bot Dubo script đã Online: ${client.user.tag}`);
    
    const commands = [
        new SlashCommandBuilder()
            .setName('script')
            .setDescription('Hiển thị bảng chọn Select script ẩn danh từ Dubo script')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Đồng bộ lệnh /script thành công!');
    } catch (error) {
        console.error('Lỗi đồng bộ lệnh:', error);
    }
});

// Xử lý khi người dùng tương tác trong Server
client.on('interactionCreate', async interaction => {
    
    // 1. Khi người dùng gõ lệnh /script
    if (interaction.isChatInputCommand() && interaction.commandName === 'script') {
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_script_menu')
            .setPlaceholder(`Select script | Page (1/1) 1-${scriptList.length}`) // Hiển thị Select script | Page (1/1) 1-15
            .setMinValues(1)
            .setMaxValues(1);

        // Đút 15 tên script vào mục chọn, lưu số thứ tự (0, 1, 2...) vào giá trị ẩn (value)
        scriptList.forEach((script, index) => {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(script.name)
                    .setDescription(`Bấm để lấy mã code của: ${script.name}`)
                    .setValue(index.toString()) 
            );
        });

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Hiện bảng chọn ở chế độ ẩn danh (Chỉ người gõ lệnh thấy)
        await interaction.reply({
            content: '**Select script | Page (1/1) 1-15**\nChọn ít nhất 1 mục bên dưới để nhận code:',
            components: [row],
            ephemeral: true 
        });
    }

    // 2. KHI NGƯỜI DÙNG BẤM CHỌN MỤC (QUAN TRỌNG NHẤT)
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_script_menu') {
        // Lấy số thứ tự mà người dùng vừa bấm
        const selectedIndex = parseInt(interaction.values[0]); 
        // Tìm ra đúng đoạn code script thực tế đi kèm với số thứ tự đó
        const chosenScript = scriptList[selectedIndex];

        if (!chosenScript) {
            return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu script!', ephemeral: true });
        }

        // Tạo khung tin nhắn Embed chứa ĐOẠN CODE THỰC TẾ (chosenScript.code) chứ không phải tên
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle(`🤖 Dubo script | Cấp mã nguồn thành công`)
            .addFields(
                { name: '📌 Tên Script:', value: `**${chosenScript.name}**` },
                { name: '💻 Đoạn Code (Hãy copy dán vào bản hack):', value: `\`\`\`lua\n${chosenScript.code}\n\`\`\`` }
            )
            .setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' })
            .setTimestamp();

        // Gửi ĐOẠN CODE này ra ở chế độ nói chuyện riêng (Chỉ người đó thấy)
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
});

client.login(BOT_TOKEN);

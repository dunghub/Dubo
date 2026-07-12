const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    ButtonBuilder, 
    ButtonStyle    
} = require('discord.js');
const http = require('http'); // Tự động import thư viện Web

// ==========================================
// TẠO SERVER WEB MINI ĐỂ GIỮ BOT ONLINE VĨNH VIỄN
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Dubo Script dang online lien tuc 24/7!\n');
}).listen(PORT, () => {
    console.log(`Web server dang chay tren port: ${PORT}`);
});
// ==========================================

// Bot lấy Token từ môi trường Render
const BOT_TOKEN = process.env.TOKEN; 

if (!BOT_TOKEN) {
    console.error("LỖI: Bạn chưa cấu hình biến TOKEN trên Render!");
    process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Mảng chứa tên hiển thị VÀ đoạn code script thực tế của bạn
const scriptList = [
    { name: "gravity hub ☄️", script: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Dev-GravityHub/BloxFruit/refs/heads/main/MainPremium.lua"))()` },
    { name: "TEDDY hub", code: `getgenv()["Config"] = {

    ["Fps Boost"] = true,

    ["FPS Cap"] = 120,

    ["Items"] = {

        ["Auto Fully Fighting Style"] = true,

        ["Skull Guitar"] = true,

        ["Cursed Dual Katana"] = true,

        ["Saber"] = true

    },

    ["Quests"] = {

        ["Mirage Puzzle"] = true,

        ["Upgrading Race"] = true,

    },

    ["Hopping"] = {

        ["Auto Hop"] = true,

        ["Hop Idle"] = true,

        ["High Ping Hop"] = false,

        ["Player Nearing Hop"] = false,

    },

    ["Sniper Fruit Shop"] = {

        ["Enabled"] = true,

        ["Fruit"] = {

            "Leopard-Leopard",

            "Kitsune-Kitsune",

            "Dragon-Dragon",

            "Yeti-Yeti",

            "Gas-Gas"

        },

    },

}

loadstring(game:HttpGet("https://raw.githubusercontent.com/Teddyseetink/diepvyzubu/refs/heads/main/TeddyHub-kaitunBF.lua"))()` },
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
    { name: "Real_AnhKhoaVn", code: `repeat wait() until game:IsLoaded() and game.Players.LocalPlayerloadstring(game:HttpGet("https://raw.githubusercontent.com/NguyenAnhKhoaVN/Real_AnhKhoa_2279/refs/heads/main/Main-BloxFruitsNX.lua"))()` },
    { name: "BlueX hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Dev-BlueX/BlueX-Hub/refs/heads/main/Main.lua"))()` },
    { name: "NgocBongV2", code: `loadstring(game:HttpGet("https://github.com/LuaCrack/NgocBong/raw/refs/heads/main/NgocBongV2"))()` },
    { name: "redz", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/newredzv3/Scripts/refs/heads/main/main.luau"))(Settings)` },
    { name: "night hub hop sever", code: `loadstring(game:HttpGet("https://github.com/WhiteX1208/Scripts/blob/main/HopScript.luau?raw=true"))()` },
    { name: "speedhub", code: `loadstring(game:HttpGet("https://rawscripts.net/raw/Universal-Script-Speed-Hub-x-29294"))()` },
    { name: "Xero hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Xero2409/XeroHub/refs/heads/main/main.lua"))()` },
    { name: "Quangtum", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/flazhy/QuantumOnyx/refs/heads/main/QuantumOnyx.lua"))()` },
    { name: "Omg hub", code: `loadstring(game:HttpGet("https://rawscripts.net/raw/Universal-Script-OMG-Hub-50194"))()` },
    { name: "W-azure", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/LuaAnarchist/YeuEmNhieuLam/refs/heads/main/w-azure.luau"))()` },
    { name: "Tay hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/VTDROBLOX/Animehub/refs/heads/main/Tayhub.lua"))()` }
];

// Tự động đăng ký lệnh gõ /script với Discord
client.once('ready', async () => {
    console.log(`Bot Dubo script va Web Server da Online: ${client.user.tag}`);
    
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
            .setPlaceholder(`Select script | Page (1/1) 1-${scriptList.length}`)
            .setMinValues(1)
            .setMaxValues(1);

        scriptList.forEach((script, index) => {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(script.name)
                    .setDescription(`Bấm để lấy mã code của: ${script.name}`)
                    .setValue(index.toString()) 
            );
        });

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: `**Select script | Page (1/1) 1-${scriptList.length}**\nChọn ít nhất 1 mục bên dưới để nhận code:`,
            components: [row],
            ephemeral: true 
        });
    }

    // 2. KHI NGƯỜI DÙNG BẤM CHỌN MỤC TRONG MENU
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_script_menu') {
        const selectedIndex = parseInt(interaction.values[0]); 
        const chosenScript = scriptList[selectedIndex];

        if (!chosenScript) {
            return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu script!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle(`🤖 Dubo script | Cấp mã nguồn thành công`)
            .addFields(
                { name: '📌 Tên Script:', value: `**${chosenScript.name}**` },
                { name: '💻 Đoạn Code (Hãy copy dán vào bản hack):', value: `\`\`\`lua\n${chosenScript.code}\n\`\`\`` }
            )
            .setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' })
            .setTimestamp();

        const copyButton = new ButtonBuilder()
            .setCustomId(`copy_script_${selectedIndex}`)
            .setLabel('📄 Copy Script')
            .setStyle(ButtonStyle.Success); 

        const buttonRow = new ActionRowBuilder().addComponents(copyButton);

        await interaction.reply({
            embeds: [embed],
            components: [buttonRow], 
            ephemeral: true
        });
    }

    // 3. XỬ LÝ KHI NGƯỜI DÙNG ẤN NÚT "COPY SCRIPT"
    if (interaction.isButton() && interaction.customId.startsWith('copy_script_')) {
        const selectedIndex = parseInt(interaction.customId.replace('copy_script_', ''));
        const chosenScript = scriptList[selectedIndex];

        if (!chosenScript) {
            return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu sao chép!', ephemeral: true });
        }

        await interaction.reply({
            content: `${chosenScript.code}`,
            ephemeral: true 
        });
    }
});

client.login(BOT_TOKEN);

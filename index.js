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

// =========================================================================
// CÁC MẢNG CHỨA SCRIPT ĐƯỢC TÁCH RIÊNG TỪNG NƠI THEO YÊU CẦU
// =========================================================================

// 1. Dữ liệu Blox Fruit (Giữ nguyên 20 script gốc - Có thể thêm dòng trống tùy thích)
const bloxfruitList = [
    { name: "gravity hub ☄️", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Dev-GravityHub/BloxFruit/refs/heads/main/MainPremium.lua"))()` },
    { name: "TEDDY hub", code: `getgenv()["Config"] = { ["Fps Boost"] = true, ["FPS Cap"] = 120, ["Items"] = { ["Auto Fully Fighting Style"] = true, ["Skull Guitar"] = true, ["Cursed Dual Katana"] = true, ["Saber"] = true }, ["Quests"] = { ["Mirage Puzzle"] = true, ["Upgrading Race"] = true, }, ["Hopping"] = { ["Auto Hop"] = true, ["Hop Idle"] = true, ["High Ping Hop"] = false, ["Player Nearing Hop"] = false, }, ["Sniper Fruit Shop"] = { ["Enabled"] = true, ["Fruit"] = { "Leopard-Leopard", "Kitsune-Kitsune", "Dragon-Dragon", "Yeti-Yeti", "Gas-Gas" }, }, } \nloadstring(game:HttpGet("https://raw.githubusercontent.com/Teddyseetink/diepvyzubu/refs/heads/main/TeddyHub-kaitunBF.lua"))()` },
    { name: "banana fake 🍌", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/tamdznanatv/bananapremium/refs/heads/main/nanaXbanana.luau"))()` },
    { name: "SELENE hub auto bounty M1 fruit", code: `repeat task.wait() until game:IsLoaded() and game:GetService("Players") and game.Players.LocalPlayer and game.Players.LocalPlayer:FindFirstChild("PlayerGui")\n_G.SeleneCFG = { Team = "Pirates", Region = "", WebhookURL = "", DiscordID = "", BulkAcc = false, FruitTarget = "", SuperBoostFps = false }\nloadstring(game:HttpGet("https://raw.githubusercontent.com/Idontknowbrodontstalk/SELENE/refs/heads/main/M1Autobounty"))()` },
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

// 2. Dữ liệu Gag2 (Đã có sẵn 10 mục trống riêng lẻ)
const gag2List = [
    { name: "Mauscripts", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/nootmaus/GrowAAGarden/refs/heads/main/mauscripts"))()` },
    { name: "Airflow", code: `loadstring(game:HttpGet("https://airflowscript.com/loader"))()` },
    { name: "ZYSUME", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/ZYSUME/EliteVault/refs/heads/main/Loader.Lua"))()` },
    { name: "Newgag2", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/defaulttinowss/newgag2/refs/heads/main/op"))()` },
    { name: "NOX-ZUHILL", code: `loadstring(game:HttpGet('https://raw.githubusercontent.com/NOX-ZUHILL/NOX-/refs/heads/main/NOX%20loader.lua'))()` },
    { name: "JakesHub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/jakeeypoop-max/JakesHub/refs/heads/main/Loader.lua"))()` },
    { name: "nolag hub", code: `loadstring(game:HttpGet("https://rawscripts.net/raw/Grow-a-Garden-NoLag-Hub-no-key-38699"))()` },
    { name: "Than hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/thantzy/thanhub/refs/heads/main/thanv1"))()` },
    { name: "Mozi hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/MoziIOnTop/MoziIHub/refs/heads/main/GrowaGarden"))()` },
    { name: "HydroStreamz hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Hydrostreamz-hubs/-GAG-Spawner/refs/heads/main/Hydrostreamz"))()` },
    { name: "Limit hub", code: `loadstring(game:HttpGet(('https://raw.githubusercontent.com/FakeModz/LimitHub/refs/heads/main/LimitHub_Luarmor_E.lua')))()` },
    { name: "Gumanba", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/gumanba/Scripts/main/GrowaGarden"))()` },
    { name: "Nebula", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Nebula-xyzs/GAG/refs/heads/main/GrowAGardenXE"))()` },
    { name: "Kenniel", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Kenniel123/Grow-a-garden/refs/heads/main/Grow%20A%20Garden"))()` },
    { name: "Polluted", code: `loadstring(game:HttpGet("https://api.luarmor.net/files/v4/loaders/e8580ba6e94aeaa7aa2486f060167f85.lua"))()` },
    { name: "JN HH Gaming", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/JNHHGaming/Grow-a-garden-script/refs/heads/main/JN%20HH%20Gaming",true))()` },
    { name: "EliteVault", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/ZYSUME/EliteVault/refs/heads/main/Loader.Lua"))()` },
    { name: "Chiyo", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/kaisenlmao/loader/refs/heads/main/chiyo.lua"))()` },
    { name: "OP", code: `loadstring(game:HttpGet("https://pastefy.app/dRiqJxzW/raw"))()` },
    { name: "GLua XYZ ", code: `loadstring(game:HttpGet("https://api.glua.xyz/loader"))()` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` }
];

// 3. Dữ liệu 99 Night (Đã có sẵn 10 mục trống riêng lẻ)
const night99List = [
    { name: "Keyless", code: `loadstring(game:HttpGet("https://pastebin.com/raw/LPbPPNpC"))()` },
    { name: "NTT hub", code: `loadstring(game:HttpGet('https://ntt-hub.xyz/api/repo?id1=main&id2=lua'))()` },
    { name: "Halloween 🎃", code: `loadstring(game:HttpGet("https://pastebin.com/raw/husyDTrd"))()` },
    { name: "Cps hub 🌐", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Rx1m/CpsHub/refs/heads/main/Hub",true))()` },
    { name: "ToastyXD", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/nouralddin-abdullah/ToastyHub-XD/refs/heads/main/hub-main.lua"))()` },
    { name: "Infinite Candy 🍬", code: `` },
    { name: "", code: `_G.Auto = true --true or false

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Event = ReplicatedStorage.RemoteEvents.CarnivalCompleteShootingGallery

local function findTargets(parent, depth)
    if depth > 3 then return {} end
    
    local targets = {}
    
    for _, child in ipairs(parent:GetChildren()) do
        if child:IsA("BasePart") then
            table.insert(targets, child)
        end
        
        for _, subTarget in ipairs(findTargets(child, depth + 1)) do
            table.insert(targets, subTarget)
        end
    end
    
    return targets
end

spawn(function()
    while task.wait(3) do
    
        local targets = {}
        local areas = {
            workspace.Map,
            workspace.Items, 
            workspace.Characters
        }
        
        for _, area in ipairs(areas) do
            for _, target in ipairs(findTargets(area, 0)) do
                table.insert(targets, target)
            end
        end
        
        for index, target in ipairs(targets) do
            if not _G.Auto then break end
            
            local success = pcall(function()
                Event:FireServer(target)
            end)
            task.wait(0.05)
        end
    end
end)` },
    { name: "Tycoon US", code: `loadstring(game:HttpGet("https://pastebin.com/raw/K9b3Fd7Z"))()` },
    { name: "Elude hub 🫥", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/DarkenedEssence/Elude/refs/heads/main/Loader.lua"))()` },
    { name: "Combo Wick", code: `loadstring(game:HttpGet("https://cdn.authguard.org/virtual-file/4cc9b982299840008b7d08796f54aaea"))()` },
    { name: "Speed Hub X ⚡️", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/AhmadV99/Speed-Hub-X/main/Speed%20Hub%20X.lua", true))()` },
    { name: "Voidware 🕳️", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/kasumichwan/scripts/refs/heads/main/kasumi-hub.lua"))()` },
    { name: "October", code: `loadstring(game:HttpGet("https://pastebin.com/raw/YgRSs7Pf"))()` },
    { name: "Vortex hub", code: `loadstring(game:HttpGet("https://pastefy.app/qxDbSVlo/raw"))()` },
    { name: "Horizon hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Laspard69/HorizonHub/refs/heads/main/loader.lua", true))()` },
    { name: "Vex OP", code: `loadstring(game:HttpGet("https://pastefy.app/ibClJUjE/raw"))()` },
    { name: "Moon hub 🌑", code: `loadstring(game:HttpGet("https://pastebin.com/raw/bhi4LinA"))()` },
    { name: "Nazuro", code: `loadstring(game:HttpGet("https://nazuro.xyz/99nights"))()` },
    { name: "DarkEsc", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/DarkenedEssence/DarkEsc/refs/heads/main/Loader.lua"))()` },
    { name: "PhantomFlux", code: `loadstring(game:HttpGet('https://raw.githubusercontent.com/sudaisontopxd/PhantomFlux/refs/heads/main/99NightsInTheForest', true))()` },
    { name: "Universal", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/adibhub1/99-nighit-in-forest/refs/heads/main/99%20night%20in%20forest", true))()` },
    { name: "Kenniel", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Kenniel123/99-Nights-in-the-Forest/refs/heads/main/99%20Nights%20in%20the%20Forest"))()` },
    { name: "Gec hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/NTpCMwn8"))()` },
    { name: "Foxxname", code: `loadstring(game:HttpGet("https://pastebin.com/raw/7hfV4s5s"))()` },
    { name: "Polleser hub", code: `loadstring(game:HttpGet("https://pastefy.app/Y4ic4T1s/raw"))()` },
    { name: "Kaito hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/xBK0EXUX"))()` },
    { name: "OverFlow", code: `loadstring(game:HttpGet("https://pastebin.com/raw/3T1VunNZ"))()` },
    { name: "Strawberry Cat hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/sQ6t8MU7"))()` },
    { name: "Foggy hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/5rwbL0v9"))()` },
    { name: "AnbuWin", code: `loadstring(game:HttpGet("https://pastebin.com/raw/quQbccDD"))()` },
    { name: "Alchemy hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/FmDrhT3m"))()` },
    { name: "Nagi hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/hehehe9028/Nagi-hub-99/refs/heads/main/Nagi%20hub%2099%20nights%20in%20the%20forest"))()` }
];

// 4. Dữ liệu Sailor Piece (Đã có sẵn 10 mục trống riêng lẻ)
const sailorList = [
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
];


// Tự động đăng ký 4 lệnh Slash Command mới với Discord
client.once('ready', async () => {
    console.log(`Bot Dubo script va Web Server da Online: ${client.user.tag}`);
    
    const commands = [
        new SlashCommandBuilder().setName('script-bloxfruit').setDescription('Hiển thị bảng chọn script Blox Fruit ẩn danh'),
        new SlashCommandBuilder().setName('script-gag2').setDescription('Hiển thị bảng chọn script GAG2 ẩn danh'),
        new SlashCommandBuilder().setName('script-99night').setDescription('Hiển thị bảng chọn script 99 Night ẩn danh'),
        new SlashCommandBuilder().setName('script-sailorpice').setDescription('Hiển thị bảng chọn script Sailor Piece ẩn danh')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Đồng bộ 4 lệnh script thành công!');
    } catch (error) {
        console.error('Lỗi đồng bộ lệnh:', error);
    }
});

// Xử lý các tương tác của người dùng
client.on('interactionCreate', async interaction => {
    
    // ---------------------------------------------------------------------
    // XỬ LÝ LỆNH /SCRIPT-BLOXFRUIT (ĐÃ THÊM CƠ CHẾ LỌC DÒNG TRỐNG)
    // ---------------------------------------------------------------------
    if (interaction.isChatInputCommand() && interaction.commandName === 'script-bloxfruit') {
        const validList = bloxfruitList.filter(s => s.name !== "");
        if (validList.length === 0) return interaction.reply({ content: 'Hiện tại chưa có script nào được cấu hình cho Blox Fruit!', ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('menu_bloxfruit')
            .setPlaceholder(`Select script | 1-${validList.length}`)
            .setMinValues(1).setMaxValues(1);

        validList.forEach((script, index) => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        });

        await interaction.reply({
            content: `**Select script | Blox Fruit (1-${validList.length})**\nChọn mục bên dưới để nhận code:`,
            components: [new ActionRowBuilder().addComponents(selectMenu)],
            ephemeral: true 
        });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_bloxfruit') {
        const validList = bloxfruitList.filter(s => s.name !== "");
        const selectedIndex = parseInt(interaction.values[0]); 
        const chosenScript = validList[selectedIndex];
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu script!', ephemeral: true });

        const embed = new EmbedBuilder().setColor('#00ffcc').setTitle(`🤖 Dubo script | Cấp mã Blox Fruit thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code (Hãy copy dán vào bản hack):', value: `\`\`\`lua\n${chosenScript.code}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`copy_bf_${selectedIndex}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success); 

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith('copy_bf_')) {
        const validList = bloxfruitList.filter(s => s.name !== "");
        const selectedIndex = parseInt(interaction.customId.replace('copy_bf_', ''));
        await interaction.reply({ content: `${validList[selectedIndex].code}`, ephemeral: true });
    }

    // ---------------------------------------------------------------------
    // XỬ LÝ LỆNH /SCRIPT-GAG2
    // ---------------------------------------------------------------------
    if (interaction.isChatInputCommand() && interaction.commandName === 'script-gag2') {
        const validList = gag2List.filter(s => s.name !== "");
        if (validList.length === 0) return interaction.reply({ content: 'Hiện tại chưa có script nào được cấu hình cho GAG2!', ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('menu_gag2').setPlaceholder(`Select script | 1-${validList.length}`).setMinValues(1).setMaxValues(1);
        validList.forEach((script, index) => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        });

        await interaction.reply({
            content: `**Select script | GAG2 (1-${validList.length})**\nChọn ít nhất 1 mục bên dưới để nhận code:`,
            components: [new ActionRowBuilder().addComponents(selectMenu)],
            ephemeral: true 
        });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_gag2') {
        const validList = gag2List.filter(s => s.name !== "");
        const selectedIndex = parseInt(interaction.values[0]); 
        const chosenScript = validList[selectedIndex];

        const embed = new EmbedBuilder().setColor('#ff9900').setTitle(`🤖 Dubo script | Cấp mã nguồn thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code (Hãy copy dán vào bản hack):', value: `\`\`\`lua\n${chosenScript.code}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`copy_gag2_${selectedIndex}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success); 

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith('copy_gag2_')) {
        const validList = gag2List.filter(s => s.name !== "");
        const selectedIndex = parseInt(interaction.customId.replace('copy_gag2_', ''));
        await interaction.reply({ content: `${validList[selectedIndex].code}`, ephemeral: true });
    }

    // ---------------------------------------------------------------------
    // XỬ LÝ LỆNH /SCRIPT-99NIGHT
    // ---------------------------------------------------------------------
    if (interaction.isChatInputCommand() && interaction.commandName === 'script-99night') {
        const validList = night99List.filter(s => s.name !== "");
        if (validList.length === 0) return interaction.reply({ content: 'Hiện tại chưa có script nào được cấu hình cho 99 Night!', ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('menu_99night').setPlaceholder(`Select script | 1-${validList.length}`).setMinValues(1).setMaxValues(1);
        validList.forEach((script, index) => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        });

        await interaction.reply({
            content: `**Select script | 99 Night (1-${validList.length})**\nChọn ít nhất 1 mục bên dưới để nhận code:`,
            components: [new ActionRowBuilder().addComponents(selectMenu)],
            ephemeral: true 
        });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_99night') {
        const validList = night99List.filter(s => s.name !== "");
        const selectedIndex = parseInt(interaction.values[0]); 
        const chosenScript = validList[selectedIndex];

        const embed = new EmbedBuilder().setColor('#ff0055').setTitle(`🤖 Dubo script | Cấp mã nguồn thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code (Hãy copy dán vào bản hack):', value: `\`\`\`lua\n${chosenScript.code}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`copy_99night_${selectedIndex}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success); 

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith('copy_99night_')) {
        const validList = night99List.filter(s => s.name !== "");
        const selectedIndex = parseInt(interaction.customId.replace('copy_99night_', ''));
        await interaction.reply({ content: `${validList[selectedIndex].code}`, ephemeral: true });
    }

    // ---------------------------------------------------------------------
    // XỬ LÝ LỆNH /SCRIPT-SAILORPICE
    // ---------------------------------------------------------------------
    if (interaction.isChatInputCommand() && interaction.commandName === 'script-sailorpice') {
        const validList = sailorList.filter(s => s.name !== "");
        if (validList.length === 0) return interaction.reply({ content: 'Hiện tại chưa có script nào được cấu hình cho Sailor Piece!', ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('menu_sailor').setPlaceholder(`Select script | 1-${validList.length}`).setMinValues(1).setMaxValues(1);
        validList.forEach((script, index) => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        });

        await interaction.reply({
            content: `**Select script | Sailor Piece (1-${validList.length})**\nChọn ít nhất 1 mục bên dưới để nhận code:`,
            components: [new ActionRowBuilder().addComponents(selectMenu)],
            ephemeral: true 
        });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_sailor') {
        const validList = sailorList.filter(s => s.name !== "");
        const selectedIndex = parseInt(interaction.values[0]); 
        const chosenScript = validList[selectedIndex];

        const embed = new EmbedBuilder().setColor('#0099ff').setTitle(`🤖 Dubo script | Cấp mã nguồn thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code (Hãy copy dán vào bản hack):', value: `\`\`\`lua\n${chosenScript.code}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`copy_sailor_${selectedIndex}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success); 

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith('copy_sailor_')) {
        const validList = sailorList.filter(s => s.name !== "");
        const selectedIndex = parseInt(interaction.customId.replace('copy_sailor_', ''));
        await interaction.reply({ content: `${validList[selectedIndex].code}`, ephemeral: true });
    }
});

client.login(BOT_TOKEN);

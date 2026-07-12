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

// 2. Dữ liệu Gag2
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

// 3. Dữ liệu 99 Night
const night99List = [
    { name: "Keyless", code: `loadstring(game:HttpGet("https://pastebin.com/raw/LPbPPNpC"))()` },
    { name: "NTT hub", code: `loadstring(game:HttpGet('https://ntt-hub.xyz/api/repo?id1=main&id2=lua'))()` },
    { name: "Halloween 🎃", code: `loadstring(game:HttpGet("https://pastebin.com/raw/husyDTrd"))()` },
    { name: "Cps hub 🌐", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Rx1m/CpsHub/refs/heads/main/Hub",true))()` },
    { name: "ToastyXD", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/nouralddin-abdullah/ToastyHub-XD/refs/heads/main/hub-main.lua"))()` },
    { name: "Infinite Candy 🍬", code: `` },
    { name: "Auto Gallery", code: `_G.Auto = true --true or false\n\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\nlocal Event = ReplicatedStorage.RemoteEvents.CarnivalCompleteShootingGallery\n\nlocal function findTargets(parent, depth)\n    if depth > 3 then return {} end\n    local targets = {}\n    for _, child in ipairs(parent:GetChildren()) do\n        if child:IsA("BasePart") then table.insert(targets, child) end\n        for _, subTarget in ipairs(findTargets(child, depth + 1)) do table.insert(targets, subTarget) end\n    end\n    return targets\nend\n\nspawn(function()\n    while task.wait(3) do\n        local targets = {}\n        local areas = {workspace.Map, workspace.Items, workspace.Characters}\n        for _, area in ipairs(areas) do\n            for _, target in ipairs(findTargets(area, 0)) do table.insert(targets, target) end\n        end\n        for index, target in ipairs(targets) do\n            if not _G.Auto then break end\n            pcall(function() Event:FireServer(target) end)\n            task.wait(0.05)\n        end\n    end\nend)` },
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

// 4. Dữ liệu Sailor Piece
const sailorList = [
    { name: "Ajjans hub", code: `loadstring(game:HttpGet(“https://api.luarmor.net/files/v4/loaders/3fcb385d3c782d11837cb680ae2a3ea4.lua”))()` },
    { name: "Polluted hub", code: `loadstring(game:HttpGet(“https://api.luarmor.net/files/v4/loaders/b1f30331e1af9ab6e96fc80cd00b20a9.lua”))()` },
    { name: "Copernix hub", code: `loadstring(game:HttpGet(“https://gitlab.com/phantomreal1/CopernixHub/-/raw/main/api.lua?ref_type=heads”))()` },
    { name: "Axel hub", code: `loadstring(game:HttpGet(“https://raw.githubusercontent.com/lostinnowheres/Loader/refs/heads/main/Loader.Lua”))()` },
    { name: "Hybrid hub", code: `loadstring(game:HttpGet(“https://raw.githubusercontent.com/HybridE3/HybridE3/refs/heads/main/Sailor%20Piece”))()` },
    { name: "Lume hub", code: `loadstring(game:HttpGet(“https://raw.githubusercontent.com/dusadeephenginx-sudo/roblox/main/uploads/sailor.lua”))()` },
    { name: "Zypheron hub", code: `loadstring(game:HttpGet(“https://pastebin.com/raw/M6NtAd4N”, true))()` },
    { name: "RC hub", code: `loadstring(game:HttpGet(“https://vss.pandadevelopment.net/virtual/file/2768ea6419cb4d73”))()` },
    { name: "BenJaMinZ hub", code: `loadstring(game:HttpGet(“https://raw.githubusercontent.com/BenJaMinZHub/Loader/refs/heads/main/GetKeyAllGame.lua”))()` },
    { name: "Sindex hub", code: `loadstring(game:HttpGet(“https://raw.githubusercontent.com/Sindex-Saliii/TrigonEvoHub/refs/heads/main/Main.luau”))()` },
    { name: "Axel hub", code: `loadstring(game:HttpGet((‘https://pastebin.com/raw/dwuNab5c’)))()` },
    { name: "Lucid", code: `loadstring(game:HttpGet(“https://raw.githubusercontent.com/OhhMyGehlee/sh/refs/heads/main/a”))()` },
    { name: "Express hub", code: `loadstring(game:HttpGet(“https://raw.githubusercontent.com/Bliqe/Upload/refs/heads/main/Games/SP/Express.lua”))()` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
    { name: "", code: `` },
];

// Tự động đăng ký 4 lệnh Slash Command với Discord
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

// Hàm hỗ trợ tìm script an toàn dựa trên vị trí hiển thị (Index thực tế trên menu)
function getScriptByIndex(list, selectValue) {
    const validList = list.filter(s => s.name && s.name.trim() !== "");
    const idx = parseInt(selectValue);
    return validList[idx] || null;
}

// Xử lý các tương tác của người dùng
client.on('interactionCreate', async interaction => {
    
    // ==========================================
    // XỬ LÝ LỆNH /SCRIPT-BLOXFRUIT
    // ==========================================
    if (interaction.isChatInputCommand() && interaction.commandName === 'script-bloxfruit') {
        const validList = bloxfruitList.filter(s => s.name && s.name.trim() !== "");
        if (validList.length === 0) return interaction.reply({ content: 'Hiện tại chưa có script nào được cấu hình cho Blox Fruit!', ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('menu_bloxfruit').setPlaceholder(`Select script | 1-${validList.length}`).setMinValues(1).setMaxValues(1);
        validList.forEach((script, index) => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        });

        await interaction.reply({ content: `**Select script | Blox Fruit (1-${validList.length})**\nChọn mục bên dưới để nhận code:`, components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_bloxfruit') {
        const chosenScript = getScriptByIndex(bloxfruitList, interaction.values[0]);
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu script!', ephemeral: true });

        const embed = new EmbedBuilder().setColor('#00ffcc').setTitle(`🤖 Dubo script | Cấp mã Blox Fruit thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code:', value: `\`\`\`lua\n${chosenScript.code || "-- Trống"}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        // Nút bấm lưu tên script vào customId để tránh lệch index
        const copyButton = new ButtonBuilder().setCustomId(`copy_bf_${interaction.values[0]}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success); 

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith('copy_bf_')) {
        const idxStr = interaction.customId.replace('copy_bf_', '');
        const chosenScript = getScriptByIndex(bloxfruitList, idxStr);
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu sao chép!', ephemeral: true });
        await interaction.reply({ content: `${chosenScript.code || "-- Trống"}`, ephemeral: true });
    }

    // ==========================================
    // XỬ LÝ LỆNH /SCRIPT-GAG2
    // ==========================================
    if (interaction.isChatInputCommand() && interaction.commandName === 'script-gag2') {
        const validList = gag2List.filter(s => s.name && s.name.trim() !== "");
        if (validList.length === 0) return interaction.reply({ content: 'Hiện tại chưa có script nào được cấu hình cho GAG2!', ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('menu_gag2').setPlaceholder(`Select script | 1-${validList.length}`).setMinValues(1).setMaxValues(1);
        validList.forEach((script, index) => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        });

        await interaction.reply({ content: `**Select script | GAG2 (1-${validList.length})**\nChọn mục bên dưới để nhận code:`, components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_gag2') {
        const chosenScript = getScriptByIndex(gag2List, interaction.values[0]);
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu script!', ephemeral: true });

        const embed = new EmbedBuilder().setColor('#ff9900').setTitle(`🤖 Dubo script | Cấp mã GAG2 thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code:', value: `\`\`\`lua\n${chosenScript.code || "-- Trống"}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`copy_gag2_${interaction.values[0]}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success); 

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith('copy_gag2_')) {
        const idxStr = interaction.customId.replace('copy_gag2_', '');
        const chosenScript = getScriptByIndex(gag2List, idxStr);
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu sao chép!', ephemeral: true });
        await interaction.reply({ content: `${chosenScript.code || "-- Trống"}`, ephemeral: true });
    }

    // ==========================================
    // XỬ LÝ LỆNH /SCRIPT-99NIGHT
    // ==========================================
    if (interaction.isChatInputCommand() && interaction.commandName === 'script-99night') {
        const validList = night99List.filter(s => s.name && s.name.trim() !== "");
        if (validList.length === 0) return interaction.reply({ content: 'Hiện tại chưa có script nào được cấu hình cho 99 Night!', ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('menu_99night').setPlaceholder(`Select script | 1-${validList.length}`).setMinValues(1).setMaxValues(1);
        validList.forEach((script, index) => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        });

        await interaction.reply({ content: `**Select script | 99 Night (1-${validList.length})**\nChọn mục bên dưới để nhận code:`, components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_99night') {
        const chosenScript = getScriptByIndex(night99List, interaction.values[0]);
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu script!', ephemeral: true });

        const embed = new EmbedBuilder().setColor('#ff0055').setTitle(`🤖 Dubo script | Cấp mã 99 Night thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code:', value: `\`\`\`lua\n${chosenScript.code || "-- Trống"}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`copy_99night_${interaction.values[0]}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success); 

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith('copy_99night_')) {
        const idxStr = interaction.customId.replace('copy_99night_', '');
        const chosenScript = getScriptByIndex(night99List, idxStr);
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu sao chép!', ephemeral: true });
        await interaction.reply({ content: `${chosenScript.code || "-- Trống"}`, ephemeral: true });
    }

    // ==========================================
    // XỬ LÝ LỆNH /SCRIPT-SAILORPICE
    // ==========================================
    if (interaction.isChatInputCommand() && interaction.commandName === 'script-sailorpice') {
        const validList = sailorList.filter(s => s.name && s.name.trim() !== "");
        if (validList.length === 0) return interaction.reply({ content: 'Hiện tại chưa có script nào được cấu hình cho Sailor Piece!', ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('menu_sailor').setPlaceholder(`Select script | 1-${validList.length}`).setMinValues(1).setMaxValues(1);
        validList.forEach((script, index) => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        });

        await interaction.reply({ content: `**Select script | Sailor Piece (1-${validList.length})**\nChọn mục bên dưới để nhận code:`, components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_sailor') {
        const chosenScript = getScriptByIndex(sailorList, interaction.values[0]);
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu script!', ephemeral: true });

        const embed = new EmbedBuilder().setColor('#0099ff').setTitle(`🤖 Dubo script | Cấp mã Sailor Piece thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code:', value: `\`\`\`lua\n${chosenScript.code || "-- Trống"}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`copy_sailor_${interaction.values[0]}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success); 

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith('copy_sailor_')) {
        const idxStr = interaction.customId.replace('copy_sailor_', '');
        const chosenScript = getScriptByIndex(sailorList, idxStr);
        if (!chosenScript) return interaction.reply({ content: 'Lỗi: Không tìm thấy dữ liệu sao chép!', ephemeral: true });
        await interaction.reply({ content: `${chosenScript.code || "-- Trống"}`, ephemeral: true });
    }
});

client.login(BOT_TOKEN);

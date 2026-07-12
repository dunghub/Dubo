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
const http = require('http');

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

const BOT_TOKEN = process.env.TOKEN; 

if (!BOT_TOKEN) {
    console.error("LỖI: Bạn chưa cấu hình biến TOKEN trên Render!");
    process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// =========================================================================
// DATA SCRIPTS (ĐÃ ĐƯỢC CHUẨN HÓA DẤU NGOẶC)
// =========================================================================

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
    { name: "Tay hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/VTDROBLOX/Animehub/refs/heads/main/Tayhub.lua"))()` },
    { name: "Turbo hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/TurboLite/Script/refs/heads/main/MainV2.lua"))()` },
    { name: "Hermanos", code: `local script_mode = "PVP" -- PVP, FARMlocal loader = loadstringlocal url = "https://raw.githubusercontent.com/hermanos-dev/hermanos-hub/refs/heads/main/Loader.lua"local response = game:HttpGet(url)loader(response)()` },
];

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
    { name: "GLua XYZ ", code: `loadstring(game:HttpGet("https://api.glua.xyz/loader"))()` }
];

const night99List = [
    { name: "Keyless", code: `loadstring(game:HttpGet("https://pastebin.com/raw/LPbPPNpC"))()` },
    { name: "NTT hub", code: `loadstring(game:HttpGet('https://ntt-hub.xyz/api/repo?id1=main&id2=lua'))()` },
    { name: "Halloween 🎃", code: `loadstring(game:HttpGet("https://pastebin.com/raw/husyDTrd"))()` },
    { name: "Cps hub 🌐", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Rx1m/CpsHub/refs/heads/main/Hub",true))()` },
    { name: "ToastyXD", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/nouralddin-abdullah/ToastyHub-XD/refs/heads/main/hub-main.lua"))()` },
    { name: "Auto Gallery", code: `_G.Auto = true\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\nlocal Event = ReplicatedStorage.RemoteEvents.CarnivalCompleteShootingGallery\nlocal function findTargets(parent, depth)\n if depth > 3 then return {} end\n local targets = {}\n for _, child in ipairs(parent:GetChildren()) do\n if child:IsA("BasePart") then table.insert(targets, child) end\n for _, subTarget in ipairs(findTargets(child, depth + 1)) do table.insert(targets, subTarget) end\n end\n return targets\nend\nspawn(function()\n while task.wait(3) do\n local targets = {}\n local areas = {workspace.Map, workspace.Items, workspace.Characters}\n for _, area in ipairs(areas) do\n for _, target in ipairs(findTargets(area, 0)) do table.insert(targets, target) end\n end\n for index, target in ipairs(targets) do\n if not _G.Auto then break end\n pcall(function() Event:FireServer(target) end)\n task.wait(0.05)\n end\n end\nend)` },
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

const sailorList = [
    { name: "Ajjans hub", code: `loadstring(game:HttpGet("https://api.luarmor.net/files/v4/loaders/3fcb385d3c782d11837cb680ae2a3ea4.lua"))()` },
    { name: "Polluted hub", code: `loadstring(game:HttpGet("https://api.luarmor.net/files/v4/loaders/b1f30331e1af9ab6e96fc80cd00b20a9.lua"))()` },
    { name: "Copernix hub", code: `loadstring(game:HttpGet("https://gitlab.com/phantomreal1/CopernixHub/-/raw/main/api.lua?ref_type=heads"))()` },
    { name: "Axel hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/lostinnowheres/Loader/refs/heads/main/Loader.Lua"))()` },
    { name: "Hybrid hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/HybridE3/HybridE3/refs/heads/main/Sailor%20Piece"))()` },
    { name: "Lume hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/dusadeephenginx-sudo/roblox/main/uploads/sailor.lua"))()` },
    { name: "Zypheron hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/M6NtAd4N", true))()` },
    { name: "RC hub", code: `loadstring(game:HttpGet("https://vss.pandadevelopment.net/virtual/file/2768ea6419cb4d73"))()` },
    { name: "BenJaMinZ hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/BenJaMinZHub/Loader/refs/heads/main/GetKeyAllGame.lua"))()` },
    { name: "Sindex hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Sindex-Saliii/TrigonEvoHub/refs/heads/main/Main.luau"))()` },
    { name: "Axel hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/dwuNab5c"))()` },
    { name: "Lucid", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/OhhMyGehlee/sh/refs/heads/main/a"))()` },
    { name: "Express hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Bliqe/Upload/refs/heads/main/Games/SP/Express.lua"))()` }
];

// ==========================================
// KHO SCRIPT MỚI (MỖI KHO 20 DÒNG MẪU ĐỂ TRỐNG)
// ==========================================
const gagList = [
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }
];

const forsakenList = [
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }
];

const stealBrainrotList = [
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }
];

const murderMysteryList = [
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }
];

// Thêm kho cho game Fisch mới yêu cầu
const fischList = [
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` },
    { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }, { name: "", code: `` }
];

// =========================================================================
// ĐỒNG BỘ SLASH COMMANDS (LỆNH /HELP LUÔN NẰM ĐẦU)
// =========================================================================
client.once('ready', async () => {
    console.log(`Bot Dubo script va Web Server da Online: ${client.user.tag}`);
    
    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('Hiển thị hướng dẫn sử dụng bot bằng tiếng Việt và Anh'),
        new SlashCommandBuilder().setName('script-bloxfruit').setDescription('Hiển thị bảng chọn script Blox Fruit ẩn danh'),
        new SlashCommandBuilder().setName('script-gag2').setDescription('Hiển thị bảng chọn script GAG2 ẩn danh'),
        new SlashCommandBuilder().setName('script-99night').setDescription('Hiển thị bảng chọn script 99 Night ẩn danh'),
        new SlashCommandBuilder().setName('script-sailorpice').setDescription('Hiển thị bảng chọn script Sailor Piece ẩn danh'),
        new SlashCommandBuilder().setName('script-gag').setDescription('Hiển thị bảng chọn script GAG ẩn danh'),
        new SlashCommandBuilder().setName('script-forsaken').setDescription('Hiển thị bảng chọn script Forsaken ẩn danh'),
        new SlashCommandBuilder().setName('script-steal-a-brainrot').setDescription('Hiển thị bảng chọn script Steal a Brainrot ẩn danh'),
        new SlashCommandBuilder().setName('script-murder-mystery-2').setDescription('Hiển thị bảng chọn script Murder Mystery 2 ẩn danh'),
        // Thêm đăng ký Slash Command mới cho Fisch
        new SlashCommandBuilder().setName('script-fisch').setDescription('Hiển thị bảng chọn script Fisch ẩn danh')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Đồng bộ các lệnh slash command thành công!');
    } catch (error) {
        console.error('Lỗi đồng bộ lệnh:', error);
    }
});

// Hàm hỗ trợ tìm script an toàn
function getScriptByIndex(list, selectValue) {
    const validList = list.filter(s => s.name && s.name.trim() !== "");
    const idx = parseInt(selectValue);
    return validList[idx] || null;
}

// =========================================================================
// XỬ LÝ SỰ KIỆN (INTERACTION)
// =========================================================================
client.on('interactionCreate', async interaction => {
    
    // --- XỬ LÝ SLASH COMMANDS ---
    if (interaction.isChatInputCommand()) {
        
        // Xử lý riêng lệnh /help (Đặt lên đầu)
        if (interaction.commandName === 'help') {
            const helpMessage = 
                `**VN:** Chọn một kho kịch bản của 1 trò chơi mà bạn yêu thích, chọn kịch bản trong danh sách mà bạn muốn và nhấn coppy ở dưới để nhận kịch bản.\n` +
                `**ENG:** Choose a script repository of your favourite game, choose the script in the list that you want and click coppy below to get the script`;
            return interaction.reply({ content: helpMessage, ephemeral: true });
        }

        let currentList = [];
        let titleName = "";
        let customMenuId = "";

        if (interaction.commandName === 'script-bloxfruit') { currentList = bloxfruitList; titleName = "Blox Fruit"; customMenuId = "menu_bloxfruit"; }
        else if (interaction.commandName === 'script-gag2') { currentList = gag2List; titleName = "GAG2"; customMenuId = "menu_gag2"; }
        else if (interaction.commandName === 'script-99night') { currentList = night99List; titleName = "99 Night"; customMenuId = "menu_99night"; }
        else if (interaction.commandName === 'script-sailorpice') { currentList = sailorList; titleName = "Sailor Piece"; customMenuId = "menu_sailor"; }
        else if (interaction.commandName === 'script-gag') { currentList = gagList; titleName = "GAG"; customMenuId = "menu_gag"; }
        else if (interaction.commandName === 'script-forsaken') { currentList = forsakenList; titleName = "Forsaken"; customMenuId = "menu_forsaken"; }
        else if (interaction.commandName === 'script-steal-a-brainrot') { currentList = stealBrainrotList; titleName = "Steal a Brainrot"; customMenuId = "menu_steal_brainrot"; }
        else if (interaction.commandName === 'script-murder-mystery-2') { currentList = murderMysteryList; titleName = "Murder Mystery 2"; customMenuId = "menu_mm2"; }
        // Cấu hình danh sách cho lệnh fisch mới
        else if (interaction.commandName === 'script-fisch') { currentList = fischList; titleName = "Fisch"; customMenuId = "menu_fisch"; }

        const validList = currentList.filter(s => s.name && s.name.trim() !== "");
        if (validList.length === 0) return interaction.reply({ content: `Hiện tại chưa có script nào cho ${titleName}!`, ephemeral: true });

        // Tối đa 25 options cho menu Discord
        const menuOptions = validList.slice(0, 25).map((script, index) => 
            new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString())
        );

        const selectMenu = new StringSelectMenuBuilder().setCustomId(customMenuId).setPlaceholder(`Select script | 1-${menuOptions.length}`).setMinValues(1).setMaxValues(1).addOptions(menuOptions);
        await interaction.reply({ content: `**Select script | ${titleName} (1-${menuOptions.length})**\nChọn mục bên dưới để nhận code:`, components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
    }

    // --- XỬ LÝ KHI CHỌN MENU ---
    if (interaction.isStringSelectMenu()) {
        await interaction.deferReply({ ephemeral: true });

        let list = [];
        let embedColor = "#000000";
        let prefix = "";

        if (interaction.customId === 'menu_bloxfruit') { list = bloxfruitList; embedColor = '#00ffcc'; prefix = "copy_bf_"; }
        if (interaction.customId === 'menu_gag2') { list = gag2List; embedColor = '#ff9900'; prefix = "copy_gag2_"; }
        if (interaction.customId === 'menu_99night') { list = night99List; embedColor = '#ff0055'; prefix = "copy_99night_"; }
        if (interaction.customId === 'menu_sailor') { list = sailorList; embedColor = '#0099ff'; prefix = "copy_sailor_"; }
        if (interaction.customId === 'menu_gag') { list = gagList; embedColor = '#33cc33'; prefix = "copy_gag_"; }
        if (interaction.customId === 'menu_forsaken') { list = forsakenList; embedColor = '#6600cc'; prefix = "copy_forsaken_"; }
        if (interaction.customId === 'menu_steal_brainrot') { list = stealBrainrotList; embedColor = '#ff3399'; prefix = "copy_steal_"; }
        if (interaction.customId === 'menu_mm2') { list = murderMysteryList; embedColor = '#cc0000'; prefix = "copy_mm2_"; }
        // Nhận diện menu ID cho game Fisch mới
        if (interaction.customId === 'menu_fisch') { list = fischList; embedColor = '#00ffff'; prefix = "copy_fisch_"; }

        const chosenScript = getScriptByIndex(list, interaction.values[0]);
        if (!chosenScript) return interaction.editReply({ content: 'Lỗi: Không tìm thấy dữ liệu script!' });

        const embed = new EmbedBuilder().setColor(embedColor).setTitle(`🤖 Dubo script | Cấp mã thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code:', value: `\`\`\`lua\n${chosenScript.code || "-- Trống"}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`${prefix}${interaction.values[0]}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success);

        await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)] });
    }

    // --- XỬ LÝ KHI BẤM NÚT COPY ---
    if (interaction.isButton()) {
        await interaction.deferReply({ ephemeral: true });

        let list = [];
        let idxStr = "";

        if (interaction.customId.startsWith('copy_bf_')) { list = bloxfruitList; idxStr = interaction.customId.replace('copy_bf_', ''); }
        else if (interaction.customId.startsWith('copy_gag2_')) { list = gag2List; idxStr = interaction.customId.replace('copy_gag2_', ''); }
        else if (interaction.customId.startsWith('copy_99night_')) { list = night99List; idxStr = interaction.customId.replace('copy_99night_', ''); }
        else if (interaction.customId.startsWith('copy_sailor_')) { list = sailorList; idxStr = interaction.customId.replace('copy_sailor_', ''); }
        else if (interaction.customId.startsWith('copy_gag_')) { list = gagList; idxStr = interaction.customId.replace('copy_gag_', ''); }
        else if (interaction.customId.startsWith('copy_forsaken_')) { list = forsakenList; idxStr = interaction.customId.replace('copy_forsaken_', ''); }
        else if (interaction.customId.startsWith('copy_steal_')) { list = stealBrainrotList; idxStr = interaction.customId.replace('copy_steal_', ''); }
        else if (interaction.customId.startsWith('copy_mm2_')) { list = murderMysteryList; idxStr = interaction.customId.replace('copy_mm2_', ''); }
        // Trích xuất index nút bấm cho Fisch
        else if (interaction.customId.startsWith('copy_fisch_')) { list = fischList; idxStr = interaction.customId.replace('copy_fisch_', ''); }

        const chosenScript = getScriptByIndex(list, idxStr);
        if (!chosenScript) return interaction.editReply({ content: 'Lỗi: Không tìm thấy dữ liệu sao chép!' });

        await interaction.editReply({ content: `${chosenScript.code || "-- Trống"}` });
    }
});

// =========================================================================
// TỰ ĐỘNG GỬI TIN NHẮN RIÊNG (DM) CẢM ƠN CHỦ SERVER KHI BOT ĐƯỢC MỜI VÀO
// =========================================================================
client.on('guildCreate', async (guild) => {
    try {
        const owner = await guild.fetchOwner();
        if (owner) {
            const thankYouEmbed = new EmbedBuilder()
                .setColor('#00ffcc')
                .setTitle('🎉 Thank you!')
                .setDescription(
                    `Cảm ơn bạn đã sử dụng bot của tôi\n` +
                    `Thank you for using my bot\n` +
                    `link sever: https://discord.gg/Y7uUkKHBb\n\n` +
                    `Join my discord server to chat and report bot errors and build bots with me Thank you`
                )
                .setTimestamp();

            await owner.send({ embeds: [thankYouEmbed] });
        }
    } catch (error) {
        // Bỏ qua tất cả lỗi (như khi chủ server khóa DM) để bot chạy ngầm hoàn toàn im lặng
    }
});

client.login(BOT_TOKEN);

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
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    PermissionFlagsBits,
    PermissionsBitField
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

// 🎯 CẤU HÌNH ID QUAN TRỌNG ĐÃ CẬP NHẬT THEO YÊU CẦU
const MY_SERVER_ID = '1509197460512309298'; 
const OWNER_ID = '1501730680613114048'; // ID độc quyền dùng lệnh quản trị ẩn danh

// ĐƯỜNG ỐNG ĐẦU RA MẶC ĐỊNH (Sẽ tự động cập nhật động khi chạy lệnh /ticket-dubo)
let TICKET_LOG_CHANNEL_ID = '1526179515355893811'; 

// --- BỘ NHỚ LƯU TRỮ CHO TÍNH NĂNG INVITE TRACKER ---
const invitesCache = new Map(); // Lưu mã mời: GuildID -> Map(Code -> Uses)
const serverLogChannels = new Map(); // Lưu cấu hình kênh hiển thị: GuildID -> { logChannelId, thongBaoChannelId, quyTacChannelId }

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // ⚠️ BẮT BUỘC PHẢI BẬT TRÊN DEVELOPER PORTAL
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildInvites // ⚠️ BẮT BUỘC ĐỂ ĐỌC SỰ KIỆN TẠO/XÓA LINK MỜI
    ] 
});

// Bộ lưu trữ các thời gian tự động Unban khi admin ban có thời hạn
const unbanSchedules = new Map();

// =========================================================================
// DATA SCRIPTS (GIỮ NGUYÊN HOÀN TOÀN ĐẦY ĐỦ KHÔNG RÚT GỌN)
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
    { name: "Hermanos", code: `local script_mode = "PVP" -- PVP, FARMlocal loader = loadstringlocal url = "https://raw.githubusercontent.com/hermanos-dev/hermanos-hub/refs/heads/main/Loader.lua"local response = game:HttpGet(url)loader(response)()` }
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
    { name: "Auto Gallery", code: `_G.Auto = true\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\nlocal Event = ReplicatedStorage.RemoteEvents.CarnivalCompleteShootingGallery...` },
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
    { name: "Express hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Bliqe/Upload/refs/heads/main/Games/SP/Express.lua"))()` }
];

const gagList = [
    { name: "Speed hub X ⚡️", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/AhmadV99/Speed-Hub-X/main/Speed%20Hub%20X.lua", true))();` },
    { name: "Lumin hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/DSzWXEgx", true))()` },
    { name: "Dark Spawner", code: `loadstring(game:HttpGet("https://pastefy.app/SC4qoDAW/raw"))()` },
    { name: "Ez hub", code: `loadstring(game:HttpGet("https://api.junkie-development.de/api/v1/luascripts/public/8e08cda5c530a6529a71a14b94a33734eccc870e9f28220410eb21d719f66da9/download"))()` },
    { name: "Project Madara", code: `loadstring(game:HttpGet('https://raw.githubusercontent.com/IsThisMe01/Project-Madara/refs/heads/main/loader.lua'))();` },
    { name: "ThunderZ huh", code: `loadstring(game:HttpGet("https://pastebin.com/raw/FVTeB51h", true))()` },
    { name: "UB hub", code: `loadstring(game:HttpGet("https://gitlab.com/r_soft/main/-/raw/main/LoadUB.lua"))()` },
    { name: "Fryzer hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/FryzerHub/Key-system-gui/refs/heads/main/GAG%20AUTO%20FARM%20v2"))()` },
    { name: "Than hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/txWTGFRZ", true))()` },
    { name: "MiMi hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Jstarzz/petmover/refs/heads/main/main.lua", true))()` },
    { name: "JN hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/A7us0FyY", true))()` },
    { name: "FFJ hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/FFJ1/Roblox-Exploits/main/scripts/Loader.lua"))()` },
    { name: "EF hub", code: `loadstring(game:HttpGet("https://api.exploitingis.fun/loader"))()` },
    { name: "HckMan hub", code: `loadstring(game:HttpGet(('https://raw.githubusercontent.com/ndaju/-h/refs/heads/main/laodemain.txt'),true))()` },
    { name: "Alter hub", code: `loadstring(game:HttpGet('https://raw.githubusercontent.com/frvaunted/Main/refs/heads/main/Alter%20Hub'))()` }
];

const forsakenList = [
    { name: "Plus hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/NaikoScript/Forsaken-Plus/main/Script"))()` },
    { name: "Catsaken hub", code: `loadstring(game:HttpGet('https://raw.githubusercontent.com/aibabylaugh/catsaken-real-script-not-assets/refs/heads/main/obfuscated-1448974601077002340.lua' ))()` },
    { name: "Hutao hub", code: `loadstring(game:HttpGet("https://api.junkie-development.de/api/v1/luascripts/public/b803c8ca9d0205a7561d9f0467418e00b7743ef568f5471653432762027cf0f0/download"))()` },
    { name: "Nullsaken", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/34f3f/forsaken.github.io/refs/heads/main/ringtabublik.lua"))()` },
    { name: "Funny hub v2", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/PlutomasterAccount/Funny-Hub-V2/main/Forsaken"))()` },
    { name: "RINGTA", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/PlutomasterAccount/Funny-Hub-V2/main/Forsaken"))()` },
    { name: "SNT hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Snowt69/SNT-HUB/refs/heads/main/Forsaken"))()` },
    { name: "AshLab hub", code: `loadstring(game:HttpGet("https://pastebin.com/raw/Xan01DmF", true))()` },
    { name: "NS hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/OhhMyGehlee/sak/refs/heads/main/for"))()` }
];

const stealBrainrotList = [
    { name: "Chilli", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/tienkhanh1/spicy/main/Chilli.lua"))()` },
    { name: "Ugly", code: `loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/53325754de16c11fbf8bf78101c1c881.lua"))()` },
    { name: "Echo hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/acesolos/Echo/refs/heads/main/hehe"))()` },
    { name: "Cartola hub", code: `loadstring(game:HttpGet("https://pastefy.app/CJpKxSAv/raw",true))()` },
    { name: "Ajjans hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Atom1gg/Umbrella/refs/heads/main/Loader.lua"))()` },
    { name: "Maku hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Makuscripts/Steal-A-Brainrot/refs/heads/main/SAB-OPSCRIPT.lua"))()` },
    { name: "Denji hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/DynaFetchy/Scripts/refs/heads/main/Loader.lua"))()` },
    { name: "SAB", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/gumanba/Scripts/refs/heads/main/StealaBrainrotMOD", true))()` },
    { name: "Arbix hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Youifpg/Steal-a-Brianrot/refs/heads/main/Slowversion.lua"))()` },
    { name: "Roube", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/tbao143/game/refs/heads/main/TbaoHubStealBranrot"))()` },
    { name: "Ghost hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Akbar123s/Script-Roblox-/refs/heads/main/Script%20Brainrot%20New"))()` },
    { name: "Neox hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/hassanxzayn-lua/NEOXHUBMAIN/refs/heads/main/StealABrainrot"))()` }
];

const murderMysteryList = [
    { name: "MM2", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Doggo-cryto/EclipseMM2/master/Script", true))()` },
    { name: "Aether hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/vzyxer/Aether-Hub-Global-Roblox-Script-Hub/refs/heads/main/Murder%20Mystery%202"))()` },
    { name: "SNT hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Snowt-Team/SNT-HUB/refs/heads/main/MurderMystery2.txt"))()` },
    { name: "SnapSanix hub", code: `loadstring(game:HttpGet('https://raw.githubusercontent.com/Roman34296589/SnapSanixHUB/refs/heads/main/SnapSanixHUB.lua'))()` },
    { name: "Tbao hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/tbao143/thaibao/main/TbaoHubMurdervssheriff"))()` }
];

const fischList = [
    { name: "ShieldTeam hub", code: `loadstring(game:HttpGet(('https://raw.githubusercontent.com/KAN-FISCH/tesss/refs/heads/main/allscript.lua'), true))()` },
    { name: "Mur4Scripts hub", code: `loadstring(game:HttpGet("https://gist.githubusercontent.com/Mur4exe/af4ce068bd4910ff0e5715cd0215c143/raw/f3f36618e23d29d064618d1c573ab29e2e407f71/F%25C4%25B0SHv2.lua"))()` },
    { name: "Black hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Skibidiking123/Fisch1/refs/heads/main/FischMain"))()` },
    { name: "Mercuryu", code: `loadstring(game:HttpGet('https://raw.githubusercontent.com/imyourlio/Mercury/main/loader.luau'))()` },
    { name: "Zenith hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Efe0626/ZenithHub/refs/heads/main/Loader"))()` },
    { name: "Speed hub X", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/AhmadV99/Speed-Hub-X/main/Speed%20Hub%20X.lua", true))()` },
    { name: "Native", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Native-lab/Native/main/loader.lua"))()` },
    { name: "Ronix hub", code: `loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/1255807d4f3b118b6636cfd3d386d8b8.lua"))()` },
    { name: "Lunor hub", code: `loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/f6c9f276f7d6a7dd6edfd0173d7a211d.lua"))()` },
    { name: "Draco hub", code: `loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/cdc8ffd74b2c33f6c9f47b85f4b77c45.lua"))()` },
    { name: "Raito hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Efe0626/RaitoHub/main/Script"))()` },
    { name: "Switch hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/kiciahook/kiciahook/refs/heads/main/loader.lua"))()` },
    { name: "Kiciahook", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/kiciahook/kiciahook/refs/heads/main/loader.lua"))()` },
    { name: "Bonk hub", code: `loadstring(game:HttpGet("https://bonkhubloader.netlify.app",true))()` },
    { name: "Infinity hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Droidlol/Infinity/refs/heads/main/Infinity.lua"))()` },
    { name: "Mercury hub", code: `loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/c019f214a19894b50f0b8e817b70d25f.lua"))()` },
    { name: "Goomba hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/JustLevel/goombahub/main/fisch.lua"))()` },
    { name: "Solix hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/debunked69/Solixreworkkeysystem/refs/heads/main/solix%20new%20keyui.lua"))()` },
    { name: "Average hub", code: `loadstring(game:HttpGet("https://gist.githubusercontent.com/AverageHub/1980eccce4133d77fb24d166dc296125/raw/2d9c88acc21a302d92aed0e8b6f0dcd287c8b96b/gistfile1.txt"))()` },
    { name: "Mean hub", code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/Alton012/Fisch.Script/refs/heads/main/Mean%20Hub"))()` }
];

// =========================================================================
// ĐỒNG BỘ SLASH COMMANDS & THIẾT LẬP ẨN CHO LỆNH QUẢN TRỊ
// =========================================================================
client.once('ready', async () => {
    console.log(`Bot Dubo script va Web Server da Online: ${client.user.tag}`);
    
    // Nạp cache danh sách invite ban đầu của toàn bộ các Server
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const invites = await guild.invites.fetch();
            const inviteMap = new Map();
            invites.forEach(inv => inviteMap.set(inv.code, inv.uses));
            invitesCache.set(guildId, inviteMap);
            console.log(`[Cache Invite] Đã nạp ${invites.size} link mời của Server: ${guild.name}`);
        } catch (err) {
            console.log(`[Cache Invite Error] Không thể nạp link mời từ Server ${guild.name}:`, err.message);
        }
    }

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
        new SlashCommandBuilder().setName('script-fisch').setDescription('Hiển thị bảng chọn script Fisch ẩn danh'),
        
        // 🔒 CHẶN QUYỀN MẶC ĐỊNH BẰNG .setDefaultMemberPermissions(0) ĐỂ ẨN HOÀN TOÀN CÁC LỆNH QUẢN TRỊ
        new SlashCommandBuilder()
            .setName('ticket-dubo')
            .setDescription('Thiết lập đường ống gửi bài viết và nhận ticket (Chỉ Chủ Bot)')
            .setDefaultMemberPermissions(0)
            .addChannelOption(option => 
                option.setName('kenh-dang-embed')
                    .setDescription('Chọn kênh đầu vào để đăng bài Embed kèm nút tạo Ticket')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
            .addChannelOption(option => 
                option.setName('kenh-nhan-log')
                    .setDescription('Chọn kênh đầu ra để bot tự động chuyển thông tin tố cáo/ticket về')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            ),

        // ⚙️ LỆNH /invites-cache CHUẨN 3 MỤC CHỌN KÊNH
        new SlashCommandBuilder()
            .setName('invites-cache')
            .setDescription('Thiết lập kênh log chào mừng, thông báo và luật (Chỉ Chủ Bot)')
            .setDefaultMemberPermissions(0)
            .addChannelOption(option => 
                option.setName('kenh-hien-thi')
                    .setDescription('Chọn kênh để bot gửi tin nhắn chào mừng y như ảnh')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
            .addChannelOption(option => 
                option.setName('kenh-thong-bao')
                    .setDescription('Chọn kênh thông báo của server')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
            .addChannelOption(option => 
                option.setName('kenh-quy-tac')
                    .setDescription('Chọn kênh rules/quy tắc của server')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            ),

        // 🔴 LỆNH MỚI: /stop-invite ĐỂ TẮT HỆ THỐNG LOG CHÀO MỪNG
        new SlashCommandBuilder()
            .setName('stop-invite')
            .setDescription('Tắt hệ thống chào mừng và theo dõi lượt mời (Chỉ Chủ Bot)')
            .setDefaultMemberPermissions(0),

        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Hạn chế chat (Mute) một thành viên trong server')
            .setDefaultMemberPermissions(0)
            .addUserOption(option => option.setName('user').setDescription('Thành viên cần Mute').setRequired(true)),

        new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Gỡ hạn chế chat (Unmute) một thành viên trong server')
            .setDefaultMemberPermissions(0)
            .addUserOption(option => option.setName('user').setDescription('Thành viên cần Unmute').setRequired(true)),

        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Trục xuất và chặn truy cập (Ban) một thành viên')
            .setDefaultMemberPermissions(0)
            .addUserOption(option => option.setName('user').setDescription('Thành viên cần Ban').setRequired(true)),

        new SlashCommandBuilder()
            .setName('unban')
            .setDescription('Gỡ chặn (Unban) cho một tài khoản bằng ID')
            .setDefaultMemberPermissions(0)
            .addStringOption(option => option.setName('id').setDescription('Nhập ID tài khoản cần Unban').setRequired(true)),

        // 🛡️ LỆNH /role
        new SlashCommandBuilder()
            .setName('role')
            .setDescription('Quản lý vai trò (Cấp hoặc Xóa) của một thành viên (Chỉ Chủ Bot)')
            .setDefaultMemberPermissions(0)
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('Chọn thành viên cần xử lý')
                    .setRequired(true)
            )
            .addRoleOption(option => 
                option.setName('role')
                    .setDescription('Chọn vai trò (Role)')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('action')
                    .setDescription('Chọn hành động muốn thực hiện')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Cấp vai trò (Add)', value: 'add' },
                        { name: 'Xóa vai trò (Remove)', value: 'remove' }
                    )
            )
            
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Đồng bộ thành công hệ thống lệnh! Đã cập nhật /stop-invite và các cấu hình mới.');
    } catch (error) {
        console.error('Lỗi đồng bộ lệnh:', error);
    }
});

function getScriptByIndex(list, selectValue) {
    const validList = list.filter(s => s.name && s.name.trim() !== "");
    const idx = parseInt(selectValue);
    return validList[idx] || null;
}

// =========================================================================
// ĐỒNG BỘ CẬP NHẬT CACHE KHI CÓ LINK MỜI MỚI HOẶC BỊ XÓA
// =========================================================================
client.on('inviteCreate', async (invite) => {
    if (!invite.guild) return;
    const guildInvites = invitesCache.get(invite.guild.id) || new Map();
    guildInvites.set(invite.code, invite.uses);
    invitesCache.set(invite.guild.id, guildInvites);
});

client.on('inviteDelete', async (invite) => {
    if (!invite.guild) return;
    const guildInvites = invitesCache.get(invite.guild.id);
    if (guildInvites) {
        guildInvites.delete(invite.code);
    }
});

// =========================================================================
// XỬ LÝ SỰ KIỆN LỆNH / MENU / NÚT
// =========================================================================
client.on('interactionCreate', async interaction => {
    
    // 1. XỬ LÝ CÁC LỆNH SLASH COMMAND (CHAT COMMANDS)
    if (interaction.isChatInputCommand()) {
        
        // --- CHẶN QUYỀN TRUY CẬP ĐỘC QUYỀN BẰNG CODE ---
        if (['ticket-dubo', 'invites-cache', 'stop-invite', 'mute', 'unmute', 'ban', 'unban', 'role'].includes(interaction.commandName)) {
            if (interaction.user.id !== OWNER_ID) {
                return interaction.reply({ content: '❌ Lệnh quản trị ẩn danh này đã bị khóa bằng ID phần cứng! Bạn không có quyền sử dụng.', ephemeral: true });
            }
        }

        // --- LỆNH SLASH: /stop-invite (TẮT HỆ THỐNG LOG CHÀO MỪNG) ---
        if (interaction.commandName === 'stop-invite') {
            await interaction.deferReply({ ephemeral: true });
            const guildId = interaction.guild.id;

            if (serverLogChannels.has(guildId)) {
                serverLogChannels.delete(guildId);
                return interaction.editReply({ content: '✅ Đã tắt và hủy bỏ cấu hình hệ thống log chào mừng / invite-tracker thành công cho server này!' });
            } else {
                return interaction.editReply({ content: '❌ Server này hiện đang không cài đặt hệ thống log chào mừng.' });
            }
        }

        // --- LỆNH SLASH: /invites-cache ---
        if (interaction.commandName === 'invites-cache') {
            await interaction.deferReply({ ephemeral: true });
            const logChannel = interaction.options.getChannel('kenh-hien-thi');
            const thongBaoChannel = interaction.options.getChannel('kenh-thong-bao');
            const quyTacChannel = interaction.options.getChannel('kenh-quy-tac');
            const guildId = interaction.guild.id;
            const serverName = interaction.guild.name;

            // Lưu cấu hình cả 3 kênh
            serverLogChannels.set(guildId, {
                logChannelId: logChannel.id,
                thongBaoChannelId: thongBaoChannel.id,
                quyTacChannelId: quyTacChannel.id
            });

            const setupEmbed = new EmbedBuilder()
                .setColor('#00ffcc')
                .setTitle(`⚙️ CẤU HÌNH HỆ THỐNG CHÀO MỪNG | ${serverName.toUpperCase()}`)
                .setDescription(
                    `Đã thiết lập thành công cấu hình chào mừng cho server **${serverName}**!\n\n` +
                    `📥 **Kênh chào mừng:** ${logChannel}\n` +
                    `📣 **Kênh thông báo:** ${thongBaoChannel}\n` +
                    `📜 **Kênh quy tắc:** ${quyTacChannel}`
                )
                .setFooter({ text: `Hệ thống quản lý tự động của ${serverName}` })
                .setTimestamp();

            try {
                await interaction.editReply({ embeds: [setupEmbed] });
            } catch (err) {
                return interaction.editReply({ content: `❌ Lỗi thiết lập: ${err.message}` });
            }
        }

        // --- LỆNH SLASH: /role ---
        if (interaction.commandName === 'role') {
            await interaction.deferReply({ ephemeral: true });
            const targetUser = interaction.options.getUser('user');
            const targetRole = interaction.options.getRole('role');
            const action = interaction.options.getString('action');

            try {
                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                if (!targetMember) {
                    return interaction.editReply({ content: '❌ Không tìm thấy thành viên này trong server.' });
                }

                const botMember = await interaction.guild.members.fetch(client.user.id);
                if (targetRole.position >= botMember.roles.highest.position) {
                    return interaction.editReply({ content: `❌ Thất bại: Vai trò \`${targetRole.name}\` nằm cao hơn hoặc bằng vai trò cao nhất của Bot.` });
                }

                if (action === 'add') {
                    if (targetMember.roles.cache.has(targetRole.id)) {
                        return interaction.editReply({ content: `ℹ️ Thành viên này đã có sẵn vai trò ${targetRole} từ trước.` });
                    }
                    
                    await targetMember.roles.add(targetRole, `Được cấp bởi Admin ${interaction.user.username}`);
                    const addEmbed = new EmbedBuilder()
                        .setColor('#33ff33')
                        .setTitle('🛡️ CẤP VAI TRÒ (ROLE ADDED)')
                        .setDescription(`Đã **cấp** vai trò ${targetRole} cho thành viên ${targetUser} thành công!`)
                        .setTimestamp();
                    return interaction.editReply({ embeds: [addEmbed] });
                } 

                else if (action === 'remove') {
                    if (!targetMember.roles.cache.has(targetRole.id)) {
                        return interaction.editReply({ content: `ℹ️ Thành viên ${targetUser} vốn dĩ không có vai trò ${targetRole} này.` });
                    }

                    await targetMember.roles.remove(targetRole, `Bị xóa bởi Admin ${interaction.user.username}`);
                    const removeEmbed = new EmbedBuilder()
                        .setColor('#ff3333')
                        .setTitle('🛡️ XÓA VAI TRÒ (ROLE REMOVED)')
                        .setDescription(`Đã **xóa** vai trò ${targetRole} khỏi thành viên ${targetUser} thành công!`)
                        .setTimestamp();
                    return interaction.editReply({ embeds: [removeEmbed] });
                }

            } catch (err) {
                return interaction.editReply({ content: `❌ Lỗi hệ thống khi cập nhật Role: ${err.message}` });
            }
        }

        // --- LỆNH SLASH: TICKET-DUBO ---
        if (interaction.commandName === 'ticket-dubo') {
            await interaction.deferReply({ ephemeral: true });
            const sourceChannel = interaction.options.getChannel('kenh-dang-embed');
            const targetChannel = interaction.options.getChannel('kenh-nhan-log');
            TICKET_LOG_CHANNEL_ID = targetChannel.id;

            const ticketButton = new ButtonBuilder().setCustomId('open_ticket_modal').setLabel('🎫 Ticket Support').setStyle(ButtonStyle.Danger); 
            const row = new ActionRowBuilder().addComponents(ticketButton);
            const ticketEmbed = new EmbedBuilder()
                .setColor('#0055ff') 
                .setTitle('🛠️ HỆ THỐNG HỖ TRỢ & TỐ CÁO | SUPPORT SYSTEM')
                .setDescription(`**[VN] Hướng dẫn gửi yêu cầu:**\nNhấn nút tạo ticket ở dưới, ghi rõ bằng chứng lý do và kèm link video để bằng chứng rõ ràng, để chúng tôi thực hiện sự trừng phạt đối với họ.\n\n--------------------------------------------------\n\n**[ENG] Request Guide:**\n*Click the button below to create a ticket stating the reason and attaching a video link to make it clear, so that we can punish them.*`)
                .setFooter({ text: 'Dubo Bypass Script Hub • Click Button Below' }).setTimestamp();

            try {
                await sourceChannel.send({ embeds: [ticketEmbed], components: [row] });
                return interaction.editReply({ content: `✅ **Đường ống thiết làm thành công!**\n📥 **Đầu vào (Embed):** Đã hú bảng Ticket tại ${sourceChannel}\n📤 **Đầu ra (Nhận Log):** Đã chuyển hướng toàn bộ ticket về ${targetChannel}` });
            } catch (err) {
                return interaction.editReply({ content: '❌ Thất bại! Vui lòng kiểm tra quyền hạn của Bot tại kênh đã chọn.' });
            }
        }

        // --- LỆNH SLASH: /mute CHÍNH THỨC ---
        if (interaction.commandName === 'mute') {
            const targetUser = interaction.options.getUser('user');
            const selectMute = new StringSelectMenuBuilder()
                .setCustomId(`select_mute_time_${targetUser.id}`) 
                .setPlaceholder(`Mute đối tượng: ${targetUser.username}...`)
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('1 Giờ').setValue('3600000'),
                    new StringSelectMenuOptionBuilder().setLabel('1 Ngày').setValue('86400000'),
                    new StringSelectMenuOptionBuilder().setLabel('7 Ngày').setValue('604800000'),
                    new StringSelectMenuOptionBuilder().setLabel('30 Ngày (Max)').setValue('2419200000')
                );

            return interaction.reply({ 
                content: `⏱️ **Chọn thời gian Mute** cho tài khoản ${targetUser}:`, 
                components: [new ActionRowBuilder().addComponents(selectMute)], 
                ephemeral: true 
            });
        }

        // --- LỆNH SLASH: /unmute CHÍNH THỨC ---
        if (interaction.commandName === 'unmute') {
            await interaction.deferReply({ ephemeral: true });
            const targetUser = interaction.options.getUser('user');

            try {
                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                if (!targetMember) return interaction.editReply({ content: `❌ Không tìm thấy thành viên này trong server.` });

                await targetMember.timeout(null, `Được gỡ phạt bằng lệnh /unmute của Admin ${interaction.user.username}`);

                try {
                    await targetMember.send({
                        embeds: [new EmbedBuilder().setColor('#00ff00').setTitle('✅ THÔNG BÁO GỠ PHẠT (UNMUTE)').setDescription(`Bạn đã được gỡ hạn chế chat (Unmute) trong server **${interaction.guild.name}**.`).setTimestamp()]
                    });
                } catch (dmErr) {}

                const unmuteEmbed = new EmbedBuilder().setColor('#00ff00').setTitle('🔊 UNMUTE USER SUCCESS 🔊').setDescription(`Đã mở khóa chat thành công cho ${targetUser}!`).setTimestamp();
                return interaction.editReply({ embeds: [unmuteEmbed] });
            } catch (err) {
                return interaction.editReply({ content: `❌ Không thể thực thi: ${err.message}` });
            }
        }

        // --- LỆNH SLASH: /ban CHÍNH THỨC ---
        if (interaction.commandName === 'ban') {
            const targetUser = interaction.options.getUser('user');
            const selectBan = new StringSelectMenuBuilder()
                .setCustomId(`select_ban_time_${targetUser.id}`) 
                .setPlaceholder(`Ban đối tượng: ${targetUser.username}...`)
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('1 Giờ').setValue('1'),
                    new StringSelectMenuOptionBuilder().setLabel('1 Ngày').setValue('24'),
                    new StringSelectMenuOptionBuilder().setLabel('7 Ngày').setValue('168'),
                    new StringSelectMenuOptionBuilder().setLabel('30 Ngày').setValue('720'),
                    new StringSelectMenuOptionBuilder().setLabel('🔨 Ban Vĩnh Viễn').setValue('0')
                );

            return interaction.reply({ 
                content: `🔨 **Chọn thời gian Ban** cho tài khoản ${targetUser}:`, 
                components: [new ActionRowBuilder().addComponents(selectBan)], 
                ephemeral: true 
            });
        }

        // --- LỆNH SLASH: /unban CHÍNH THỨC ---
        if (interaction.commandName === 'unban') {
            await interaction.deferReply({ ephemeral: true });
            const targetId = interaction.options.getString('id').trim();

            try {
                await interaction.guild.members.unban(targetId, `Được gỡ Ban bằng lệnh /unban của Admin ${interaction.user.username}`);
                try {
                    const targetUser = await client.users.fetch(targetId);
                    if (targetUser) {
                        await targetUser.send({ embeds: [new EmbedBuilder().setColor('#00ff00').setTitle('✅ THÔNG BÁO GỠ BAN (UNBAN)').setDescription(`Tài khoản của bạn đã được gỡ chặn (Unban) tại server **${interaction.guild.name}**!`).setTimestamp()] });
                    }
                } catch (dmErr) {}

                const unbanEmbed = new EmbedBuilder().setColor('#00ff00').setTitle('🛡️ UNBAN USER SUCCESS 🛡️').setDescription(`Đã mở khóa và gỡ chặn truy cập thành công cho ID \`${targetId}\`!`).setTimestamp();
                return interaction.editReply({ embeds: [unbanEmbed] });
            } catch (err) {
                return interaction.editReply({ content: `❌ Không gỡ ban được. Vui lòng kiểm tra lại ID: ${err.message}` });
            }
        }

        // --- LỆNH SLASH: HELP ---
        if (interaction.commandName === 'help') {
            const helpMessage = `**VN:** Chọn một kho kịch bản của 1 trò chơi mà bạn yêu thích, chọn kịch bản trong danh sách mà bạn muốn và nhấn coppy ở dưới để nhận kịch bản.\n**ENG:** Choose a script repository of your favourite game, choose the script in the list that you want and click coppy below to get the script`;
            return interaction.reply({ content: helpMessage, ephemeral: true });
        }

        // --- HỆ THỐNG CÁC LỆNH MENU SCRIPT ---
        let currentList = []; let titleName = ""; let customMenuId = "";
        if (interaction.commandName === 'script-bloxfruit') { currentList = bloxfruitList; titleName = "Blox Fruit"; customMenuId = "menu_bloxfruit"; }
        else if (interaction.commandName === 'script-gag2') { currentList = gag2List; titleName = "GAG2"; customMenuId = "menu_gag2"; }
        else if (interaction.commandName === 'script-99night') { currentList = night99List; titleName = "99 Night"; customMenuId = "menu_99night"; }
        else if (interaction.commandName === 'script-sailorpice') { currentList = sailorList; titleName = "Sailor Piece"; customMenuId = "menu_sailor"; }
        else if (interaction.commandName === 'script-gag') { currentList = gagList; titleName = "GAG"; customMenuId = "menu_gag"; }
        else if (interaction.commandName === 'script-forsaken') { currentList = forsakenList; titleName = "Forsaken"; customMenuId = "menu_forsaken"; }
        else if (interaction.commandName === 'script-steal-a-brainrot') { currentList = stealBrainrotList; titleName = "Steal a Brainrot"; customMenuId = "menu_steal_brainrot"; }
        else if (interaction.commandName === 'script-murder-mystery-2') { currentList = murderMysteryList; titleName = "Murder Mystery 2"; customMenuId = "menu_mm2"; }
        else if (interaction.commandName === 'script-fisch') { currentList = fischList; titleName = "Fisch"; customMenuId = "menu_fisch"; }

        const validList = currentList.filter(s => s.name && s.name.trim() !== "");
        if (validList.length === 0) return interaction.reply({ content: `Hiện tại chưa có script nào cho ${titleName}!`, ephemeral: true });

        const menuOptions = validList.slice(0, 25).map((script, index) => new StringSelectMenuOptionBuilder().setLabel(script.name).setDescription(`Bấm để lấy mã code của: ${script.name}`).setValue(index.toString()));
        const selectMenu = new StringSelectMenuBuilder().setCustomId(customMenuId).setPlaceholder(`Select script | 1-${menuOptions.length}`).setMinValues(1).setMaxValues(1).addOptions(menuOptions);
        await interaction.reply({ content: `**Select script | ${titleName} (1-${menuOptions.length})**\nChọn mục bên dưới để nhận code:`, components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
    }

    // 2. XỬ LÝ KHI USER ẤN NÚT TẠO TICKET
    if (interaction.isButton() && interaction.customId === 'open_ticket_modal') {
        const modal = new ModalBuilder().setCustomId('ticket_submission_modal').setTitle('Support - Tố Cáo & Hỗ Trợ');
        const field1 = new TextInputBuilder().setCustomId('ticket_user_tag').setLabel('Tag/Tên người dùng tố cáo | User Tag').setPlaceholder('Ví dụ: @abcxyz...').setStyle(TextInputStyle.Short).setRequired(true);
        const field2 = new TextInputBuilder().setCustomId('ticket_reason').setLabel('Lý do gặp phải | Reason').setPlaceholder('Ghi rõ hành vi vi phạm tại đây...').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const field3 = new TextInputBuilder().setCustomId('ticket_evidence_link').setLabel('Link ảnh hoặc Video bằng chứng | Evidence').setPlaceholder('Dán link bằng chứng vào đây...').setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(field1), new ActionRowBuilder().addComponents(field2), new ActionRowBuilder().addComponents(field3));
        return interaction.showModal(modal);
    }

    // 3. XỬ LÝ KHI GỬI MODAL TICKET
    if (interaction.isModalSubmit() && interaction.customId === 'ticket_submission_modal') {
        await interaction.deferReply({ ephemeral: true });
        const userTag = interaction.fields.getTextInputValue('ticket_user_tag');
        const reason = interaction.fields.getTextInputValue('ticket_reason');
        const evidenceLink = interaction.fields.getTextInputValue('ticket_evidence_link');

        const logEmbed = new EmbedBuilder()
            .setColor('#0055ff').setTitle('🚨 ĐƠN TỐ CÁO / YÊU CẦU HỖ TRỢ MỚI').setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { name: '👤 Người gửi đơn:', value: `${interaction.user} (ID: ${interaction.user.id})`, inline: true },
                { name: '🎯 Đối tượng bị tố cáo:', value: `\`${userTag}\``, inline: true },
                { name: '📝 Lý do chi tiết:', value: `${reason}` },
                { name: '🎥 Link bằng chứng (Ảnh/Video):', value: `${evidenceLink}` }
            ).setTimestamp();

        const replyButton = new ButtonBuilder().setCustomId(`reply_ticket_${interaction.user.id}`).setLabel('Gửi tin nhắn').setStyle(ButtonStyle.Success);
        const muteButton = new ButtonBuilder().setCustomId('mute_target_direct').setLabel('Mute').setStyle(ButtonStyle.Primary);
        const unmuteButton = new ButtonBuilder().setCustomId('unmute_target_direct').setLabel('Unmute').setStyle(ButtonStyle.Secondary);
        const banButton = new ButtonBuilder().setCustomId('ban_target_direct').setLabel('Ban').setStyle(ButtonStyle.Danger);
        const unbanButton = new ButtonBuilder().setCustomId('unban_target_direct').setLabel('Unban').setStyle(ButtonStyle.Danger);

        const actionRow1 = new ActionRowBuilder().addComponents(replyButton, muteButton, unmuteButton);
        const actionRow2 = new ActionRowBuilder().addComponents(banButton, unbanButton);

        try {
            const logChannel = await client.channels.fetch(TICKET_LOG_CHANNEL_ID).catch(() => null);
            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed], components: [actionRow1, actionRow2] });
                return interaction.editReply({ content: '✅ Gửi yêu cầu hỗ trợ thành công! Ban quản trị sẽ sớm xử lý.' });
            }
            return interaction.editReply({ content: '❌ Thất bại: Không kết nối được tới đường ống đầu ra.' });
        } catch (error) {
            return interaction.editReply({ content: '❌ Đã xảy ra lỗi hệ thống khi truyền dữ liệu.' });
        }
    }

    // --- XỬ LÝ CÁC NÚT BẤM TRỰC TIẾP TRÊN BẢNG LOG TICKET ---
    if (interaction.isButton() && interaction.user.id !== OWNER_ID && ['mute_target_direct', 'unmute_target_direct', 'ban_target_direct', 'unban_target_direct'].some(id => interaction.customId.startsWith(id) || interaction.customId === id)) {
        return interaction.reply({ content: '❌ Bạn không có quyền sử dụng chức năng này!', ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('reply_ticket_')) {
        if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '❌ Bạn không có quyền sử dụng chức năng này!', ephemeral: true });
        const targetUserId = interaction.customId.replace('reply_ticket_', '');
        const modal = new ModalBuilder().setCustomId(`admin_reply_modal_${targetUserId}`).setTitle('Gửi Phản Hồi Ticket');
        const messageInput = new TextInputBuilder().setCustomId('admin_reply_content').setLabel('Nội dung nhắn gửi đến thành viên').setPlaceholder('Nhập tin nhắn...').setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
        return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('admin_reply_modal_')) {
        await interaction.deferReply({ ephemeral: true });
        const targetUserId = interaction.customId.replace('admin_reply_modal_', '');
        const replyContent = interaction.fields.getTextInputValue('admin_reply_content');
        try {
            const targetUser = await client.users.fetch(targetUserId);
            if (targetUser) {
                await targetUser.send({ embeds: [new EmbedBuilder().setColor('#00ff55').setTitle('📩 PHẢN HỒI TỪ BAN QUẢN TRỊ').setDescription(`Chào bạn, đây là tin nhắn phản hồi về đơn Ticket của bạn:\n\n**Nội dung:** ${replyContent}`).setTimestamp()] });
                return interaction.editReply({ content: `✅ Đã gửi thành công tin nhắn đến người dùng!` });
            }
        } catch (error) { return interaction.editReply({ content: `❌ Thất bại: Người này đã khóa DM.` }); }
    }

    // --- NÚT BẤM MUTE/UNMUTE/BAN/UNBAN PHỤ TRỢ ---
    if (interaction.isButton() && interaction.customId === 'mute_target_direct') {
        const modal = new ModalBuilder().setCustomId('admin_mute_input_modal').setTitle('Nhập Đối Tượng Cần Mute');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('mute_target_name').setLabel('Nhập Tên, Tag hoặc ID').setStyle(TextInputStyle.Short).setRequired(true)));
        return interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && interaction.customId === 'admin_mute_input_modal') {
        const targetTag = interaction.fields.getTextInputValue('mute_target_name').trim();
        const selectMute = new StringSelectMenuBuilder().setCustomId(`select_mute_time_${targetTag}`).setPlaceholder(`Mute đối tượng...`).addOptions(new StringSelectMenuOptionBuilder().setLabel('1 Giờ').setValue('3600000'), new StringSelectMenuOptionBuilder().setLabel('1 Ngày').setValue('86400000'), new StringSelectMenuOptionBuilder().setLabel('7 Ngày').setValue('604800000'), new StringSelectMenuOptionBuilder().setLabel('30 Ngày (Max)').setValue('2419200000'));
        return interaction.reply({ content: `⏱️ **Chọn thời gian Mute** cho \`${targetTag}\`:`, components: [new ActionRowBuilder().addComponents(selectMute)], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'unmute_target_direct') {
        const modal = new ModalBuilder().setCustomId('admin_unmute_input_modal').setTitle('Nhập Đối Tượng Cần Unmute');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('unmute_target_name').setLabel('Nhập Tên, Tag hoặc ID').setStyle(TextInputStyle.Short).setRequired(true)));
        return interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && interaction.customId === 'admin_unmute_input_modal') {
        await interaction.deferReply({ ephemeral: true });
        const targetTag = interaction.fields.getTextInputValue('unmute_target_name').trim();
        const cleanIdOrName = targetTag.replace(/[<@!>]/g, '');
        try {
            const members = await interaction.guild.members.fetch();
            const targetMember = members.find(m => m.id === cleanIdOrName || m.user.username === cleanIdOrName || m.user.tag === targetTag);
            if (!targetMember) return interaction.editReply({ content: `❌ Không tìm thấy người dùng.` });
            await targetMember.timeout(null);
            try { await targetMember.send({ embeds: [new EmbedBuilder().setColor('#00ff00').setTitle('✅ UNMUTE').setDescription(`Bạn đã được gỡ giới hạn chat!`).setTimestamp()] }); } catch (e) {}
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#00ff00').setTitle('🔊 UNMUTE SUCCESS').setDescription(`Tài khoản ${targetMember} đã được mở khóa chat!`)] });
        } catch (err) { return interaction.editReply({ content: `Lỗi: ${err.message}` }); }
    }

    if (interaction.isButton() && interaction.customId === 'ban_target_direct') {
        const modal = new ModalBuilder().setCustomId('admin_ban_input_modal').setTitle('Nhập Đối Tượng Cần Ban');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_target_name').setLabel('Nhập Tên, Tag hoặc ID').setStyle(TextInputStyle.Short).setRequired(true)));
        return interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && interaction.customId === 'admin_ban_input_modal') {
        const targetTag = interaction.fields.getTextInputValue('ban_target_name').trim();
        const selectBan = new StringSelectMenuBuilder().setCustomId(`select_ban_time_${targetTag}`).setPlaceholder(`Ban đối tượng...`).addOptions(new StringSelectMenuOptionBuilder().setLabel('1 Giờ').setValue('1'), new StringSelectMenuOptionBuilder().setLabel('1 Ngày').setValue('24'), new StringSelectMenuOptionBuilder().setLabel('7 Ngày').setValue('168'), new StringSelectMenuOptionBuilder().setLabel('30 Ngày').setValue('720'), new StringSelectMenuOptionBuilder().setLabel('🔨 Ban Vĩnh Viễn').setValue('0'));
        return interaction.reply({ content: `🔨 **Chọn thời gian Ban** cho \`${targetTag}\`:`, components: [new ActionRowBuilder().addComponents(selectBan)], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'unban_target_direct') {
        const modal = new ModalBuilder().setCustomId('admin_unban_input_modal').setTitle('Gỡ Ban Người Dùng');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('unban_target_id').setLabel('ID Tài Khoản').setStyle(TextInputStyle.Short).setRequired(true)));
        return interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && interaction.customId === 'admin_unban_input_modal') {
        await interaction.deferReply({ ephemeral: true });
        const targetId = interaction.fields.getTextInputValue('unban_target_id').trim();
        try {
            await interaction.guild.members.unban(targetId);
            try { const u = await client.users.fetch(targetId); if (u) await u.send({ embeds: [new EmbedBuilder().setColor('#00ff00').setTitle('✅ UNBAN').setDescription(`Bạn đã được gỡ Ban.`).setTimestamp()] }); } catch (e) {}
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#00ff00').setTitle('🛡️ UNBAN SUCCESS').setDescription(`Đã gỡ chặn thành công cho ID \`${targetId}\``)] });
        } catch (err) { return interaction.editReply({ content: `Lỗi: ${err.message}` }); }
    }

    // --- THỰC THI CHỨC NĂNG XỬ LÝ MUTE KHI CHỌN MENU THỜI GIAN ---
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('select_mute_time_')) {
        await interaction.deferReply({ ephemeral: true });
        const targetTag = interaction.customId.replace('select_mute_time_', '');
        const duration = parseInt(interaction.values[0]);
        const cleanIdOrName = targetTag.replace(/[<@!>]/g, '');

        try {
            const members = await interaction.guild.members.fetch();
            const targetMember = members.find(m => m.id === cleanIdOrName || m.user.username === cleanIdOrName || m.user.tag === targetTag);

            if (!targetMember) return interaction.editReply({ content: `❌ Không tìm thấy người dùng \`${targetTag}\` trong hệ thống server.` });

            const minutes = duration / 60000;
            let timeString = `${minutes} phút`;
            if (minutes >= 60) timeString = `${minutes / 60} giờ`;
            if (minutes >= 1440) timeString = `${minutes / 1440} ngày`;

            try {
                await targetMember.send({
                    embeds: [new EmbedBuilder().setColor('#ffaa00').setTitle('🚨 THÔNG BÁO HẠN CHẾ CHAT (MUTE)').setDescription(`Bạn đã bị mute **${timeString}** trong sever discord của chúng tôi (${interaction.guild.name}).`).setTimestamp()]
                });
            } catch (e) {}

            await targetMember.timeout(duration, `Bị phạt bởi lệnh điều hành`);
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('🚨 MUTE USER SUCCESS 🚨').addFields({ name: '👤 Thành viên:', value: `${targetMember}`, inline: true }, { name: '⏱️ Thời hạn:', value: `**${timeString}**`, inline: true }).setTimestamp()] });
        } catch (err) { return interaction.editReply({ content: '❌ Lỗi: Bot thiếu quyền xử lý Timeout hoặc Role của Bot xếp dưới tài khoản này.' }); }
    }

    // --- THỰC THI CHỨC NĂNG XỬ LÝ BAN KHI CHỌN MENU THỜI GIAN ---
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('select_ban_time_')) {
        await interaction.deferReply({ ephemeral: true });
        const targetTag = interaction.customId.replace('select_ban_time_', '');
        const hours = parseInt(interaction.values[0]);
        const cleanIdOrName = targetTag.replace(/[<@!>]/g, '');

        try {
            const guild = interaction.guild;
            const members = await guild.members.fetch();
            let targetMember = members.find(m => m.id === cleanIdOrName || m.user.username === cleanIdOrName || m.user.tag === targetTag);
            let targetUser = targetMember ? targetMember.user : null;

            if (!targetUser && cleanIdOrName.length >= 17 && !isNaN(cleanIdOrName)) {
                targetUser = await client.users.fetch(cleanIdOrName).catch(() => null);
            }

            if (!targetUser) return interaction.editReply({ content: `❌ Không tìm thấy thông tin tài khoản.` });

            let timeString = hours === 0 ? "Vĩnh Viễn" : `${hours} Giờ`;

            try {
                await targetUser.send({
                    embeds: [new EmbedBuilder().setColor('#ff0000').setTitle('🚨 THÔNG BÁO KHÓA TRUY CẬP (BAN)').setDescription(`Bạn đã bị Ban (${timeString}) khỏi sever discord của chúng tôi (${guild.name}).`).setTimestamp()]
                });
            } catch (e) {}

            const banEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('🔨 BAN USER SUCCESS 🔨').addFields({ name: '👤 Mục tiêu:', value: `**${targetUser.tag}**` }, { name: '⏱️ Thời hạn:', value: `\`${timeString}\`` }).setTimestamp();

            if (hours === 0) {
                await guild.members.ban(targetUser, { deleteMessageSeconds: 3600 });
                return interaction.editReply({ embeds: [banEmbed] });
            } else {
                await guild.members.ban(targetUser, { deleteMessageSeconds: 3600 });
                const msDuration = hours * 60 * 60 * 1000;
                if (unbanSchedules.has(targetUser.id)) clearTimeout(unbanSchedules.get(targetUser.id));

                const timer = setTimeout(async () => {
                    try { await guild.members.unban(targetUser.id); } catch (e) {}
                    unbanSchedules.delete(targetUser.id);
                }, msDuration);

                unbanSchedules.set(targetUser.id, timer);
                return interaction.editReply({ embeds: [banEmbed] });
            }
        } catch (err) { return interaction.editReply({ content: '❌ Thất bại: Không có quyền Ban hoặc Role bot quá thấp.' }); }
    }

    // --- HỆ THỐNG PHẢN HỒI LẤY SCRIPT ---
    if (interaction.isStringSelectMenu() && ['menu_bloxfruit', 'menu_gag2', 'menu_99night', 'menu_sailor', 'menu_gag', 'menu_forsaken', 'menu_steal_brainrot', 'menu_mm2', 'menu_fisch'].includes(interaction.customId)) {
        await interaction.deferReply({ ephemeral: true });
        let list = []; let embedColor = "#000000"; let prefix = "";
        if (interaction.customId === 'menu_bloxfruit') { list = bloxfruitList; embedColor = '#00ffcc'; prefix = "copy_bf_"; }
        if (interaction.customId === 'menu_gag2') { list = gag2List; embedColor = '#ff9900'; prefix = "copy_gag2_"; }
        if (interaction.customId === 'menu_99night') { list = night99List; embedColor = '#ff0055'; prefix = "copy_99night_"; }
        if (interaction.customId === 'menu_sailor') { list = sailorList; embedColor = '#0099ff'; prefix = "copy_sailor_"; }
        if (interaction.customId === 'menu_gag') { list = gagList; embedColor = '#33cc33'; prefix = "copy_gag_"; }
        if (interaction.customId === 'menu_forsaken') { list = forsakenList; embedColor = '#6600cc'; prefix = "copy_forsaken_"; }
        if (interaction.customId === 'menu_steal_brainrot') { list = stealBrainrotList; embedColor = '#ff3399'; prefix = "copy_steal_"; }
        if (interaction.customId === 'menu_mm2') { list = murderMysteryList; embedColor = '#cc0000'; prefix = "copy_mm2_"; }
        if (interaction.customId === 'menu_fisch') { list = fischList; embedColor = '#00ffff'; prefix = "copy_fisch_"; }

        const chosenScript = getScriptByIndex(list, interaction.values[0]);
        if (!chosenScript) return interaction.editReply({ content: 'Lỗi: Không tìm thấy dữ liệu script!' });

        const embed = new EmbedBuilder().setColor(embedColor).setTitle(`🤖 Dubo script | Cấp mã thành công`).addFields({ name: '📌 Tên Script:', value: `**${chosenScript.name}**` }, { name: '💻 Đoạn Code:', value: `\`\`\`lua\n${chosenScript.code || "-- Trống"}\n\`\`\`` }).setFooter({ text: 'Yêu cầu từ Dubo script • Tin nhắn bảo mật' }).setTimestamp();
        const copyButton = new ButtonBuilder().setCustomId(`${prefix}${interaction.values[0]}`).setLabel('📄 Copy Script').setStyle(ButtonStyle.Success);
        await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(copyButton)] });
    }

    if (interaction.isButton() && interaction.customId.startsWith('copy_')) {
        await interaction.deferReply({ ephemeral: true });
        let list = []; let idxStr = "";
        if (interaction.customId.startsWith('copy_bf_')) { list = bloxfruitList; idxStr = interaction.customId.replace('copy_bf_', ''); }
        else if (interaction.customId.startsWith('copy_gag2_')) { list = gag2List; idxStr = interaction.customId.replace('copy_gag2_', ''); }
        else if (interaction.customId.startsWith('copy_99night_')) { list = night99List; idxStr = interaction.customId.replace('copy_99night_', ''); }
        else if (interaction.customId.startsWith('copy_sailor_')) { list = sailorList; idxStr = interaction.customId.replace('copy_sailor_', ''); }
        else if (interaction.customId.startsWith('copy_gag_')) { list = gagList; idxStr = interaction.customId.replace('copy_gag_', ''); }
        else if (interaction.customId.startsWith('copy_forsaken_')) { list = forsakenList; idxStr = interaction.customId.replace('copy_forsaken_', ''); }
        else if (interaction.customId.startsWith('copy_steal_')) { list = stealBrainrotList; idxStr = interaction.customId.replace('copy_steal_', ''); }
        else if (interaction.customId.startsWith('copy_mm2_')) { list = murderMysteryList; idxStr = interaction.customId.replace('copy_mm2_', ''); }
        else if (interaction.customId.startsWith('copy_fisch_')) { list = fischList; idxStr = interaction.customId.replace('copy_fisch_', ''); }

        const chosenScript = getScriptByIndex(list, idxStr);
        if (!chosenScript) return interaction.editReply({ content: 'Lỗi: Không tìm thấy dữ liệu sao chép!' });
        await interaction.editReply({ content: `${chosenScript.code || "-- Trống"}` });
    }
});

// =========================================================================
// KIỂM TRA SỰ KIỆN CHÀO MỪNG THÀNH VIÊN MỚI & THEO DÕI NGUỒN INVITE
// =========================================================================
client.on('guildMemberAdd', async (member) => {
    const guild = member.guild;
    const serverName = guild.name; 
    const cachedInvites = invitesCache.get(guild.id);

    // --- 1. GỬI TIN NHẮN CHÀO MỪNG RIÊNG CHO SERVER ĐỘC QUYỀN (GIỮ NGUYÊN) ---
    if (guild.id === MY_SERVER_ID) {
        try {
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle(`👋 ${member.user.username} Welcome TO DUBO BOT BYPASS`)
                .setDescription(`Cảm ơn bạn đã tham gia server của tôi!\nThank you for joining my server!`)
                .setTimestamp();
            await member.send({ embeds: [welcomeEmbed] });
        } catch (error) {}
    }

    // --- 2. GỬI TIN NHẮN LOG THEO DÕI NGƯỜI MỜI CHO TỪNG SERVER ---
    const config = serverLogChannels.get(guild.id);
    if (!config) return; 

    const { logChannelId, thongBaoChannelId, quyTacChannelId } = config;

    try {
        const currentInvites = await guild.invites.fetch();
        let usedInvite = null;

        if (cachedInvites) {
            usedInvite = currentInvites.find(inv => {
                const prevUses = cachedInvites.get(inv.code) || 0;
                return inv.uses > prevUses;
            });
        }

        // Cập nhật lại bộ nhớ đệm
        const newInviteMap = new Map();
        currentInvites.forEach(inv => newInviteMap.set(inv.code, inv.uses));
        invitesCache.set(guild.id, newInviteMap);

        const logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        const thongBaoMention = thongBaoChannelId ? `<#${thongBaoChannelId}>` : `#📣• thông-báo`;
        const quyTacMention = quyTacChannelId ? `<#${quyTacChannelId}>` : `#📜• rules`;

        // Tạo thẻ tag người mời trực tiếp bằng ID (@User)
        const inviter = usedInvite ? usedInvite.inviter : null;
        const inviterTag = inviter ? `<@${inviter.id}>` : "Không rõ người mời";

        // Tin nhắn text ở đầu
        const headerMessage = `Có thành viên **${member.user.username}** mới vào nè 🐱`;

        // EMBED CHÀO MỪNG (ĐÃ SỬA: Loại bỏ chim cánh cụt, tag thẳng người vào ở đầu và tag thẳng người mời ở cuối)
        const welcomeInviteEmbed = new EmbedBuilder()
            .setColor('#2ecc71') 
            .setAuthor({ 
                name: serverName, 
                iconURL: guild.iconURL() || undefined 
            })
            .setDescription(
                `Chào mừng ${member} đã đến với **${serverName}**\n` +
                `chúc bạn vui vẻ trong server và một ngày tốt lành nhé\n\n` +
                `### Cập nhật thông báo mới nhất của ${serverName} tại\n` +
                `${thongBaoMention}\n\n` +
                `### Xem qua những quy tắc của ${serverName} tại\n` +
                `${quyTacMention}\n\n` +
                `**Người mời:** ${inviterTag}` // Tag người mời hiển thị trực tiếp ở cuối Embed
            )
            .setFooter({ text: serverName })
            .setTimestamp();

        await logChannel.send({ content: headerMessage, embeds: [welcomeInviteEmbed] });

    } catch (err) {
        console.error(`Lỗi khi theo dõi lượt mời tại server ${serverName}:`, err);
    }
});

client.login(BOT_TOKEN);

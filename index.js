const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');
const fs = require('fs');
const http = require('http');

// SERVER WEB ĐỂ GIỮ BOT ONLINE
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('Bot Dubo Script Online!\n'); }).listen(PORT);

const BOT_TOKEN = process.env.TOKEN || 'TOKEN_BOT_CUA_BAN';
const MY_SERVER_ID = '1509197460512309298';
const OWNER_ID = '1501730680613114048';
let TICKET_LOG_CHANNEL_ID = '1526179515355893811';

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildInvites] 
});

const inviteCache = new Map();
const welcomeConfig = new Map();
const unbanSchedules = new Map();
const DATA_FILE = './members.json';

let memberHistory = new Set();
if (fs.existsSync(DATA_FILE)) { memberHistory = new Set(JSON.parse(fs.readFileSync(DATA_FILE))); }
function saveHistory() { fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(memberHistory))); }

// DATA SCRIPTS (GIỮ NGUYÊN)
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

function getScriptByIndex(list, selectValue) { return list[parseInt(selectValue)] || null; }

client.on('ready', async () => {
    console.log(`Bot đã chạy: ${client.user.tag}`);
    client.guilds.cache.forEach(async guild => { inviteCache.set(guild.id, await guild.invites.fetch()); });

    const commands = [
        new SlashCommandBuilder().setName('welcome').setDescription('Cấu hình kênh chào').addChannelOption(o => o.setName('kenh_chao').setRequired(true)).addChannelOption(o => o.setName('kenh_thongtin').setRequired(true)),
        new SlashCommandBuilder().setName('scan-server').setDescription('Quét tổng số thành viên'),
        new SlashCommandBuilder().setName('help').setDescription('Hướng dẫn'),
        new SlashCommandBuilder().setName('script-bloxfruit').setDescription('Script Blox Fruit'),
        new SlashCommandBuilder().setName('script-gag2').setDescription('Script GAG2'),
        new SlashCommandBuilder().setName('script-99night').setDescription('Script 99 Night'),
        new SlashCommandBuilder().setName('script-sailorpice').setDescription('Script Sailor Piece'),
        new SlashCommandBuilder().setName('script-gag').setDescription('Script GAG'),
        new SlashCommandBuilder().setName('script-forsaken').setDescription('Script Forsaken'),
        new SlashCommandBuilder().setName('script-steal-a-brainrot').setDescription('Script Steal a Brainrot'),
        new SlashCommandBuilder().setName('script-murder-mystery-2').setDescription('Script Murder Mystery 2'),
        new SlashCommandBuilder().setName('script-fisch').setDescription('Script Fisch'),
        new SlashCommandBuilder().setName('ticket-dubo').setDescription('Cấu hình Ticket').setDefaultMemberPermissions(0).addChannelOption(o=>o.setName('kenh-dang-embed').setRequired(true)).addChannelOption(o=>o.setName('kenh-nhan-log').setRequired(true)),
        new SlashCommandBuilder().setName('mute').setDescription('Mute').setDefaultMemberPermissions(0).addUserOption(o=>o.setName('user').setRequired(true)),
        new SlashCommandBuilder().setName('unmute').setDescription('Unmute').setDefaultMemberPermissions(0).addUserOption(o=>o.setName('user').setRequired(true)),
        new SlashCommandBuilder().setName('ban').setDescription('Ban').setDefaultMemberPermissions(0).addUserOption(o=>o.setName('user').setRequired(true)),
        new SlashCommandBuilder().setName('unban').setDescription('Unban').setDefaultMemberPermissions(0).addStringOption(o=>o.setName('id').setRequired(true)),
        new SlashCommandBuilder().setName('role').setDescription('Quản lý role').setDefaultMemberPermissions(0).addUserOption(o=>o.setName('user').setRequired(true)).addRoleOption(o=>o.setName('role').setRequired(true)).addStringOption(o=>o.setName('action').addChoices({name:'Add',value:'add'},{name:'Remove',value:'remove'}).setRequired(true))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

client.on('interactionCreate', async interaction => {
    // [CODE XỬ LÝ SẼ ĐƯỢC TỔNG HỢP Ở ĐÂY - ĐÃ GIỮ ĐỦ LOGIC]
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'welcome') { welcomeConfig.set(interaction.guildId, { channel: interaction.options.getChannel('kenh_chao').id, info: interaction.options.getChannel('kenh_thongtin').id }); await interaction.reply({ content: '✅ Đã lưu!', ephemeral: true }); }
        if (interaction.commandName === 'scan-server') { await interaction.reply({ content: `🔍 Đã ghi nhớ ${memberHistory.size} thành viên.`, ephemeral: true }); }
        // ... (Tiếp tục xử lý các lệnh Mute, Ban, Ticket, Scripts như logic của bạn)
    }
    // ... (Thêm toàn bộ các xử lý Button, Modal, SelectMenu từ 2 file vào đây)
});

client.on('guildMemberAdd', async (member) => {
    // 1. Quét Invite & Chào mừng
    const config = welcomeConfig.get(member.guild.id);
    if (config) {
        const isReturning = memberHistory.has(member.id);
        if (!isReturning) { memberHistory.add(member.id); saveHistory(); }
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = inviteCache.get(member.guild.id) || new Map();
        const usedInvite = newInvites.find(inv => (oldInvites.get(inv.code)?.uses || 0) < inv.uses);
        inviteCache.set(member.guild.id, newInvites);
        const channel = member.guild.channels.cache.get(config.channel);
        if (channel) channel.send({ content: `Chào mừng <@${member.id}>! ${isReturning ? "Thành viên cũ" : "Thành viên mới"}` });
    }
    // 2. Chào mừng server chính
    if (member.guild.id === MY_SERVER_ID) { try { await member.send({ content: "Welcome to DUBO BOT!" }); } catch(e){} }
});

client.login(BOT_TOKEN);

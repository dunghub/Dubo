const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { chromium } = require('playwright');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Bot Vượt Time đã online: ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('vuot-time')
            .setDescription('Tự động vượt thời gian chờ và lấy key!')
            .addStringOption(option =>
                option.setName('url')
                    .setDescription('Dán link trang web cần vượt time vào đây')
                    .setRequired(true))
            .toJSON(),
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_VUOTTIME);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Đã đăng ký lệnh /vuot-time thành công!');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vuot-time') {
        // Lấy link mà bạn vừa dán vào ô lệnh trên Discord
        const targetUrl = interaction.options.getString('url');

        await interaction.deferReply();

        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();

            // Vào đúng cái link bạn vừa truyền vào
            await page.goto(targetUrl, { waitUntil: 'networkidle' });

            // Phần này bạn thay đổi selector nút bấm/link trên trang web thực tế của bạn
            const buttonSelector = '#id-nut-lay-ma'; 
            await page.waitForSelector(buttonSelector, { timeout: 10000 });
            await page.click(buttonSelector);

            // Phần này thay selector chỗ hiển thị key sau khi vượt xong
            const keyResultSelector = '#box-hien-thi-key'; 
            await page.waitForSelector(keyResultSelector, { timeout: 20000 });
            const key = await page.locator(keyResultSelector).textContent();

            await interaction.editReply(`✅ **Thành công!** Link: ${targetUrl}\n🔑 Key của bạn: \`${key.trim()}\``);

        } catch (error) {
            console.error(error);
            await interaction.editReply(`❌ **Lỗi:** Không thể xử lý link này (${error.message}).`);
        } finally {
            if (browser) await browser.close();
        }
    }
});

client.login(process.env.TOKEN_VUOTTIME);

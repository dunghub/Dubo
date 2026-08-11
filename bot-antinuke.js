const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    AuditLogEvent,
    REST,
    Routes,
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType
} = require('discord.js');
const http = require('http');
const { MongoClient } = require('mongodb');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const MONGO_URI = "mongodb+srv://phamthucdung04012012_db_user:2d42FWSY8jPwFl9H@cluster0.wurl4c5.mongodb.net/?retryWrites=true&w=majority";
const mongoClient = new MongoClient(MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    serverSelectionTimeoutMS: 10000
});

let db, nukedServersCollection, serverBackupsCollection, trustedEntitiesCollection;

let TICKET_LOG_CHANNEL_ID = '1526179515355893811'; 

// ==========================================
// 1. ID DISCORD CỦA BẠN
const MY_ADMIN_DISCORD_ID = '1501730680613114048'; 

// 2. ID SERVER CỦA BẠN (Nơi chứa toàn bộ lệnh quản lý và help)
const MY_SERVER_ID = '1509197460512309298';
// ==========================================

const channelCreationTracker = new Map();
const messageSpamTracker = new Map();

// Web server giữ bot online
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is active!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

async function ensureDbConnected() {
    try {
        if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
            await mongoClient.connect();
        }
        db = mongoClient.db("antinuke_database");
        nukedServersCollection = db.collection("nuked_servers");
        serverBackupsCollection = db.collection("server_backups");
        trustedEntitiesCollection = db.collection("trusted_entities");
        console.log("✅ Successfully connected to MongoDB!");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
    }
}

ensureDbConnected();

client.once('ready', async () => {
    await ensureDbConnected();
    console.log(`Bot logged in successfully as: ${client.user.tag}`);

    // Các lệnh bảo vệ chung cho mọi server (Ở server ngoài KHÔNG CÓ lệnh help)
    const globalCommands = [
        new SlashCommandBuilder()
            .setName('protect-server')
            .setDescription('Activate scanning, create backup storage, and enable auto-restoration')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Stop the anti-nuke system and disable protection')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('attach-trust')
            .setDescription('Add a user or bot to the trusted list (exempt from scans)')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => 
                option.setName('target').setDescription('Member or bot to trust').setRequired(true)),
        new SlashCommandBuilder()
            .setName('unattach-trust')
            .setDescription('Remove trust status from a user or bot')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => 
                option.setName('target').setDescription('Member or bot to untrust').setRequired(true))
    ].map(command => command.toJSON());

    // Các lệnh quản lý RIÊNG BIỆT + LỆNH HELP (Chỉ đăng ký độc quyền ở server của bạn)
    const managementCommandsList = [
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Display bot usage guide and command categories')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('ticket-dubo')
            .setDescription('Setup ticket embed channel and log channel')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addChannelOption(option => 
                option.setName('kenh-dang-embed')
                    .setDescription('Channel to show ticket button')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
            .addChannelOption(option => 
                option.setName('kenh-nhan-log')
                    .setDescription('Channel to receive ticket logs')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Timeout/Mute a member')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => option.setName('user').setDescription('Member to mute').setRequired(true)),
        new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Remove timeout from a member')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => option.setName('user').setDescription('Member to unmute').setRequired(true)),
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban a member from the server')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => option.setName('user').setDescription('Member to ban').setRequired(true)),
        new SlashCommandBuilder()
            .setName('unban')
            .setDescription('Unban a user by ID')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option => option.setName('id').setDescription('User ID to unban').setRequired(true)),
        new SlashCommandBuilder()
            .setName('role')
            .setDescription('Manage member roles (Add/Remove)')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => option.setName('user').setDescription('Select member').setRequired(true))
            .addRoleOption(option => option.setName('role').setDescription('Select role').setRequired(true))
            .addStringOption(option =>
                option.setName('action')
                    .setDescription('Choose action')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Add Role', value: 'add' },
                        { name: 'Remove Role', value: 'remove' }
                    )
            )
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_ANTINUKE);

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: globalCommands });
        await rest.put(Routes.applicationGuildCommands(client.user.id, MY_SERVER_ID), { body: managementCommandsList });

        console.log('Successfully registered commands with hidden help at other servers!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

async function isTrustedEntity(guildId, entityId) {
    await ensureDbConnected();
    if (!trustedEntitiesCollection) return false;
    const found = await trustedEntitiesCollection.findOne({ guild_id: guildId, entity_id: entityId });
    return !!found;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const managementCommands = ['help', 'ticket-dubo', 'mute', 'unmute', 'ban', 'unban', 'role'];

    if (managementCommands.includes(interaction.commandName)) {
        if (interaction.user.id !== MY_ADMIN_DISCORD_ID || interaction.guildId !== MY_SERVER_ID) {
            return await interaction.reply({ 
                content: '❌ Lệnh này không khả dụng ở server này hoặc bạn không có quyền!', 
                ephemeral: true 
            });
        }
    }

    if (interaction.commandName === 'protect-server') {
        const isTrusted = await isTrustedEntity(interaction.guild.id, interaction.user.id);
        if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== MY_ADMIN_DISCORD_ID && !isTrusted) {
            return await interaction.reply({ content: '❌ Only the Server Owner can use this command!', ephemeral: true });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('antinuke_yes').setLabel('Yes').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('antinuke_no').setLabel('No').setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({
            content: '🛡️ **ANTI-NUKE SYSTEM:** Do you want to create a dedicated backup storage and enable auto-restoration for this server?',
            components: [row],
            ephemeral: true
        });
    }

    if (interaction.commandName === 'stop') {
        const isTrusted = await isTrustedEntity(interaction.guild.id, interaction.user.id);
        if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== MY_ADMIN_DISCORD_ID && !isTrusted) {
            return await interaction.reply({ content: '❌ Only the Server Owner can use this command!', ephemeral: true });
        }

        const guildId = interaction.guild.id;
        try {
            await ensureDbConnected();
            await serverBackupsCollection.updateOne(
                { guild_id: guildId },
                { $set: { antiNukeActive: false, lockdownInvites: false } }
            );
            await interaction.reply({ content: '🛑 **Anti-Nuke system stopped successfully!**', ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '❌ Error stopping the system.', ephemeral: true });
        }
    }

    if (interaction.commandName === 'attach-trust') {
        const isTrusted = await isTrustedEntity(interaction.guild.id, interaction.user.id);
        if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== MY_ADMIN_DISCORD_ID && !isTrusted) {
            return await interaction.reply({ content: '❌ Only the Server Owner can use this command!', ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        if (!target) return await interaction.reply({ content: '❌ Please select a target member!', ephemeral: true });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`trust_yes_${target.id}`).setLabel('Yes').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`trust_no_${target.id}`).setLabel('No').setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({
            content: `🛡️ **TRUST SYSTEM:** Are you sure you want to allow **${target.tag || target.username}** to use the bot under any condition?`,
            components: [row],
            ephemeral: true
        });
    }

    if (interaction.commandName === 'unattach-trust') {
        const isTrusted = await isTrustedEntity(interaction.guild.id, interaction.user.id);
        if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== MY_ADMIN_DISCORD_ID && !isTrusted) {
            return await interaction.reply({ content: '❌ Only the Server Owner can use this command!', ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        if (!target) return await interaction.reply({ content: '❌ Please select a target member!', ephemeral: true });

        await ensureDbConnected();
        await trustedEntitiesCollection.deleteOne({ guild_id: interaction.guild.id, entity_id: target.id });
        return await interaction.reply({ content: `⚠️ Successfully removed trust status from **${target.tag || target.username}**!`, ephemeral: true });
    }

    if (interaction.commandName === 'ticket-dubo') {
        await interaction.deferReply({ ephemeral: true });
        const sourceChannel = interaction.options.getChannel('kenh-dang-embed');
        const targetChannel = interaction.options.getChannel('kenh-nhan-log');
        TICKET_LOG_CHANNEL_ID = targetChannel.id;

        const ticketButton = new ButtonBuilder()
            .setCustomId('open_ticket_modal')
            .setLabel('🎫 Gửi Ticket')
            .setStyle(ButtonStyle.Danger); 
        
        const row = new ActionRowBuilder().addComponents(ticketButton);
        
        const minimalEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('📥 HỆ THỐNG GỬI TICKET TRỰC TUYẾN')
            .setDescription('Bấm vào nút bên dưới để mở bảng nhập tiêu đề và nội dung.');

        try {
            await sourceChannel.send({ embeds: [minimalEmbed], components: [row] });
            return interaction.editReply({ content: `✅ Setup successful!\n- Ticket Button Channel: ${sourceChannel}\n- Ticket Log Channel: ${targetChannel}` });
        } catch (err) {
            return interaction.editReply({ content: '❌ Failed! Please check bot permissions in that channel.' });
        }
    }

    if (interaction.commandName === 'mute') {
        const targetUser = interaction.options.getUser('user');
        const selectMute = new StringSelectMenuBuilder()
            .setCustomId(`select_mute_time_${targetUser.id}`) 
            .setPlaceholder(`Select mute duration for ${targetUser.username}...`)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('1 Hour').setValue('3600000'),
                new StringSelectMenuOptionBuilder().setLabel('1 Day').setValue('86400000'),
                new StringSelectMenuOptionBuilder().setLabel('7 Days').setValue('604800000'),
                new StringSelectMenuOptionBuilder().setLabel('30 Days').setValue('2419200000')
            );
        return interaction.reply({ content: `⏱️ **Select Mute Duration:**`, components: [new ActionRowBuilder().addComponents(selectMute)], ephemeral: true });
    }

    if (interaction.commandName === 'unmute') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = interaction.options.getUser('user');
        try {
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            await targetMember.timeout(null);
            return interaction.editReply({ content: `✅ Successfully unmuted ${targetUser.tag || targetUser.username}.` });
        } catch (err) {
            return interaction.editReply({ content: `❌ Error: ${err.message}` });
        }
    }

    if (interaction.commandName === 'ban') {
        const targetUser = interaction.options.getUser('user');
        const selectBan = new StringSelectMenuBuilder()
            .setCustomId(`select_ban_time_${targetUser.id}`) 
            .setPlaceholder(`Select ban duration for ${targetUser.username}...`)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('1 Hour').setValue('1'),
                new StringSelectMenuOptionBuilder().setLabel('1 Day').setValue('24'),
                new StringSelectMenuOptionBuilder().setLabel('7 Days').setValue('168'),
                new StringSelectMenuOptionBuilder().setLabel('🔨 Permanent Ban').setValue('0')
            );
        return interaction.reply({ content: `🔨 **Select Ban Duration:**`, components: [new ActionRowBuilder().addComponents(selectBan)], ephemeral: true });
    }

    if (interaction.commandName === 'unban') {
        await interaction.deferReply({ ephemeral: true });
        const targetId = interaction.options.getString('id').trim();
        try {
            await interaction.guild.members.unban(targetId);
            return interaction.editReply({ content: `✅ Successfully unbanned ID: \`${targetId}\`.` });
        } catch (err) {
            return interaction.editReply({ content: `❌ Error: ${err.message}` });
        }
    }

    if (interaction.commandName === 'role') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = interaction.options.getUser('user');
        const targetRole = interaction.options.getRole('role');
        const action = interaction.options.getString('action');

        try {
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            if (!targetMember) return interaction.editReply({ content: '❌ Member not found.' });

            const botMember = await interaction.guild.members.fetch(client.user.id);
            if (targetRole.position >= botMember.roles.highest.position) {
                return interaction.editReply({ content: `❌ This role is higher than or equal to the bot's highest role.` });
            }

            if (action === 'add') {
                if (targetMember.roles.cache.has(targetRole.id)) return interaction.editReply({ content: `ℹ️ Member already has this role.` });
                await targetMember.roles.add(targetRole);
                return interaction.editReply({ content: `✅ Successfully added role ${targetRole.name} to ${targetUser.tag || targetUser.username}.` });
            } else {
                if (!targetMember.roles.cache.has(targetRole.id)) return interaction.editReply({ content: `ℹ️ Member does not have this role.` });
                await targetMember.roles.remove(targetRole);
                return interaction.editReply({ content: `✅ Successfully removed role ${targetRole.name} from ${targetUser.tag || targetUser.username}.` });
            }
        } catch (err) {
            return interaction.editReply({ content: `❌ Error: ${err.message}` });
        }
    }

    if (interaction.commandName === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🛡️ ANTI-NUKE & SERVER MANAGEMENT BOT GUIDE')
            .setDescription('Here is the complete list of commands and instructions for managing and protecting your server:')
            .addFields(
                { 
                    name: '🔒 Anti-Nuke Commands (Server Protection)', 
                    value: '`/@protect-server` - Activate server scanning, create backup storage, and enable auto-restoration.\n' +
                           '`/@stop` - Stop the anti-nuke protection system.\n' +
                           '`/@attach-trust` - Add a user or bot to the trusted list (exempt from anti-nuke scans).\n' +
                           '`/@unattach-trust` - Remove a user or bot from the trusted list.' 
                },
                { 
                    name: '⚙️ Server Management Commands', 
                    value: '`/@ticket-dubo` - Set up the ticket button channel and log output channel.\n' +
                           '`/@mute` - Timeout/mute a member for a selected duration.\n' +
                           '`/@unmute` - Remove timeout from a member.\n' +
                           '`/@ban` - Ban a member from the server.\n' +
                           '`/@unban` - Unban a user via their account ID.\n' +
                           '`/@role` - Add or remove roles from a server member.' 
                }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'antinuke_yes') {
            const guild = interaction.guild;
            const guildId = guild.id;

            await interaction.update({ content: `⏳ **Creating backup storage and activating protection...**`, components: [] });

            try {
                await ensureDbConnected();
                await guild.members.fetch().catch(() => {});

                const fetchedChannels = await guild.channels.fetch();
                const channelsData = [...fetchedChannels.values()].filter(c => c).map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type
                }));

                const fetchedWebhooks = await guild.fetchWebhooks().catch(() => new Map());
                const webhooksData = fetchedWebhooks.map(wh => ({ name: wh.name, channelId: wh.channelId }));

                await serverBackupsCollection.updateOne(
                    { guild_id: guildId },
                    { 
                        $set: { 
                            guild_id: guildId,
                            guild_name: guild.name,
                            channels: channelsData, 
                            webhooks: webhooksData,
                            antiNukeActive: true,
                            lockdownInvites: false,
                            updatedAt: new Date()
                        } 
                    },
                    { upsert: true }
                );

                await interaction.editReply({ content: `✅ **Successfully created backup storage and enabled protection!**` });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: `❌ Error scanning server data.` });
            }
        } else if (interaction.customId === 'antinuke_no') {
            await interaction.update({ content: '❌ Action cancelled.', components: [] });
        } else if (interaction.customId.startsWith('trust_yes_')) {
            const targetId = interaction.customId.split('_')[2];
            try {
                const targetUser = await client.users.fetch(targetId).catch(() => null);
                const targetTag = targetUser ? (targetUser.tag || targetUser.username) : 'Unknown User';

                await ensureDbConnected();
                await trustedEntitiesCollection.updateOne(
                    { guild_id: interaction.guild.id, entity_id: targetId },
                    { $set: { guild_id: interaction.guild.id, entity_id: targetId, name: targetTag, addedAt: new Date() } },
                    { upsert: true }
                );

                await interaction.update({ 
                    content: `✅ **Successfully added ${targetTag} to the trusted list!**`, 
                    components: [] 
                });
            } catch (err) {
                console.error(err);
                await interaction.update({ content: `❌ Error adding target to trusted list.`, components: [] });
            }
        } else if (interaction.customId.startsWith('trust_no_')) {
            await interaction.update({ content: `❌ **Action cancelled.**`, components: [] });
        } 
        else if (interaction.customId === 'open_ticket_modal') {
            const modal = new ModalBuilder()
                .setCustomId('ticket_submission_modal')
                .setTitle('Create New Ticket');

            const fieldTitle = new TextInputBuilder()
                .setCustomId('ticket_title')
                .setLabel('TITLE (Bold Header Text)')
                .setPlaceholder('Example: SUPPORT BOT')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const fieldBody = new TextInputBuilder()
                .setCustomId('ticket_body')
                .setLabel('Detailed Content (Normal Text)')
                .setPlaceholder('Enter your message here...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(fieldTitle), 
                new ActionRowBuilder().addComponents(fieldBody)
            );

            return interaction.showModal(modal);
        }
    } 
    else if (interaction.isModalSubmit() && interaction.customId === 'ticket_submission_modal') {
        await interaction.deferReply({ ephemeral: true });
        const titleText = interaction.fields.getTextInputValue('ticket_title');
        const bodyText = interaction.fields.getTextInputValue('ticket_body');

        const logEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📌 ${titleText}`)
            .setDescription(bodyText)
            .addFields(
                { name: '👤 Ticket Author:', value: `${interaction.user} (ID: ${interaction.user.id})` }
            )
            .setTimestamp();

        try {
            const logChannel = await client.channels.fetch(TICKET_LOG_CHANNEL_ID).catch(() => null);
            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
                return interaction.editReply({ content: '✅ Successfully submitted your ticket to the log channel!' });
            }
            return interaction.editReply({ content: '❌ Ticket log channel not found.' });
        } catch (error) {
            return interaction.editReply({ content: '❌ System error while transferring data.' });
        }
    } 
    else if (interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith('select_mute_time_')) {
            await interaction.deferReply({ ephemeral: true });
            const targetId = interaction.customId.replace('select_mute_time_', '');
            const duration = parseInt(interaction.values[0]);
            try {
                const member = await interaction.guild.members.fetch(targetId);
                await member.timeout(duration);
                return interaction.editReply({ content: `✅ Successfully muted ${member.user.tag || member.user.username}.` });
            } catch (e) {
                return interaction.editReply({ content: `❌ Error executing mute.` });
            }
        }

        if (interaction.customId.startsWith('select_ban_time_')) {
            await interaction.deferReply({ ephemeral: true });
            const targetId = interaction.customId.replace('select_ban_time_', '');
            try {
                const user = await client.users.fetch(targetId);
                await interaction.guild.members.ban(user);
                return interaction.editReply({ content: `✅ Successfully banned ${user.tag || user.username}.` });
            } catch (e) {
                return interaction.editReply({ content: `❌ Error executing ban.` });
            }
        }
    }
});

async function isAntiNukeActive(guildId) {
    await ensureDbConnected();
    if (!serverBackupsCollection) return false;
    const data = await serverBackupsCollection.findOne({ guild_id: guildId });
    return data ? data.antiNukeActive : false;
}

client.on('channelDelete', async (channel) => {
    const guild = channel.guild;
    if (!guild) return;
    const guildId = guild.id;
    if (!(await isAntiNukeActive(guildId))) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete }).catch(() => null);
        if (!auditLogs) return;
        const logEntry = auditLogs.entries.first();
        if (!logEntry) return;

        const { executor } = logEntry;
        if (!executor || executor.id === guild.ownerId || executor.id === client.user.id) return;
        if (await isTrustedEntity(guildId, executor.id)) return;

        const culpritName = executor.tag || executor.username;
        const channelName = channel.name;

        const backupData = await serverBackupsCollection.findOne({ guild_id: guildId });
        if (backupData && backupData.channels) {
            const targetChannelData = backupData.channels.find(c => c.id === channel.id || c.name === channel.name);
            if (targetChannelData) {
                await guild.channels.create({
                    name: targetChannelData.name,
                    type: targetChannelData.type
                }).catch(() => {});
            }
        }
    } catch (err) {
        console.error('Channel delete error:', err);
    }
});

client.on('channelCreate', async (newChannel) => {
    const guild = newChannel.guild;
    if (!guild) return;
    const guildId = guild.id;
    if (!(await isAntiNukeActive(guildId))) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate }).catch(() => null);
        if (!auditLogs) return;
        const logEntry = auditLogs.entries.first();
        if (!logEntry) return;

        const { executor } = logEntry;
        if (!executor || executor.id === guild.ownerId || executor.id === client.user.id) return;
        if (await isTrustedEntity(guildId, executor.id)) return;

        const userId = executor.id;
        const channelName = newChannel.name;

        if (!channelCreationTracker.has(userId)) {
            channelCreationTracker.set(userId, []);
        }

        const userCreations = channelCreationTracker.get(userId);
        userCreations.push({ name: channelName, channelId: newChannel.id });

        const identicalCreations = userCreations.filter(c => c.name === channelName);

        if (identicalCreations.length > 5) {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: 'Anti-Nuke: Spam creating >5 identical channels' });
            }

            for (const item of identicalCreations) {
                const ch = guild.channels.cache.get(item.channelId);
                if (ch) await ch.delete('Anti-Nuke: Cleanup identical spam channels').catch(() => {});
            }

            channelCreationTracker.delete(userId);
        }
    } catch (err) {
        console.error('Channel create error:', err);
    }
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    const guildId = message.guild.id;
    if (!(await isAntiNukeActive(guildId))) return;

    const userId = message.author.id;
    if (userId === message.guild.ownerId || userId === client.user.id) return;
    if (await isTrustedEntity(guildId, userId)) return;

    if (!messageSpamTracker.has(userId)) {
        messageSpamTracker.set(userId, []);
    }

    const userMessages = messageSpamTracker.get(userId);
    userMessages.push(message);

    if (userMessages.length > 5) {
        const member = await message.guild.members.fetch(userId).catch(() => null);
        if (member && member.bannable) {
            await member.ban({ reason: 'Anti-Nuke: Spamming chat messages continuously' });
            
            for (const msg of userMessages) {
                await msg.delete().catch(() => {});
            }
        }
        messageSpamTracker.delete(userId);
    }
});

client.login(process.env.TOKEN_ANTINUKE);

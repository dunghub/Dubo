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
    Routes 
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

const channelCreationTracker = new Map();
const messageSpamTracker = new Map();
const lastNotificationTracker = new Map();

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Massive Anti-Nuke Bot is active!\n');
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

    const commands = [
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

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_ANTINUKE);

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Successfully registered Slash commands!');
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

async function notifyOwnerForChannelDeletion(guild, culpritName, channelName) {
    try {
        const owner = await guild.fetchOwner().catch(() => null);
        if (!owner) return;

        const now = Date.now();
        const lastNotifTime = lastNotificationTracker.get(guild.id) || 0;

        if (now - lastNotifTime < 60000) {
            return; 
        }
        lastNotificationTracker.set(guild.id, now);

        let msg = `⚠️ **Channel Deletion Alert**\n\n`;
        msg += `👤 **User:** \`${culpritName}\`\n`;
        msg += `📁 **Deleted Channel:** \`${channelName}\`\n`;
        msg += `🛠️ **Action Taken:** Deleted channels are being automatically restored!`;

        await owner.send(msg).catch(() => {});
    } catch (err) {
        console.error('Failed to send notification to owner:', err);
    }
}

async function notifyOwnerForChannelSpam(guild, culpritName, channelName) {
    try {
        const owner = await guild.fetchOwner().catch(() => null);
        if (!owner) return;

        let msg = `🚨 **Identical Channel Spam Attack Detected!**\n\n`;
        msg += `👤 **Culprit:** \`${culpritName}\`\n`;
        msg += `📁 **Spam Channel Name:** \`${channelName}\`\n`;
        msg += `🛠️ **Action Taken:** User has been banned and identical spam channels deleted!`;

        await owner.send(msg).catch(() => {});
    } catch (err) {
        console.error('Failed to send notification to owner:', err);
    }
}

async function notifyOwnerForMessageSpam(guild, culpritName) {
    try {
        const owner = await guild.fetchOwner().catch(() => null);
        if (!owner) return;

        let msg = `🚨 **Message Spam Attack Detected!**\n\n`;
        msg += `👤 **Culprit:** \`${culpritName}\`\n`;
        msg += `🛠️ **Action Taken:** User has been banned for spamming messages!`;

        await owner.send(msg).catch(() => {});
    } catch (err) {
        console.error('Failed to send notification to owner:', err);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.user.id !== interaction.guild.ownerId) {
        return await interaction.reply({ content: '❌ Only the Server Owner can use this command!', ephemeral: true });
    }

    if (interaction.commandName === 'protect-server') {
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
        const target = interaction.options.getUser('target');
        if (!target) return await interaction.reply({ content: '❌ Please select a target member!', ephemeral: true });

        await ensureDbConnected();
        await trustedEntitiesCollection.deleteOne({ guild_id: interaction.guild.id, entity_id: target.id });
        return await interaction.reply({ content: `⚠️ Successfully removed trust status from **${target.tag}**!`, ephemeral: true });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

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

        await notifyOwnerForChannelDeletion(guild, culpritName, channelName);

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

            const culpritName = executor.tag || executor.username;
            await notifyOwnerForChannelSpam(guild, culpritName, channelName);
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
        messageSpamTracker.set(userId, 0);
    }

    let count = messageSpamTracker.get(userId) + 1;
    messageSpamTracker.set(userId, count);

    if (count > 5) {
        const member = await message.guild.members.fetch(userId).catch(() => null);
        if (member && member.bannable) {
            await member.ban({ reason: 'Anti-Nuke: Spamming chat messages continuously' });
            const culpritName = message.author.tag || message.author.username;
            await notifyOwnerForMessageSpam(message.guild, culpritName);
        }
        messageSpamTracker.delete(userId);
    }
});

client.login(process.env.TOKEN_ANTINUKE);

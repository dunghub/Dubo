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

const userMessageSpamTracker = new Map();
const userBanTracker = new Map();
const channelCreationTracker = new Map();

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
            .setDescription('Activate scanning, create backup storage, and enable full auto-protection')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Stop the anti-nuke system and disable protection')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('attach-trust')
            .setDescription('Add a user or bot to the trusted list (exempt from bans/scans)')
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

async function notifyOwnerForIncident(guild, culpritName, eventDescription) {
    try {
        const owner = await guild.fetchOwner().catch(() => null);
        if (!owner) return;

        const timeUK = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });

        let msg = `⚠️ **Your server was attacked by ${culpritName}**\n\n`;
        msg += `📋 **Incident Event:** \`${eventDescription}\`\n`;
        msg += `🛠️ **Action Taken:** Bot initiated emergency lockdown, banned culprit, and auto-restored deleted items!\n`;
        msg += `🇬🇧 **Time (UK):** \`${timeUK}\``;

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
            content: '🛡️ **ANTI-NUKE SYSTEM:** Do you want to create a dedicated backup storage and enable full auto-protection for this server?',
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
            content: `🛡️ **TRUST SYSTEM:** Are you sure you want to allow **${target.tag || target.username}** to use the bot and be exempt from bans under any condition?`,
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

            await interaction.editReply({ content: `✅ **Successfully created backup storage and enabled full Anti-Nuke protection!**` });
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
                content: `✅ **Successfully added ${targetTag} to the trusted list! They are now exempt from all anti-nuke bans and scans.**`, 
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

async function triggerEmergencyLockdown(guild, culpritName, reasonText) {
    try {
        const guildId = guild.id;
        await ensureDbConnected();
        
        if (serverBackupsCollection) {
            await serverBackupsCollection.updateOne(
                { guild_id: guildId },
                { $set: { lockdownInvites: true } }
            );
        }

        if (nukedServersCollection) {
            await nukedServersCollection.insertOne({
                guild_id: guildId,
                guild_name: guild.name,
                culprit: culpritName,
                reason: reasonText,
                timestamp: new Date()
            });
        }

        const invites = await guild.invites.fetch().catch(() => null);
        if (invites) {
            for (const [code, invite] of invites) {
                await invite.delete(`Anti-Nuke Emergency Lockdown: ${reasonText}`).catch(() => {});
            }
        }
        
        await notifyOwnerForIncident(guild, culpritName, reasonText);
    } catch (err) {
        console.error('Error lockdown:', err);
    }
}

async function cleanupWebhooks(guild, reasonText) {
    try {
        const fetchedWebhooks = await guild.fetchWebhooks().catch(() => null);
        if (!fetchedWebhooks) return;
        for (const [id, webhook] of fetchedWebhooks) {
            await webhook.delete(`Anti-Nuke Webhook Cleanup: ${reasonText}`).catch(() => {});
        }
    } catch (err) {
        console.error('Error cleaning webhooks:', err);
    }
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

        const member = await guild.members.fetch(executor.id).catch(() => null);
        if (member && member.bannable) {
            await member.ban({ reason: 'Anti-Nuke: Unauthorized channel deletion' });
        }

        const culpritName = executor.tag || executor.username;
        await triggerEmergencyLockdown(guild, culpritName, 'Unauthorized channel deletion');
        await cleanupWebhooks(guild, 'Unauthorized channel deletion');

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

        const channelName = newChannel.name;
        if (!channelCreationTracker.has(guildId)) {
            channelCreationTracker.set(guildId, []);
        }

        const creations = channelCreationTracker.get(guildId);
        creations.push({ name: channelName, channelId: newChannel.id, timestamp: Date.now() });

        const recentCreations = creations.filter(c => Date.now() - c.timestamp < 30000);
        channelCreationTracker.set(guildId, recentCreations);

        const identicalCreations = recentCreations.filter(c => c.name === channelName);

        if (identicalCreations.length >= 3) {
            const member = await guild.members.fetch(executor.id).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: 'Anti-Nuke: Spam creating identical channels within 30s' });
            }

            for (const item of identicalCreations) {
                const ch = guild.channels.cache.get(item.channelId);
                if (ch) await ch.delete('Anti-Nuke: Cleanup spam channels').catch(() => {});
            }

            const culpritName = executor.tag || executor.username;
            await triggerEmergencyLockdown(guild, culpritName, 'Spam channel creation');
            await cleanupWebhooks(guild, 'Spam channel creation');
        }
    } catch (err) {
        console.error('Channel create error:', err);
    }
});

client.on('webhookUpdate', async (channel) => {
    const guild = channel.guild;
    const guildId = guild.id;
    if (!(await isAntiNukeActive(guildId))) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookCreate }).catch(() => null);
        let logEntry = auditLogs ? auditLogs.entries.first() : null;

        if (!logEntry) {
            const deleteLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookDelete }).catch(() => null);
            logEntry = deleteLogs ? deleteLogs.entries.first() : null;
        }

        if (!logEntry) return;

        const { executor } = logEntry;
        if (!executor || executor.id === guild.ownerId || executor.id === client.user.id) return;
        if (await isTrustedEntity(guildId, executor.id)) return;

        const member = await guild.members.fetch(executor.id).catch(() => null);
        if (member && member.bannable) {
            await member.ban({ reason: 'Anti-Nuke: Unauthorized Webhook creation or deletion' });
        }

        const culpritName = executor.tag || executor.username;
        await cleanupWebhooks(guild, 'Unauthorized Webhook modification');
        await triggerEmergencyLockdown(guild, culpritName, 'Unauthorized Webhook modification');
    } catch (err) {
        console.error('Webhook update error:', err);
    }
});

client.on('guildBanAdd', async (ban) => {
    const guild = ban.guild;
    const guildId = guild.id;
    if (!(await isAntiNukeActive(guildId))) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
        if (!auditLogs) return;
        const logEntry = auditLogs.entries.first();
        if (!logEntry) return;

        const { executor } = logEntry;
        if (!executor || executor.id === guild.ownerId || executor.id === client.user.id) return;
        if (await isTrustedEntity(guildId, executor.id)) return;

        const userId = executor.id;
        if (!userBanTracker.has(userId)) {
            userBanTracker.set(userId, []);
        }

        const banTimes = userBanTracker.get(userId);
        banTimes.push(Date.now());

        const recentBans = banTimes.filter(t => Date.now() - t < 20000);
        userBanTracker.set(userId, recentBans);

        if (recentBans.length >= 5) {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: 'Anti-Nuke: Mass banning members (>5 in 20s)' });
            }
            const culpritName = executor.tag || executor.username;
            await triggerEmergencyLockdown(guild, culpritName, 'Mass banning members');
            await cleanupWebhooks(guild, 'Mass banning members');
        }
    } catch (err) {
        console.error('Guild ban add error:', err);
    }
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot || message.author.id === message.guild.ownerId) return;

    const guildId = message.guild.id;
    if (!(await isAntiNukeActive(guildId))) return;

    const userId = message.author.id;
    if (await isTrustedEntity(guildId, userId)) return;

    const content = message.content.trim();
    if (!content) return;

    if (!userMessageSpamTracker.has(userId)) {
        userMessageSpamTracker.set(userId, []);
    }

    const userMsgs = userMessageSpamTracker.get(userId);
    userMsgs.push({ messageObject: message, timestamp: Date.now() });

    const recentMsgs = userMsgs.filter(m => Date.now() - m.timestamp < 30000);
    userMessageSpamTracker.set(userId, recentMsgs);

    if (recentMsgs.length >= 5) {
        try {
            for (const item of recentMsgs) {
                await item.messageObject.delete().catch(() => {});
            }

            const member = await message.guild.members.fetch(userId).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: 'Anti-Nuke: Message spamming (>5 messages in 30s)' });
            }

            userMessageSpamTracker.delete(userId);

            const culpritName = message.author.tag || message.author.username;
            await triggerEmergencyLockdown(message.guild, culpritName, 'Message spamming');
        } catch (err) {
            console.error('Error handling message spammer:', err);
        }
    }
});

client.login(process.env.TOKEN_ANTINUKE);

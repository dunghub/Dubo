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

const channelDeleteQueue = new Map();
const userMessageSpamTracker = new Map();

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
        console.log("✅ Đã kết nối MongoDB thành công!");
    } catch (err) {
        console.error("❌ Lỗi kết nối MongoDB:", err);
    }
}

ensureDbConnected();

client.once('ready', async () => {
    await ensureDbConnected();
    console.log(`Bot đã đăng nhập thành công với tên: ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('protect-server')
            .setDescription('Kích hoạt quét và tạo kho chứa riêng bảo vệ server')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Dừng hệ thống chống nuke và tắt bảo vệ')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('dscnuked')
            .setDescription('Xem lịch sử sự cố và vấn đề vừa xảy ra tại server này')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('attach-trust')
            .setDescription('Thêm người hoặc bot vào danh sách tin cậy (không bị ban/quét)')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => 
                option.setName('target').setDescription('Thành viên hoặc bot cần tin tưởng').setRequired(true)),
        new SlashCommandBuilder()
            .setName('unattach-trust')
            .setDescription('Gỡ trạng thái tin tưởng khỏi người hoặc bot')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => 
                option.setName('target').setDescription('Thành viên hoặc bot cần gỡ tin tưởng').setRequired(true))
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Đã đăng ký thành công các lệnh Slash!');
    } catch (error) {
        console.error('Lỗi khi đăng ký lệnh:', error);
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

        const timeString = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        let msg = `⚠️ **Server You were nuke by ${culpritName}**\n\n`;
        msg += `📋 **Sự kiện vừa xảy ra:** \`${eventDescription}\`\n`;
        msg += `🛠️ **Trạng thái xử lý:** Bot đã tự động khôi phục thành công từ kho chứa riêng!\n`;
        msg += `⏰ **Thời gian:** \`${timeString}\``;

        await owner.send(msg).catch(() => {});
    } catch (err) {
        console.error('Không thể gửi tin nhắn thông báo cho owner:', err);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'protect-server') {
        if (interaction.user.id !== interaction.guild.ownerId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ **Lỗi:** Chỉ có Chủ server hoặc Quản trị viên mới có quyền sử dụng lệnh này!',
                ephemeral: true
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('antinuke_yes').setLabel('Yes').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('antinuke_no').setLabel('No').setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({
            content: '🛡️ **ANTI-NUKE SYSTEM:** Bạn có muốn tạo file kho chứa riêng biệt (lưu trữ kênh, webhook, vai trò từ thấp đến cao kèm ID thành viên) cho server này không?',
            components: [row],
            ephemeral: true
        });
    }

    if (interaction.commandName === 'stop') {
        if (interaction.user.id !== interaction.guild.ownerId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ **Lỗi:** Chỉ có Chủ server hoặc Quản trị viên mới có quyền sử dụng lệnh này!',
                ephemeral: true
            });
        }

        const guildId = interaction.guild.id;
        try {
            await ensureDbConnected();
            await serverBackupsCollection.updateOne(
                { guild_id: guildId },
                { $set: { antiNukeActive: false, lockdownInvites: false } }
            );
            await interaction.reply({
                content: '🛑 **Đã dừng hệ thống Anti-Nuke và cập nhật trạng thái kho chứa!**',
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '❌ Lỗi khi dừng hệ thống.', ephemeral: true });
        }
    }

    if (interaction.commandName === 'dscnuked') {
        if (interaction.user.id !== interaction.guild.ownerId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ **Lỗi:** Chỉ có Chủ server hoặc Quản trị viên mới được quyền xem lịch sử sự cố!',
                ephemeral: true
            });
        }

        await ensureDbConnected();
        if (!nukedServersCollection) {
            return await interaction.reply({ content: '❌ Chưa kết nối được cơ sở dữ liệu MongoDB!', ephemeral: true });
        }

        try {
            const guildId = interaction.guild.id;
            const serverIncidents = await nukedServersCollection.find({ guild_id: guildId }).toArray();

            if (serverIncidents.length === 0) {
                return await interaction.reply({ 
                    content: `🛡️ **Tuyệt vời!** Server **${interaction.guild.name}** [ID: \`${guildId}\`] chưa ghi nhận sự cố nuke hoặc vấn đề nào.`, 
                    ephemeral: true 
                });
            }

            let msg = `📋 **Lịch sử biến cố / vấn đề vừa xảy ra tại server ${interaction.guild.name}:**\n`;
            serverIncidents.forEach((s, index) => {
                const timeStr = new Date(s.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                const culprit = s.culprit || "Không rõ";
                msg += `${index + 1}. **Kẻ gây ra:** \`${culprit}\` — **Sự kiện:** ${s.reason} — *Thời gian:* \`${timeStr}\`\n`;
            });

            await interaction.reply({ content: msg, ephemeral: true });
        } catch (err) {
            console.error('Lỗi lấy lịch sử server:', err);
            await interaction.reply({ content: '❌ Đã xảy ra lỗi khi kết nối database.', ephemeral: true });
        }
    }

    if (interaction.commandName === 'attach-trust') {
        if (interaction.user.id !== interaction.guild.ownerId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({ content: '❌ Chỉ có Chủ server hoặc Quản trị viên mới dùng được lệnh này!', ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        if (!target) return await interaction.reply({ content: '❌ Vui lòng chọn thành viên hoặc bot cần thêm!', ephemeral: true });

        await ensureDbConnected();
        await trustedEntitiesCollection.updateOne(
            { guild_id: interaction.guild.id, entity_id: target.id },
            { $set: { guild_id: interaction.guild.id, entity_id: target.id, name: target.tag, addedAt: new Date() } },
            { upsert: true }
        );

        return await interaction.reply({ content: `🛡️ Đã thêm **${target.tag}** vào **danh sách tin cậy (Trust)** thành công!`, ephemeral: true });
    }

    if (interaction.commandName === 'unattach-trust') {
        if (interaction.user.id !== interaction.guild.ownerId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({ content: '❌ Chỉ có Chủ server hoặc Quản trị viên mới dùng được lệnh này!', ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        if (!target) return await interaction.reply({ content: '❌ Vui lòng chọn thành viên hoặc bot cần gỡ!', ephemeral: true });

        await ensureDbConnected();
        await trustedEntitiesCollection.deleteOne({ guild_id: interaction.guild.id, entity_id: target.id });

        return await interaction.reply({ content: `⚠️ Đã gỡ trạng thái tin tưởng khỏi **${target.tag}** thành công!`, ephemeral: true });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'antinuke_yes') {
        const guild = interaction.guild;
        const guildId = guild.id;

        await interaction.update({ 
            content: `⏳ **Đang tiến hành tạo file kho chứa riêng cho server [ID: ${guildId}] và lưu trữ dữ liệu...**`, 
            components: [] 
        });

        try {
            await ensureDbConnected();
            if (!serverBackupsCollection) {
                return await interaction.editReply({
                    content: '❌ **Lỗi:** Không thể khởi tạo kho chứa MongoDB!'
                });
            }

            console.log(`[SCAN] Đang đóng gói kho chứa cho server: ${guild.name} (${guildId})`);

            // Ép buộc load toàn bộ member của server trước khi quét
            await guild.members.fetch().catch(() => {});

            const rolesData = guild.roles.cache
                .filter(role => !role.managed && role.id !== guild.id)
                .sort((a, b) => a.position - b.position)
                .map(role => ({
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions.bitfield.toString(),
                    hoist: role.hoist,
                    mentionable: role.mentionable
                }));

            const roleMembersMapping = {};
            rolesData.forEach(r => {
                roleMembersMapping[r.name] = [];
            });

            guild.members.cache.forEach(member => {
                if (!member.user.bot) {
                    member.roles.cache.forEach(role => {
                        if (roleMembersMapping[role.name]) {
                            roleMembersMapping[role.name].push(member.id);
                        }
                    });
                }
            });

            const fetchedChannels = await guild.channels.fetch();
            const sortedChannels = [...fetchedChannels.values()].filter(c => c).sort((a, b) => a.position - b.position);
            const categories = sortedChannels.filter(c => c.type === ChannelType.GuildCategory);
            const others = sortedChannels.filter(c => c.type !== ChannelType.GuildCategory);

            const channelsData = [...categories, ...others].map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                parentId: channel.parentId,
                position: channel.position,
                topic: channel.topic || '',
                nsfw: channel.nsfw || false
            }));

            const fetchedWebhooks = await guild.fetchWebhooks().catch(() => new Map());
            const webhooksData = fetchedWebhooks.map(wh => ({
                name: wh.name,
                channelId: wh.channelId
            }));

            await serverBackupsCollection.updateOne(
                { guild_id: guildId },
                { 
                    $set: { 
                        guild_id: guildId,
                        guild_name: guild.name,
                        roles: rolesData, 
                        roleMembersMapping: roleMembersMapping, 
                        channels: channelsData, 
                        webhooks: webhooksData,
                        antiNukeActive: true,
                        lockdownInvites: false,
                        updatedAt: new Date()
                    } 
                },
                { upsert: true }
            );

            console.log(`[SCAN] Đã tạo thành công kho chứa cho server ID: ${guildId}`);

            let summaryText = `✅ **Đã tạo kho chứa riêng cho server [ID: ${guildId}] thành công!**\n\n`;
            summaryText += `📂 **Channels:** \`${channelsData.length}\` kênh quét được\n`;
            summaryText += `👑 **Roles:**\n`;
            rolesData.forEach((r, idx) => {
                const listIds = roleMembersMapping[r.name] || [];
                summaryText += `\`${idx + 1}:${r.name}\` > (${listIds.length} người)\n`;
            });
            summaryText += `🔗 **Webhooks:** \`${webhooksData.length}\` webhooks quét được`;

            await interaction.editReply({ content: summaryText });
        } catch (error) {
            console.error('Lỗi khi quét dữ liệu server:', error);
            await interaction.editReply({
                content: `❌ **Lỗi nghiêm trọng khi quét dữ liệu:** \`${error.message}\``
            });
        }
    } else if (interaction.customId === 'antinuke_no') {
        await interaction.update({ content: '❌ Đã hủy kích hoạt.', components: [] });
    }
});

async function isAntiNukeActive(guildId) {
    await ensureDbConnected();
    if (!serverBackupsCollection) return false;
    const data = await serverBackupsCollection.findOne({ guild_id: guildId });
    return data ? data.antiNukeActive : false;
}

async function getGuildBackup(guildId) {
    await ensureDbConnected();
    if (!serverBackupsCollection) return null;
    return await serverBackupsCollection.findOne({ guild_id: guildId });
}

async function restoreRolesAndMembers(guild) {
    try {
        const backupData = await getGuildBackup(guild.id);
        if (!backupData || !backupData.roles) return;

        // 1. Tạo lại toàn bộ các Roles nếu bị xóa
        for (const roleData of backupData.roles) {
            let existingRole = guild.roles.cache.find(r => r.name === roleData.name);
            if (!existingRole) {
                await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color || 0,
                    permissions: [roleData.permissions || '0'],
                    hoist: roleData.hoist || false,
                    mentionable: roleData.mentionable || false,
                    reason: 'Anti-Nuke: Auto restore role sequence from storage'
                }).catch(() => {});
            }
        }

        // Chờ để Discord cập nhật cache role
        await new Promise(resolve => setTimeout(resolve, 3000));
        await guild.roles.fetch();
        await guild.members.fetch();

        // 2. Gán lại đúng vai trò cho từng thành viên dựa theo danh sách đã lưu kho
        const roleMembersMapping = backupData.roleMembersMapping || {};
        for (const [roleName, memberIds] of Object.entries(roleMembersMapping)) {
            const targetRole = guild.roles.cache.find(r => r.name === roleName);
            if (targetRole && memberIds && memberIds.length > 0) {
                for (const mId of memberIds) {
                    const member = await guild.members.fetch(mId).catch(() => null);
                    if (member && !member.roles.cache.has(targetRole.id)) {
                        await member.roles.add(targetRole, 'Anti-Nuke: Restoring roles mapping from storage').catch(() => {});
                    }
                }
            }
        }
        console.log(`[RESTORE] Đã khôi phục thành công các vai trò và gán lại thành viên!`);
    } catch (err) {
        console.error('Error restoring roles and members:', err);
    }
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
        
        await restoreRolesAndMembers(guild);
        await notifyOwnerForIncident(guild, culpritName, reasonText);
    } catch (err) {
        console.error('Error lockdown:', err);
    }
}

async function cleanupWebhooks(guild, reasonText) {
    try {
        const fetchedWebhooks = await guild.fetchWebhooks().catch(() => null);
        if (!fetchedWebhooks) return;

        const backup = await getGuildBackup(guild.id);
        const allowedWebhookNames = backup && backup.webhooks ? backup.webhooks.map(w => w.name) : [];

        for (const [id, webhook] of fetchedWebhooks) {
            if (!allowedWebhookNames.includes(webhook.name)) {
                await webhook.delete(`Anti-Nuke Webhook Cleanup: ${reasonText}`).catch(() => {});
            }
        }
    } catch (err) {
        console.error('Error cleaning webhooks:', err);
    }
}

client.on('channelDelete', async (deletedChannel) => {
    const guild = deletedChannel.guild;
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
        const reasonText = `Kênh [${deletedChannel.name}] vừa bị xóa trái phép`;

        await triggerEmergencyLockdown(guild, culpritName, reasonText);
        await cleanupWebhooks(guild, reasonText);

        if (!channelDeleteQueue.has(guildId)) {
            channelDeleteQueue.set(guildId, []);
        }
        
        const queue = channelDeleteQueue.get(guildId);
        queue.push({
            name: deletedChannel.name,
            type: deletedChannel.type,
            parentId: deletedChannel.parentId,
            position: deletedChannel.position,
            topic: deletedChannel.topic || '',
            nsfw: deletedChannel.nsfw || false
        });

        if (!channelDeleteQueue.has(`${guildId}_timer`)) {
            const timer = setTimeout(async () => {
                const channelsToRestore = channelDeleteQueue.get(guildId) || [];
                channelDeleteQueue.delete(guildId);
                channelDeleteQueue.delete(`${guildId}_timer`);

                if (channelsToRestore.length > 0) {
                    const backupData = await getGuildBackup(guildId);
                    if (!backupData || !backupData.channels) return;

                    const categoryMap = new Map();
                    const categories = backupData.channels.filter(c => c.type === ChannelType.GuildCategory);
                    const others = backupData.channels.filter(c => c.type !== ChannelType.GuildCategory);

                    for (const catData of categories) {
                        try {
                            const existing = guild.channels.cache.find(c => c.name === catData.name && c.type === ChannelType.GuildCategory);
                            if (!existing) {
                                const newCat = await guild.channels.create({
                                    name: catData.name,
                                    type: catData.type,
                                    position: catData.position,
                                    reason: 'Anti-Nuke: Auto Restore Category'
                                });
                                categoryMap.set(catData.id, newCat.id);
                            } else {
                                categoryMap.set(catData.id, existing.id);
                            }
                        } catch (e) {
                            console.error('Lỗi tạo lại danh mục:', e);
                        }
                    }

                    for (const chData of others) {
                        try {
                            const existing = guild.channels.cache.find(c => c.name === chData.name && c.type === chData.type);
                            if (!existing) {
                                let newParentId = null;
                                if (chData.parentId && categoryMap.has(chData.parentId)) {
                                    newParentId = categoryMap.get(chData.parentId);
                                }

                                await guild.channels.create({
                                    name: chData.name,
                                    type: chData.type,
                                    parent: newParentId,
                                    topic: chData.topic,
                                    nsfw: chData.nsfw,
                                    position: chData.position,
                                    reason: 'Anti-Nuke: Auto Restore Channel'
                                });
                            }
                        } catch (e) {
                            console.error('Lỗi tạo lại kênh:', e);
                        }
                    }
                }
            }, 5000);

            channelDeleteQueue.set(`${guildId}_timer`, timer);
        }
    } catch (err) {
        console.error('Lỗi hệ thống chống xóa kênh:', err);
    }
});

client.on('channelCreate', async (newChannel) => {
    const guild = newChannel.guild;
    const guildId = guild.id;
    if (!(await isAntiNukeActive(guildId))) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
        const logEntry = auditLogs.entries.first();
        if (!logEntry) return;

        const { executor } = logEntry;
        if (!executor || executor.id === guild.ownerId || executor.id === client.user.id) return;
        if (await isTrustedEntity(guildId, executor.id)) return;

        const fetchedChannels = await guild.channels.fetch();
        const duplicateChannels = fetchedChannels.filter(c => c && c.name === newChannel.name);
        
        if (duplicateChannels.size >= 3) {
            const member = await guild.members.fetch(executor.id).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: 'Anti-Nuke: Spam creating channels' });
            }

            for (const [id, channel] of duplicateChannels) {
                await channel.delete('Anti-Nuke: Cleanup spam channels').catch(() => {});
            }

            const culpritName = executor.tag || executor.username;
            await triggerEmergencyLockdown(guild, culpritName, 'Spam channel creation');
            await cleanupWebhooks(guild, 'Spam channel creation');
        }
    } catch (err) {
        console.error('Channel create spam check error:', err);
    }
});

client.on('webhookUpdate', async (channel) => {
    const guild = channel.guild;
    const guildId = guild.id;
    if (!(await isAntiNukeActive(guildId))) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookCreate }).catch(() => null);
        if (!auditLogs) return;
        const logEntry = auditLogs.entries.first();
        if (!logEntry) return;

        const { executor } = logEntry;
        if (!executor || executor.id === guild.ownerId || executor.id === client.user.id) return;
        if (await isTrustedEntity(guildId, executor.id)) return;

        const member = await guild.members.fetch(executor.id).catch(() => null);
        if (member && member.bannable) {
            await member.ban({ reason: 'Anti-Nuke: Unauthorized webhook creation' });
        }

        const culpritName = executor.tag || executor.username;
        await cleanupWebhooks(guild, 'Unauthorized webhook creation');
        await triggerEmergencyLockdown(guild, culpritName, 'Unauthorized webhook creation');
    } catch (err) {
        console.error('Webhook update check error:', err);
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

    const urlRegex = /(https?:\/\/[^\s]+)|(discord\.gg\/[^\s]+)|(www\.[^\s]+)/gi;
    const isLink = urlRegex.test(content);

    if (!userMessageSpamTracker.has(userId)) {
        userMessageSpamTracker.set(userId, []);
    }

    const userMsgs = userMessageSpamTracker.get(userId);
    userMsgs.push({ content, isLink, timestamp: Date.now() });

    const recentMsgs = userMsgs.filter(m => Date.now() - m.timestamp < 15000);
    userMessageSpamTracker.set(userId, recentMsgs);

    const identicalCount = recentMsgs.filter(m => m.content === content).length;
    const linkCount = recentMsgs.filter(m => m.isLink).length;

    if (identicalCount >= 5 || linkCount >= 10) {
        try {
            const member = await message.guild.members.fetch(userId).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: 'Anti-Nuke: Spamming identical chat or mass links' });
            }
            userMessageSpamTracker.delete(userId);
        } catch (err) {
            console.error('Error banning message spammer:', err);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

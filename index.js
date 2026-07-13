import os
import discord
from discord import app_commands
from discord.ext import commands
from collections import Counter
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")

intents = discord.Intents.default()
intents.guilds = True
intents.messages = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"[INFO] Bot online: {bot.user}")
    try:
        synced = await bot.tree.sync()
        print(f"[INFO] Đã đồng bộ {len(synced)} lệnh slash command.")
    except Exception as e:
        print(f"[ERROR] Lỗi đồng bộ: {e}")

@bot.tree.command(name="reset", description="Xóa tất cả các kênh trùng tên trong server")
@app_commands.checks.has_permissions(manage_channels=True)
async def reset_channels(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)
    guild = interaction.guild
    if not guild:
        await interaction.followup.send("Lệnh này chỉ dùng trong Server.")
        return

    channels = guild.channels
    channel_names = [ch.name for ch in channels]
    name_counts = Counter(channel_names)
    duplicate_names = {name for name, count in name_counts.items() if count > 1}
    
    if not duplicate_names:
        await interaction.followup.send("Không tìm thấy kênh nào bị trùng tên.")
        return

    deleted_count = 0
    for ch in channels:
        if ch.name in duplicate_names:
            try:
                await ch.delete()
                deleted_count += 1
            except discord.Forbidden:
                print(f"[WARN] Không có quyền xóa: {ch.name}")
            except discord.HTTPException as e:
                print(f"[ERROR] Lỗi xóa {ch.name}: {e}")

    await interaction.followup.send(f"Đã xóa thành công {deleted_count} kênh trùng tên.")

@reset_channels.error
async def reset_channels_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    if isinstance(error, app_commands.MissingPermissions):
        await interaction.response.send_message("Bạn cần quyền `Quản lý kênh` để dùng lệnh này!", ephemeral=True)

if __name__ == "__main__":
    if not TOKEN:
        print("[ERROR] Thừa hoặc thiếu DISCORD_TOKEN trong Environment.")
    else:
        bot.run(TOKEN)

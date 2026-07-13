import os
import discord
from discord import app_commands
from discord.ext import commands
from collections import Counter
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")

# Cấu hình bot và kích hoạt các quyền (Intents) cần thiết
intents = discord.Intents.default()
intents.guilds = True
intents.messages = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"[INFO] Bot hoạt động với tên: {bot.user}")
    try:
        # Đồng bộ lệnh slash command (/reset) với hệ thống Discord
        synced = await bot.tree.sync()
        print(f"[INFO] Đã đồng bộ thành công {len(synced)} lệnh slash command.")
    except Exception as e:
        print(f"[ERROR] Lỗi đồng bộ lệnh: {e}")

# Định nghĩa lệnh slash command /reset
@bot.tree.command(name="reset", description="Xóa tất cả các kênh trùng tên trong server")
@app_commands.checks.has_permissions(manage_channels=True)
async def reset_channels(interaction: discord.Interaction):
    # Phản hồi hoãn lại (defer) để tránh lỗi Timeout 3 giây của Discord
    await interaction.response.defer(ephemeral=True)
    
    guild = interaction.guild
    if not guild:
        await interaction.followup.send("Lệnh này chỉ có thể sử dụng trong Server.")
        return

    channels = guild.channels
    
    # Đếm số lượng xuất hiện của từng tên kênh
    channel_names = [ch.name for ch in channels]
    name_counts = Counter(channel_names)
    
    # Lọc ra danh sách các tên kênh xuất hiện nhiều hơn 1 lần
    duplicate_names = {name for name, count in name_counts.items() if count > 1}
    
    if not duplicate_names:
        await interaction.followup.send("Không tìm thấy kênh nào bị trùng tên trong server.")
        return

    deleted_count = 0
    
    # Quét và tiến hành xóa các kênh trùng tên
    for ch in channels:
        if ch.name in duplicate_names:
            try:
                await ch.delete()
                deleted_count += 1
            except discord.Forbidden:
                print(f"[WARN] Không có quyền để xóa kênh: {ch.name}")
            except discord.HTTPException as e:
                print(f"[ERROR] Lỗi HTTP khi xóa kênh {ch.name}: {e}")

    await interaction.followup.send(f"Đã xử lý xong! Tự động xóa thành công {deleted_count} kênh trùng tên.")

# Xử lý trường hợp User gọi lệnh nhưng không có quyền Manage Channels
@reset_channels.error
async def reset_channels_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    if isinstance(error, app_commands.MissingPermissions):
        await interaction.response.send_message(
            "Bạn phải có quyền `Quản lý kênh` (Manage Channels) để thực hiện lệnh này!", 
            ephemeral=True
        )

if __name__ == "__main__":
    if not TOKEN:
        print("[ERROR] Không tìm thấy DISCORD_TOKEN trong biến môi trường.")
    else:
        bot.run(TOKEN)

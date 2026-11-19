#!/usr/bin/env bash
# ==============================================================================
# Script tạo đường link Public Internet nhanh để demo Vitara Data Platform
# Phù hợp để gửi link cho bạn bè, thầy cô xem trực tiếp từ xa khi đang chạy local
# ==============================================================================

echo "======================================================================"
echo "🚀 Đang tạo đường link Public Internet cho Vitara Data Platform..."
echo "======================================================================"

# Thêm ~/.local/bin vào PATH để nhận diện cloudflared
export PATH="$HOME/.local/bin:$PATH"

PORT="${1:-3000}"

if command -v cloudflared &> /dev/null; then
    echo "🌐 Đang kết nối Cloudflare Tunnel tới Frontend (Cổng $PORT, Next.js React)..."
    echo "👉 Hãy copy đường link https://xxxx.trycloudflare.com xuất hiện dưới đây để gửi cho người xem!"
    echo "🛑 Khi kết thúc buổi demo, bấm Ctrl + C để đóng kết nối."
    echo "----------------------------------------------------------------------"
    cloudflared tunnel --url "http://127.0.0.1:$PORT"
elif command -v ngrok &> /dev/null; then
    echo "🌐 Đang khởi tạo Ngrok Tunnel tới Cổng $PORT..."
    ngrok http "$PORT"
else
    echo "🌐 Đang khởi tạo LocalTunnel qua Node.js tới Cổng $PORT..."
    npx -y localtunnel --port "$PORT"
fi

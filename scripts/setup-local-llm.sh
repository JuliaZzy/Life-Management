#!/usr/bin/env bash
set -euo pipefail

echo "安装 Ollama 后执行："
echo "  ollama serve"
echo "  ollama pull qwen2.5:3b"
echo ""
echo "然后在另一个终端运行："
echo "  pnpm llm:check"
echo "  pnpm dev"

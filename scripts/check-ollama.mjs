const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const model = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";

try {
  const response = await fetch(`${baseUrl}/api/tags`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  const installed = (payload.models ?? []).some((item) => item.name === model || item.name?.startsWith(`${model}:`));
  console.log(JSON.stringify({ ok: true, baseUrl, model, installed }, null, 2));
  process.exitCode = installed ? 0 : 2;
} catch (error) {
  console.error(`无法连接 Ollama：${error instanceof Error ? error.message : String(error)}`);
  console.error(`请先执行 ollama serve && ollama pull ${model}`);
  process.exitCode = 1;
}

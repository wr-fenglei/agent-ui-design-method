"""Read the ten native nodes linked from the README using the paired local bridge."""

import http.client
import json
import sys

from figma_lint import bridge_request


# The bridge exposes the persistent plugin document ID even when fileKey is unavailable.
BASELINE = ("AI UI 规范实验 – Linear 基准", "d42fopsxhmvl3hq2h", "cytw6jxvr7NDe0K406hGME")
DESIGNS = ("Untitled", "d7kidxdhpmwnmzq5z", "scYOkdhE2byoPHW4Gk1aDL")
# Each entry names a README root and, where useful, a text layer inside that root.
EXAMPLES = {
    "Linear": [(BASELINE, "5:242", None), (BASELINE, "2:166", None),
               (BASELINE, "7:29", None), (DESIGNS, "11:7202", "34:16900")],
    "shadcn/ui": [(DESIGNS, "47:20650", "50:22992"), (DESIGNS, "47:20892", "50:23091")],
    "Apple Liquid Glass": [(DESIGNS, "52:24248", "52:25001"), (DESIGNS, "51:23751", "52:24857"),
                           (DESIGNS, "74:37804", "75:38696"), (DESIGNS, "75:38790", "75:38945")],
}

READ_NODES = """
if (figma.root.getPluginData('figmosha-doc') !== file.doc ||
    (figma.fileKey && figma.fileKey !== file.key)) throw Error('Figma 原稿身份不符');
const rows = {};
for (const [id, textId] of nodes) {
  try {
    const n = await figma.getNodeByIdAsync(id);
    if (!n) throw Error('原稿内缺少节点');
    if (n.type === 'PAGE' && n.loadAsync) await n.loadAsync();
    const size = 'width' in n ? ' ' + n.width + ' × ' + n.height : '';
    let evidence = '';
    const text = textId && 'findOne' in n && n.findOne(layer => layer.id === textId && layer.type === 'TEXT');
    if (text) {
      evidence = text.id + ' “' + text.characters.replace(/\\s+/g, ' ').slice(0, 100) + '”';
    } else if ('children' in n) {
      evidence = n.children.slice(0, 4).map(layer => layer.name).join(' / ');
    } else if (n.type === 'TEXT') {
      evidence = n.characters.replace(/\\s+/g, ' ').slice(0, 100);
    }
    rows[id] = {detail: n.name + ' [' + n.type + size + ']  ' + evidence};
  } catch (error) {
    rows[id] = {error: String(error.message || error)};
  }
}
return rows;
"""


def read_document(file, targets, nodes):
    name, doc, key = file
    matches = [target for target in targets if target.get("doc") == doc or target.get("fileKey") == key]
    if not matches:
        raise ValueError(f"请打开 README 链接指向的 {name} 原稿并配对 Figmosha")
    if len(matches) != 1 or matches[0].get("fileKey") not in (key, None):
        raise ValueError(f"{name} 的连接身份有冲突, 请核对原稿")
    doc = matches[0].get("doc")
    if not isinstance(doc, str) or not doc or sum(t.get("doc") == doc for t in targets) != 1:
        raise ValueError(f"{name} 缺少唯一的 Figmosha 文档 ID")
    if any(doc == other_doc and key != other_key for _, other_doc, other_key in (BASELINE, DESIGNS)):
        raise ValueError(f"{name} 的文件标识与另一份原稿冲突")
    file_data = json.dumps({"doc": doc, "key": key})
    code = f"const file = {file_data}, nodes = {json.dumps(nodes)};\n" + READ_NODES
    result = bridge_request("POST", "/exec", {
        "target": doc, "agent": "README 原生示例只读检查", "code": code, "timeout": 30, "queue_timeout": 15,
    }, timeout=50)
    if result.get("ok") is not True or not isinstance(result.get("value"), dict):
        raise ValueError("Figmosha 返回内容缺少节点记录")
    return result["value"]


def main():
    failures = (OSError, http.client.HTTPException, ValueError)
    try:
        targets = bridge_request("GET", "/targets", timeout=5).get("files")
        if not isinstance(targets, list) or not all(isinstance(t, dict) for t in targets):
            raise ValueError("Figmosha 返回内容缺少文档列表")
    except failures as exc:
        for example in EXAMPLES:
            print(f"{example}  未读取")
        print(f"请检查本机 Figmosha 服务并在 README 的两份原稿中打开插件, {exc}", file=sys.stderr)
        return 1

    rows = {}
    for file in (BASELINE, DESIGNS):
        nodes = [(node, sample) for group in EXAMPLES.values() for source, node, sample in group if source == file]
        try:
            rows.update(read_document(file, targets, nodes))
        except failures as exc:
            rows.update({node: {"error": str(exc)} for node, _ in nodes})
    complete = True
    for example, nodes in EXAMPLES.items():
        details = []
        missing = {}
        for _, node, _ in nodes:
            row = rows.get(node)
            if isinstance(row, dict) and isinstance(row.get("detail"), str) and row["detail"]:
                details.append(f"  {node}  {row['detail']}")
            else:
                error = row.get("error") if isinstance(row, dict) else None
                message = error if isinstance(error, str) and error else "缺少原生节点记录"
                missing.setdefault(message, []).append(node)
        print(f"{example}  已读取 {len(details)}/{len(nodes)}")
        for detail in details:
            print(detail)
        for message, ids in missing.items():
            print(f"  {', '.join(ids)}  未读取, {message}")
        if missing:
            complete = False
    return 0 if complete else 1


if __name__ == "__main__":
    sys.exit(main())

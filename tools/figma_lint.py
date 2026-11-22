"""Read a Figma design page through an already paired, local Figmosha bridge."""

import argparse
import http.client
import json
import sys
from contextlib import closing
from pathlib import Path


TOOLS = Path(__file__).resolve().parent


def bridge_request(method, path, payload=None, timeout=290):
    # Connect directly to the paired local bridge, including when an HTTP proxy is set.
    with closing(http.client.HTTPConnection("127.0.0.1", 18787, timeout=timeout)) as conn:
        body = json.dumps(payload).encode() if payload is not None else None
        headers = {"Content-Type": "application/json"} if body is not None else {}
        conn.request(method, path, body=body, headers=headers)
        response = conn.getresponse()
        result = json.load(response)
    if not isinstance(result, dict):
        raise ValueError("Figmosha 返回内容缺少执行结果")
    if response.status != 200 or result.get("ok") is False:
        raise ValueError(f"Figmosha HTTP {response.status}, {result.get('error') or response.reason}")
    return result


def check_page(target, page, mode="single-screen"):
    scripts = [TOOLS.joinpath(name).read_text(encoding="utf-8")
               for name in ("figma_flow.js", "figma_screen_scope.js", "check_design_page.js")]
    options = {"mode": mode}
    if page:
        options["page"] = page
    scripts.append(f"return await checkDesignPage(figma, {json.dumps(options)})")
    result = bridge_request("POST", "/exec", {
        "target": target,
        "agent": "Figma 设计页只读检查",
        "code": "\n".join(scripts),
        "timeout": 120,
        "queue_timeout": 160,
    })
    if result.get("ok") is not True:
        raise ValueError("Figmosha 返回内容缺少执行状态")
    report = result.get("value")
    if not isinstance(report, dict) or not isinstance(report.get("page"), dict):
        raise ValueError("检查器返回内容缺少页面信息")
    if not all(isinstance(report["page"].get(key), str) for key in ("id", "name")):
        raise ValueError("检查器返回内容缺少页面名称或 ID")
    for group, fields in (("errors", ("rule", "nodeId", "nodeName", "message")),
                          ("sources", ("nodeId", "nodeName", "url"))):
        records = report.get(group)
        if not isinstance(records, list) or any(
            not isinstance(item, dict) or not all(isinstance(item.get(key), str) for key in fields)
            for item in records
        ):
            raise ValueError(f"检查器返回内容缺少有效的 {group} 记录")
    if report["sources"]:
        report["sourceAccess"] = {"status": "unverified"}
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description="从已配对的 Figmosha 读取 Figma 页, 默认检查一张完整首屏及其同屏业务内容")
    parser.add_argument("--target", required=True, help="figmosha targets 列出的文档 ID (第二列)")
    parser.add_argument("--page", help="Figma 页的精确名称或页面 ID, 默认读取当前页")
    parser.add_argument("--mode", choices=("single-screen", "workflow"), default="single-screen",
                        help="默认 single-screen 检查唯一首屏、任务原文及浮层, workflow 检查多画板原型的可达与返回")
    parser.add_argument("--json", action="store_true", help="将完整检查报告输出到标准输出")
    args = parser.parse_args(argv)
    if not args.target.strip():
        parser.error("--target 需要指定 Figmosha 文档")
    if args.page is not None and not args.page.strip():
        parser.error("--page 需要指定页名或页面 ID")
    try:
        report = check_page(args.target, args.page, args.mode)
    except (ConnectionError, TimeoutError, http.client.HTTPException) as exc:
        print(f"Figmosha 连接中断, 请检查本机桥接服务并在目标文件内打开插件, {exc}", file=sys.stderr)
        return 2
    except (OSError, ValueError) as exc:
        print(f"检查未完成, {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        page = report["page"]
        print(f"{page['name']} ({page['id']}), {args.mode}, 自动检查发现 {len(report['errors'])} 项问题")
        for error in report["errors"]:
            print(f"- [{error['rule']}] {error['nodeName']} ({error['nodeId']}), {error['message']}")
        for item in report.get("manualReview", []):
            print(f"- 人工复核, {item}")
        if report["sources"]:
            print("来源链接")
            for source in report["sources"]:
                print(f"- {source['nodeName']} ({source['nodeId']}), {source['url']}")
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())

"""Verify Figmosha command assembly, output and exit codes without a live Figma file."""

import io
import json
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

import figma_lint


class FigmoshaCommandTests(unittest.TestCase):
    def run_cli(self, response, *options, status=200):
        stdout, stderr = io.StringIO(), io.StringIO()
        reply = io.BytesIO(response if isinstance(response, bytes) else json.dumps(response).encode())
        reply.status = status
        reply.reason = "Bridge unavailable"
        with patch("figma_lint.http.client.HTTPConnection") as connect:
            conn = connect.return_value
            conn.getresponse.return_value = reply
            with redirect_stdout(stdout), redirect_stderr(stderr):
                result = figma_lint.main(["--target", "workfile", *options])
            self.assertEqual(connect.call_args.args, ("127.0.0.1", 18787))
            self.assertEqual(conn.request.call_args.args, ("POST", "/exec"))
            sent = json.loads(conn.request.call_args.kwargs["body"])
        return result, stdout.getvalue(), stderr.getvalue(), sent

    def test_inspects_current_page_and_preserves_source_links(self):
        page = {"name": "补丁审阅", "id": "5:1"}
        source = {"nodeId": "5:4", "nodeName": "原始工具栏", "url": "https://design.example/toolbar"}
        report = {"page": page, "errors": [], "sources": [source],
                  "manualReview": ["用接收方账号核对访问权限", "查看首稿导出"]}
        result, output, errors, sent = self.run_cli({"ok": True, "value": report}, "--json")
        self.assertEqual((result, errors), (0, ""))
        self.assertEqual(sent["target"], "workfile")
        self.assertTrue(sent["code"].endswith('return await checkDesignPage(figma, {"mode": "single-screen"})'))
        self.assertEqual(json.loads(output)["sources"], [source])
        self.assertEqual(json.loads(output)["sourceAccess"]["status"], "unverified")
        _, text, _, _ = self.run_cli({"ok": True, "value": report})
        self.assertIn("single-screen", text)
        self.assertIn(source["url"], text)
        self.assertIn("查看首稿导出", text)
        self.assertIn("核对访问权限", text)

    def test_design_error_names_node_and_quotes_page_as_data(self):
        issue = {"rule": "task.link", "nodeId": "5:8", "nodeName": "审阅补丁", "message": "补上对应的组件"}
        report = {"page": {"name": "迭代", "id": "5:1"}, "errors": [issue], "sources": []}
        page = '终稿 "B"\n第三行'
        result, text, errors, sent = self.run_cli({"ok": True, "value": report}, "--page", page, "--mode", "workflow")
        self.assertEqual((result, errors), (1, ""))
        self.assertIn("审阅补丁 (5:8)", text)
        self.assertIn("补上对应的组件", text)
        tail = sent["code"].splitlines()[-1]
        self.assertTrue(tail.startswith("return await checkDesignPage(figma, "))
        self.assertEqual(json.loads(tail.split("figma, ", 1)[1][:-1]), {"page": page, "mode": "workflow"})
        libraries = [figma_lint.TOOLS.joinpath(name).read_text(encoding="utf-8")
                     for name in ("figma_flow.js", "figma_screen_scope.js", "check_design_page.js")]
        self.assertEqual(sent["code"], "\n".join([*libraries, tail]))

    def test_rejects_unknown_mode_without_contacting_bridge(self):
        with patch("figma_lint.bridge_request") as bridge, redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as exit:
            figma_lint.main(["--target", "workfile", "--mode", "single"])
        self.assertEqual(exit.exception.code, 2)
        bridge.assert_not_called()

    def test_disconnected_target_and_malformed_response_are_execution_errors(self):
        for value, status, expected in [
            ({"ok": False, "error": "no files connected"}, 503, "no files connected"),
            ({"ok": True, "value": {"page": {"id": "0:1", "name": "稿"}}}, 200, "errors"),
            (b"not json", 200, "检查未完成"),
        ]:
            with self.subTest(value=value):
                result, text, errors, _ = self.run_cli(value, "--json", status=status)
                self.assertEqual((result, text), (2, ""))
                self.assertIn(expected, errors)


if __name__ == "__main__":
    unittest.main()

import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

import read_figma_examples as reader


class NativeExampleTests(unittest.TestCase):
    def run_reader(self, *replies):
        output = io.StringIO()
        with patch.object(reader, "bridge_request", side_effect=replies) as request:
            with redirect_stdout(output), redirect_stderr(output):
                result = reader.main()
        return result, output.getvalue(), request.call_args_list

    def test_disconnected_bridge_and_empty_list_report_all_examples(self):
        for reply in (ConnectionRefusedError(), {"files": []}):
            with self.subTest(reply=reply):
                code, output, calls = self.run_reader(reply)
                self.assertEqual(code, 1)
                self.assertEqual([call.args[:2] for call in calls], [("GET", "/targets")])
                for label in reader.EXAMPLES:
                    self.assertIn(label, output)
                self.assertIn("Figmosha", output)

    def test_rejects_unrelated_ambiguous_and_conflicting_documents(self):
        name, doc, key = reader.DESIGNS
        known = {"name": name, "doc": doc, "fileKey": key}
        for files in ([dict(known, doc="different", fileKey=None)], [dict(known, fileKey="different")],
                      [dict(known, doc=reader.BASELINE[1])], [known, known],
                      [dict(known, doc="new"), dict(known, doc="new", fileKey=None)]):
            with self.subTest(files=files):
                code, _, calls = self.run_reader({"files": files})
                self.assertEqual(code, 1)
                self.assertEqual(len(calls), 1)

    def test_renamed_file_matches_by_document_id_or_file_key(self):
        _, doc, key = reader.DESIGNS
        for target in ({"name": "新名称", "doc": doc, "fileKey": None},
                       {"name": "新名称", "doc": "new-id", "fileKey": key}):
            with self.subTest(target=target):
                _, _, calls = self.run_reader({"files": [target]}, {"ok": True, "value": {}})
                self.assertEqual(calls[1].args[2]["target"], target["doc"])
                self.assertEqual(len(calls), 2)

    def test_reports_individual_nodes_when_only_one_file_is_open(self):
        name, doc, _ = reader.BASELINE
        targets = {"files": [{"name": name, "doc": doc, "fileKey": None}]}
        rows = {"5:242": {"detail": "Foundations"}, "2:166": {"error": "原稿内缺少节点"}}
        code, output, calls = self.run_reader(targets, {"ok": True, "value": rows})
        self.assertEqual(code, 1)
        self.assertIn("Linear  已读取 1/4", output)
        for text in ("5:242  Foundations", "2:166  未读取", "7:29  未读取", "Untitled"):
            self.assertIn(text, output)
        self.assertEqual(calls[1].args[2]["target"], doc)
        self.assertEqual(len(calls), 2)

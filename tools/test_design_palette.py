"""Pixel-level regressions for sourced interface colors, status badges and media."""

import struct
import tempfile
import unittest
import zlib
from pathlib import Path

from design_lint import DesignLint
from design_palette import check_palette, green
from test_design_lint import png_chunk


def write_pixels(path, rects, base=(255, 255, 255), width=160, height=120):
    rows = [bytearray(bytes(base) * width) for _ in range(height)]
    for x, y, w, h, rgb in rects:
        for row in rows[y:y+h]:
            row[3*x:3*(x+w)] = bytes(rgb) * w
    header = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    pixels = b''.join(b'\0' + row for row in rows)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR', header) +
                     png_chunk(b'IDAT', zlib.compress(pixels)) + png_chunk(b'IEND', b''))


def evidence(token, box, source):
    return {'token': token, 'box': list(box), 'sourceAt': list(source)}


class PaletteTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.path = Path(tmp.name) / 'example'
        (self.path / 'components').mkdir(parents=True)
        self.colors = {'paper': (255, 255, 255), 'ink': (17, 17, 17)}
        self.button = (110, 85, 42, 22)
        self.rects = [(*self.button, self.colors['ink'])]
        self.roles = {'reading': evidence('paper', (0, 0, 160, 120), (4, 4)),
                      'primary': evidence('ink', self.button, (112, 90))}
        self.data = {'states': {'read': {'primary': 'save'}},
                     'components': {'save': {'variants': {'default': {'on': 'read', 'box': list(self.button)}}}},
                     'palette': {'states': {'read': self.roles}}}
        self.media = {'read': []}
        self.green = (43, 131, 65)
        write_pixels(self.path / 'final.png', self.rects + [(0, 112, 30, 8, self.green)])

    def run_check(self):
        file = self.path / 'screen.png'
        write_pixels(file, self.rects)
        checker = DesignLint(self.path)
        checker.named_files['read'] = file
        measured = check_palette(checker, self.data, 'read', self.colors, self.path, self.media)
        return checker.errors, measured

    def require_issue(self, path_fragment, message_fragment=''):
        issues, _ = self.run_check()
        self.assertTrue(any(path_fragment in row['path'] and message_fragment in row['message']
                            for row in issues), issues)

    def test_observations_use_source_and_export_pixels(self):
        errors, result = self.run_check()
        self.assertEqual(errors, [])
        self.assertEqual(result[1]['sourceImage'], 'final.png')
        self.assertEqual(result[1]['sourceHex'], '#111111')
        self.assertEqual(result[1]['exportHex'], '#111111')
        self.roles['primary']['sourceAt'] = [4, 4]
        self.require_issue('primary.sourceAt', '#FFFFFF')

    def test_source_image_must_belong_to_selected_case(self):
        other = self.path.parent / 'other.png'
        write_pixels(other, self.rects)
        (self.path / 'components' / 'linked.png').symlink_to(other)
        for name in ('spec.png', 'components/../final.png', 'components/nested/button.png',
                     str(other), 'components/missing.png', 'components/linked.png', []):
            with self.subTest(name=name):
                self.roles['primary']['sourceImage'] = name
                self.require_issue('primary.sourceImage')

    def test_old_spec_source_prompts_for_component_path(self):
        self.roles['primary']['sourceRole'] = 'spec'
        self.require_issue('primary.sourceRole', 'sourceImage')

    def test_rejects_coordinates_or_tokens_unrelated_to_real_control(self):
        self.roles['primary']['box'] = [0, 0, 32, 32]
        self.require_issue('primary.box', 'default')
        self.roles['primary'] = evidence('paper', self.button, (4, 4))
        self.require_issue('primary.box', '取样点')
        self.roles['primary']['sourceAt'] = [400, 400]
        self.require_issue('primary.sourceAt', 'outside')

    def test_forest_and_olive_fail_even_when_undeclared(self):
        for rgb in [(37, 62, 51), (49, 88, 68), (110, 110, 50)]:
            with self.subTest(rgb=rgb):
                self.rects.append((0, 0, 160, 22, rgb))
                self.require_issue('palette.states.read', '#' + bytes(rgb).hex().upper())
                self.rects.pop()

    def test_unsourced_non_green_surface_is_reported(self):
        self.rects.append((0, 0, 160, 22, (53, 104, 204)))
        self.require_issue('palette.states.read', '#3568CC')

    def test_slight_color_variation_still_needs_a_source(self):
        for x in range(160):
            self.rects.append((x, 0, 1, 22, (32+x%8, 96+x%9, 192+x%11)))
        self.require_issue('palette.states.read', '邻近色')

    def test_media_is_excluded_and_cannot_cover_controls(self):
        self.rects.append((0, 0, 65, 60, (52, 90, 70)))
        self.media['read'] = [(0, 0, 65, 60)]
        self.assertEqual(self.run_check()[0], [])
        self.media['read'].append(self.button)
        self.require_issue('palette.states.read', '媒体框外')

    def add_success(self, rgb):
        self.colors['successColor'] = rgb
        self.rects.append((32, 40, 16, 12, rgb))
        write_pixels(self.path / 'components' / 'status.png', [(12, 12, 30, 30, rgb)])
        entry = evidence('successColor', (32, 40, 16, 12), (20, 20))
        entry.update(meaning='Record saved after confirmation', sourceImage='components/status.png')
        self.data['palette']['success'] = {'read': [entry]}
        return entry

    def test_success_is_small_local_and_source_verified(self):
        status = self.add_success(self.green)
        errors, samples = self.run_check()
        self.assertEqual(errors, [])
        self.assertEqual(samples[0]['sourceImage'], 'components/status.png')
        self.rects.append((61, 80, 8, 8, self.green))
        self.require_issue('palette.states.read', '#2B8341')
        self.rects.pop()
        status['sourceAt'] = [110, 50]
        self.require_issue('success.read[0].sourceAt', '#FFFFFF')
        status['sourceAt'] = [20, 20]
        status['box'] = [30, 39, 32, 24]
        self.require_issue('palette.success.read', '2%')
        status['box'] = list(self.button)
        self.require_issue('success.read[0].box', '主操作')

    def test_rejected_status_token_and_visible_color(self):
        for rgb in [(232, 240, 233), (52, 90, 70)]:
            with self.subTest(rgb=rgb):
                self.add_success(rgb)
                self.require_issue('colors.successColor.hex')
                self.require_issue('success.read[0].box', '#' + bytes(rgb).hex().upper())

    def test_gray_blue_beige_and_bright_yellow_are_not_green(self):
        for rgb in [(37,76,114), (210,214,212), (250,249,245), (228,226,212), (72,150,166), (204,207,193), (207,208,195), (255,255,0), (219,216,85)]:
            self.assertFalse(green(rgb), rgb)
        self.assertTrue(green((112,112,58)))

    def test_control_fill_cannot_be_hidden_behind_one_white_label(self):
        self.rects.extend([(*self.button, (125,42,20)), (125,92,12,6, (255,255,255))])
        self.roles['primary'] = evidence('paper', (125,92,1,1), (4,4))
        self.require_issue('primary.box', '60%')
        self.roles['primary']['box'] = list(self.button)
        self.require_issue('primary.box', '#7D2A14')
        del self.data['components']['save']['variants']
        self.roles['primary']['box'] = [125,92,1,1]
        self.require_issue('primary.box', '12×8')

    def test_text_action_can_use_verified_surrounding_surface(self):
        self.rects = [(121,93,20,4, self.colors['ink'])]
        self.assertEqual(self.run_check()[0], [])

    def traffic_lights(self, colors):
        for idx, rgb in enumerate(colors):
            for dy in range(12):
                for dx in range(12):
                    if (dx-5.5)**2 + (dy-5.5)**2 <= 35:
                        self.rects.append((22+20*idx+dx,22+dy,1,1,rgb))

    def test_native_triplet_allows_only_the_small_window_control(self):
        native = (97,176,121)
        self.colors['nativeZoom'] = native
        self.traffic_lights([(233,107,97), (233,183,72), native])
        self.assertEqual(self.run_check()[0], [])
        self.rects.append((80,22,12,12,native))
        self.require_issue('palette.states.read', '#61B079')

    def test_native_mask_never_hides_brand_or_rejected_color(self):
        self.traffic_lights([(233,107,97), (233,183,72), (97,176,121)])
        self.roles['brand'] = evidence('paper', (60,20,16,16), (4,4))
        self.require_issue('palette.states.read.brand', '#61B079')
        del self.roles['brand']
        self.rects.append((64,24,6,6,(52,90,70)))
        self.require_issue('palette.states.read', '#345A46')

    def test_legacy_manifest_reports_only_verified_ui_pixels(self):
        del self.data['palette']
        self.media = {}
        self.rects += [(0, 0, 60, 20, (37, 62, 51)), (0, 40, 60, 42, (49, 88, 68))]
        self.data['layout'] = {'zones': {'toolbar': [0, 0, 160, 20], 'art': [0, 40, 60, 42]}}
        messages = [row['message'] for row in self.run_check()[0]]
        self.assertTrue(any('#253E33' in m and '[' in m for m in messages))
        self.assertFalse(any('#315844' in m for m in messages))


if __name__ == '__main__':
    unittest.main()

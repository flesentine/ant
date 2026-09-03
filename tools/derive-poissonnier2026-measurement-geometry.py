#!/usr/bin/env python3
import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('reconstruct', HERE / 'reconstruct-poissonnier2026.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

PINNED_XLSX_SHA256 = 'b311d5fdc89eac56724bb5195743cf4bb52a6cff4040b18704353091e1fe6318'


def f(row, key):
    return float(row[key])


def stats(values):
    xs = sorted(float(x) for x in values)
    if not xs:
        return None

    def q(p):
        pos = (len(xs) - 1) * p
        lo = int(math.floor(pos))
        hi = int(math.ceil(pos))
        if lo == hi:
            return xs[lo]
        a = pos - lo
        return xs[lo] * (1 - a) + xs[hi] * a

    return {
        'n': len(xs),
        'min': xs[0],
        'q10': q(0.10),
        'median': q(0.50),
        'q90': q(0.90),
        'max': xs[-1]
    }


def main():
    if len(sys.argv) < 2:
        raise SystemExit('usage: derive-poissonnier2026-measurement-geometry.py dataset.xlsx [output.json]')

    source = Path(sys.argv[1])
    source_sha = hashlib.sha256(source.read_bytes()).hexdigest()
    if source_sha != PINNED_XLSX_SHA256:
        raise SystemExit(f'pinned XLSX SHA256 mismatch: expected {PINNED_XLSX_SHA256}, got {source_sha}')

    source_rows = mod.records(mod.sheets(source)['Exp 1'])
    controls = [r for r in source_rows if r['Pheromone'] == 'n']
    if len(controls) != 51:
        raise SystemExit(f'expected 51 DCM-control rows, got {len(controls)}')

    out_rows = []
    midpoint_errors = []
    widths = []
    heights = []
    offsets = []
    x_fracs = []
    y_fracs = []

    for r in controls:
        xmin = f(r, 'Xmin_Arena')
        xmax = f(r, 'Xmax_Arena')
        ymin = f(r, 'Ymin_Arena')
        ymax = f(r, 'Ymax_Arena')
        yline = f(r, 'Y_Line')
        xstart = f(r, 'Xstart')
        ystart = f(r, 'Ystart')

        width = xmax - xmin
        height = ymax - ymin
        if not (width > 0 and height > 0):
            raise SystemExit(f'non-positive tracked arena dimensions for ant {r["ant_ID"]}')

        first_x = xstart - xmin
        first_y = ystart - ymin
        centerline_y = yline - ymin
        entry_x = width / 2.0
        entry_y = centerline_y
        dx = first_x - entry_x
        dy = first_y - entry_y
        radius = math.hypot(dx, dy)

        if not (-1e-9 <= first_x <= width + 1e-9 and -1e-9 <= first_y <= height + 1e-9):
            raise SystemExit(f'first tracked position outside tracked arena bounds for ant {r["ant_ID"]}')
        if not (-1e-9 <= centerline_y <= height + 1e-9):
            raise SystemExit(f'centerline outside tracked arena bounds for ant {r["ant_ID"]}')

        widths.append(width)
        heights.append(height)
        offsets.append(radius)
        x_fracs.append(first_x / width)
        y_fracs.append(first_y / height)
        midpoint_errors.append(abs(yline - (ymin + ymax) / 2.0))

        out_rows.append({
            'ant_id': int(float(r['ant_ID'])),
            'colony': int(float(r['Colony'])),
            'arena_width_mm': width,
            'arena_height_mm': height,
            'entry_reference_x_mm': entry_x,
            'entry_reference_y_mm': entry_y,
            'first_track_x_mm': first_x,
            'first_track_y_mm': first_y
        })

    out_rows.sort(key=lambda x: x['ant_id'])
    ant_ids = [r['ant_id'] for r in out_rows]
    if len(set(ant_ids)) != len(ant_ids):
        raise SystemExit('duplicate ant_id in DCM-control geometry rows')

    result = {
        'schema_version': 1,
        'id': 'poissonnier2026_open_arena_measurement_geometry_v1',
        'status': 'measurement_input_reconstruction_pre_H5_mechanism_freeze',
        'source': 'poissonnier2026_final_record',
        'source_xlsx_sha256': source_sha,
        'scope': 'experiment_1_DCM_controls_geometry_only_no_outcomes_no_treatment_label',
        'source_fields_used': [
            'ant_ID', 'Colony', 'Pheromone',
            'Xmin_Arena', 'Xmax_Arena', 'Ymin_Arena', 'Ymax_Arena',
            'Y_Line', 'Xstart', 'Ystart'
        ],
        'fields_deliberately_not_copied': [
            'Path_length',
            'Xlast', 'Ylast', 'Beeline', 'Straightness',
            'Total_Frames', 'Proportion_Frames_MiddleZone',
            'Average_Speed', 'Average_Speed_Moving',
            'Traveled_Dist', 'Traveled_Dist_Moving'
        ],
        'coordinate_convention': {
            'local_x_mm': 'source_x - Xmin_Arena',
            'local_y_mm': 'source_y - Ymin_Arena',
            'arena_width_mm': 'Xmax_Arena - Xmin_Arena',
            'arena_height_mm': 'Ymax_Arena - Ymin_Arena',
            'entry_reference_x_mm': 'arena_width_mm / 2; article-defined central entry-hole x reference, not a measured ant coordinate',
            'entry_reference_y_mm': 'Y_Line - Ymin_Arena; article-defined central trail/entry-line reference',
            'first_track_position': 'Xstart/Ystart translated into the local tracked-arena frame; this defines the published observation start and Beeline start, not automatically the ant biological memory origin',
            'middle_zone': '1 cm on each side of the central trail; half-width 10 mm is article-defined and frozen in the separate measurement policy'
        },
        'summary': {
            'rows': len(out_rows),
            'colonies': sorted(set(r['colony'] for r in out_rows)),
            'arena_width_mm': stats(widths),
            'arena_height_mm': stats(heights),
            'first_track_radius_from_entry_mm': stats(offsets),
            'first_track_x_fraction': stats(x_fracs),
            'first_track_y_fraction': stats(y_fracs),
            'max_abs_Y_Line_minus_vertical_midpoint_mm': max(midpoint_errors)
        },
        'rows': out_rows
    }

    text = json.dumps(result, indent=2) + '\n'
    print(text, end='')
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(text)


if __name__ == '__main__':
    main()

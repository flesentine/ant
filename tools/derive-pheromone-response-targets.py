#!/usr/bin/env python3
import hashlib, importlib.util, json, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('reconstruct',HERE/'reconstruct-poissonnier2026.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

def edge(r):
    d={
      'left':abs(float(r['Xlast'])-float(r['Xmin_Arena'])),
      'right':abs(float(r['Xlast'])-float(r['Xmax_Arena'])),
      'top':abs(float(r['Ylast'])-float(r['Ymin_Arena'])),
      'bottom':abs(float(r['Ylast'])-float(r['Ymax_Arena']))
    }
    return min(d,key=d.get)

def main():
    if len(sys.argv)<2:
        raise SystemExit('usage: derive-pheromone-response-targets.py dataset.xlsx [output.json]')
    source=Path(sys.argv[1])
    rows=mod.records(mod.sheets(source)['Exp 1'])
    out=[]
    counts={}
    for r in rows:
        pher=str(r['Pheromone']).strip().lower()
        if pher not in ('n','y'):
            raise SystemExit(f"unexpected Pheromone value {r['Pheromone']!r}")
        path_length=str(r['Path_length']).strip().lower()
        if path_length not in ('s','l'):
            raise SystemExit(f"unexpected Path_length value {r['Path_length']!r}")
        treatment='pheromone' if pher=='y' else 'dcm_control'
        exit_edge=edge(r)
        key=f"{treatment}_{'short' if path_length=='s' else 'long'}"
        counts[key]=counts.get(key,0)+1
        out.append({
          'ant_id':int(float(r['ant_ID'])),
          'colony':int(float(r['Colony'])),
          'path_length':path_length,
          'treatment':treatment,
          'trail_present':pher=='y',
          'time_to_exit_s':float(r['Total_Frames'])/25,
          'middle_zone_fraction':float(r['Proportion_Frames_MiddleZone']),
          'beeline_mm':float(r['Beeline']),
          'exit_edge':exit_edge,
          'trail_axis_exit':exit_edge in ('left','right')
        })
    result={
      'schema_version':1,
      'source':'poissonnier2026_final_record',
      'source_xlsx_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
      'scope':'open_arena_painted_trail_response_threshold_independent_observables',
      'status':'development_response_estimation_only_not_external_validation',
      'treatment_groups':counts,
      'primary_response_observables':['middle_zone_fraction','trail_axis_exit'],
      'secondary_guard_observables':['time_to_exit_s','beeline_mm'],
      'row_observables':['time_to_exit_s','middle_zone_fraction','beeline_mm','exit_edge','trail_axis_exit'],
      'excluded_from_response_estimation':['Average_Speed_Moving','Traveled_Dist_Moving','Straightness','Prop_time_moving','Average_Speed','Traveled_Dist'],
      'contrast_rule':'Estimate pheromone response from pheromone-vs-DCM treatment contrasts within each path-length stratum; do not use these rows to refit baseline locomotion or path-history mechanisms.',
      'rows':out
    }
    text=json.dumps(result,indent=2)+'\n'
    print(text,end='')
    if len(sys.argv)>2:
        Path(sys.argv[2]).write_text(text)

if __name__=='__main__':
    main()

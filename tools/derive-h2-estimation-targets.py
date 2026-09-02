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
    if len(sys.argv)<2:raise SystemExit('usage: derive-h2-estimation-targets.py dataset.xlsx [output.json]')
    source=Path(sys.argv[1]);rows=mod.records(mod.sheets(source)['Exp 1']);rows=[r for r in rows if r['Pheromone']=='n']
    out=[]
    for r in rows:
        out.append({
          'ant_id':int(float(r['ant_ID'])),
          'colony':int(float(r['Colony'])),
          'path_length':r['Path_length'],
          'time_to_exit_s':float(r['Total_Frames'])/25,
          'middle_zone_fraction':float(r['Proportion_Frames_MiddleZone']),
          'beeline_mm':float(r['Beeline']),
          'exit_edge':edge(r)
        })
    result={
      'schema_version':1,
      'source':'poissonnier2026_final_record',
      'source_xlsx_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
      'scope':'open_arena_DCM_controls_threshold_independent_observables',
      'status':'development_estimation_only_not_external_validation',
      'excluded_from_estimation':['Average_Speed_Moving','Traveled_Dist_Moving','Straightness','Prop_time_moving'],
      'observables':['time_to_exit_s','middle_zone_fraction','beeline_mm','exit_edge'],
      'rows':out
    }
    text=json.dumps(result,indent=2)+'\n';print(text,end='')
    if len(sys.argv)>2:Path(sys.argv[2]).write_text(text)
if __name__=='__main__':main()

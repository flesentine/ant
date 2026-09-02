#!/usr/bin/env python3
import hashlib,importlib.util,json,math,random,statistics,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('reconstruct',HERE/'reconstruct-poissonnier2026.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
METRICS={'mean_moving_speed_mm_s':('Average_Speed_Moving',1.0),'total_distance_mm':('Traveled_Dist_Moving',1.0),'time_to_arena_edge_s':('Total_Frames',1/25),'path_straightness':('Straightness',1.0),'central_zone_fraction':('Proportion_Frames_MiddleZone',1.0)}
def q(vals,p):
 vals=sorted(vals);x=(len(vals)-1)*p;lo=math.floor(x);hi=math.ceil(x);return vals[lo] if lo==hi else vals[lo]+(vals[hi]-vals[lo])*(x-lo)
def main():
 if len(sys.argv)<2:raise SystemExit('usage: derive-poissonnier2026-control-effects.py dataset.xlsx [output.json]')
 source=Path(sys.argv[1]);source_sha256=hashlib.sha256(source.read_bytes()).hexdigest();rows=mod.records(mod.sheets(source)['Exp 1']);rows=[r for r in rows if r['Pheromone']=='n'];colonies=sorted({int(float(r['Colony'])) for r in rows});rng=random.Random(20260901)
 result={'schema_version':1,'source':'poissonnier2026_final_record','source_xlsx_sha256':source_sha256,'scope':'open_arena_DCM_controls_only','contrast':'short_20cm_minus_long_100cm','status':'descriptive_model_screening_only_not_fitting','bootstrap':{'method':'independent within-treatment nonparametric bootstrap of per-ant summary rows','replicates':20000,'seed':20260901,'rng':'Python random.Random','warning':'Descriptive screening interval only; it does not model colony clustering.'},'metrics':{}}
 for name,(col,scale) in METRICS.items():
  s=[float(r[col])*scale for r in rows if r['Path_length']=='s'];l=[float(r[col])*scale for r in rows if r['Path_length']=='l'];diff=statistics.mean(s)-statistics.mean(l);bs=[statistics.mean(rng.choice(s) for _ in s)-statistics.mean(rng.choice(l) for _ in l) for _ in range(20000)];pooled=math.sqrt(((len(s)-1)*statistics.variance(s)+(len(l)-1)*statistics.variance(l))/(len(s)+len(l)-2));loo=[]
  for c in colonies:
   rr=[r for r in rows if int(float(r['Colony']))!=c];ss=[float(r[col])*scale for r in rr if r['Path_length']=='s'];ll=[float(r[col])*scale for r in rr if r['Path_length']=='l'];loo.append({'held_out_colony':c,'short_minus_long':statistics.mean(ss)-statistics.mean(ll)})
  result['metrics'][name]={'n_short':len(s),'n_long':len(l),'mean_short':statistics.mean(s),'mean_long':statistics.mean(l),'sd_short':statistics.stdev(s),'sd_long':statistics.stdev(l),'short_minus_long':diff,'bootstrap95_short_minus_long':[q(bs,.025),q(bs,.975)],'cohens_d_descriptive':diff/pooled,'leave_one_colony_out':loo,'loo_sign_stable':all((v['short_minus_long']>0)==(diff>0) for v in loo)}
 text=json.dumps(result,indent=2)+'\n';print(text,end='');
 if len(sys.argv)>2:Path(sys.argv[2]).write_text(text)
if __name__=='__main__':main()

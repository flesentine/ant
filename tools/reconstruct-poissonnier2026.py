#!/usr/bin/env python3
import json, sys, zipfile, xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
MAIN='http://schemas.openxmlformats.org/spreadsheetml/2006/main';REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships';PKG='http://schemas.openxmlformats.org/package/2006/relationships'
def ci(ref):
    n=0
    for c in ''.join(x for x in ref if x.isalpha()):n=n*26+ord(c.upper())-64
    return n-1
def sheets(path):
    with zipfile.ZipFile(path) as z:
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'));shared=[''.join(t.text or '' for t in si.iter(f'{{{MAIN}}}t')) for si in root.findall(f'{{{MAIN}}}si')]
        wb=ET.fromstring(z.read('xl/workbook.xml'));rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'));rm={r.attrib['Id']:r.attrib['Target'] for r in rels.findall(f'{{{PKG}}}Relationship')};out={}
        for s in wb.find(f'{{{MAIN}}}sheets'):
            name=s.attrib['name'];target=rm[s.attrib[f'{{{REL}}}id']].lstrip('/');target=target if target.startswith('xl/') else 'xl/'+target;root=ET.fromstring(z.read(target));rows=[]
            for row in root.findall(f'.//{{{MAIN}}}sheetData/{{{MAIN}}}row'):
                vals={}
                for c in row.findall(f'{{{MAIN}}}c'):
                    typ=c.attrib.get('t');v=c.find(f'{{{MAIN}}}v');val='' if v is None else (shared[int(v.text)] if typ=='s' and v.text else v.text or '')
                    if typ=='inlineStr':val=''.join(t.text or '' for t in c.iter(f'{{{MAIN}}}t'))
                    vals[ci(c.attrib.get('r','A1'))]=val
                if vals:rows.append([vals.get(i,'') for i in range(max(vals)+1)])
            out[name]=rows
        return out
def records(rows):
    h=rows[0];return [{h[i]:r[i] if i<len(r) else '' for i in range(len(h))} for r in rows[1:]]
def f(v):return float(v)
def mean(rows,key):return sum(f(r[key]) for r in rows)/len(rows)
def main():
    if len(sys.argv)<2:raise SystemExit('usage: reconstruct-poissonnier2026.py dataset.xlsx [output.json]')
    ss=sheets(sys.argv[1]);e1=records(ss['Exp 1']);e2=records(ss['Exp 2']);groups={}
    for ph in ('n','y'):
      for pl in ('s','l'):
        r=[x for x in e1 if x['Pheromone']==ph and x['Path_length']==pl];groups[f'{ph}_{pl}']={'n':len(r),'mean_average_speed_moving_mm_s':mean(r,'Average_Speed_Moving'),'mean_traveled_dist_moving_mm':mean(r,'Traveled_Dist_Moving'),'mean_straightness':mean(r,'Straightness'),'mean_total_frames':mean(r,'Total_Frames'),'mean_time_to_exit_s_at_25fps':mean(r,'Total_Frames')/25,'mean_middle_zone_fraction':mean(r,'Proportion_Frames_MiddleZone')}
    conditions={}
    for t in sorted(set(r['treatment'] for r in e2)):
      rr=[r for r in e2 if r['treatment']==t];correct=sum(int(f(r['correct'])) for r in rr);conditions[t]={'n':len(rr),'correct':correct,'rate':correct/len(rr)}
    overall=sum(v['correct'] for v in conditions.values());result={'experiment_1':{'rows':len(e1),'group_means':groups,'straightness_formula_max_abs_error':max(abs(f(r['Straightness'])-f(r['Beeline'])/f(r['Traveled_Dist_Moving'])) for r in e1)},'experiment_2':{'rows':len(e2),'conditions':conditions,'correct':overall,'rate':overall/len(e2),'decision_match_mismatches':sum(int((r['decision']==r['phero_side'])!=(int(f(r['correct']))==1)) for r in e2)}}
    text=json.dumps(result,indent=2);print(text)
    if len(sys.argv)>2:Path(sys.argv[2]).write_text(text+'\n')
if __name__=='__main__':main()

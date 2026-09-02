#!/usr/bin/env python3
import hashlib, json, sys, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
NS_MAIN='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
NS_REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PKG_REL='http://schemas.openxmlformats.org/package/2006/relationships'
def sha256(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()
def col_index(ref):
    letters=''.join(c for c in ref if c.isalpha());n=0
    for c in letters:n=n*26+(ord(c.upper())-64)
    return n-1
def xlsx_inventory(path):
    out={'filename':Path(path).name,'sha256':sha256(path),'sheets':[]}
    with zipfile.ZipFile(path) as z:
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root.findall(f'{{{NS_MAIN}}}si'): shared.append(''.join(t.text or '' for t in si.iter(f'{{{NS_MAIN}}}t')))
        wb=ET.fromstring(z.read('xl/workbook.xml'));rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        relmap={r.attrib['Id']:r.attrib['Target'] for r in rels.findall(f'{{{PKG_REL}}}Relationship')}
        for s in wb.find(f'{{{NS_MAIN}}}sheets'):
            name=s.attrib.get('name');rid=s.attrib.get(f'{{{NS_REL}}}id');target=relmap[rid].lstrip('/')
            if not target.startswith('xl/'):target='xl/'+target
            root=ET.fromstring(z.read(target));rows=[]
            for row in root.findall(f'.//{{{NS_MAIN}}}sheetData/{{{NS_MAIN}}}row'):
                vals={}
                for c in row.findall(f'{{{NS_MAIN}}}c'):
                    ref=c.attrib.get('r','A1');typ=c.attrib.get('t');v=c.find(f'{{{NS_MAIN}}}v');value='' if v is None else (shared[int(v.text)] if typ=='s' and v.text else v.text or '')
                    if typ=='inlineStr':value=''.join(t.text or '' for t in c.iter(f'{{{NS_MAIN}}}t'))
                    vals[col_index(ref)]=value
                if vals:
                    width=max(vals)+1;rows.append([vals.get(i,'') for i in range(width)])
            out['sheets'].append({'name':name,'row_count':len(rows),'header':rows[0] if rows else [],'preview':rows[1:4] if len(rows)>1 else []})
    return out
def rmd_inventory(path):
    text=Path(path).read_text(errors='replace');patterns=['read_excel','read_xlsx','read.csv','AnimalTA','moving','speed','straight','follow','choice','decision','colony','coordinates'];hits=[]
    for i,line in enumerate(text.splitlines(),1):
        low=line.lower()
        if any(p.lower() in low for p in patterns):hits.append({'line':i,'text':line[:500]})
    return {'filename':Path(path).name,'sha256':sha256(path),'line_count':len(text.splitlines()),'relevant_lines':hits[:250]}
def main():
    if len(sys.argv)!=3:raise SystemExit('usage: inventory-reference.py analysis.rmd dataset.xlsx')
    result={'analysis':rmd_inventory(sys.argv[1]),'dataset':xlsx_inventory(sys.argv[2])}
    print('ANTLAB_REFERENCE_INVENTORY_JSON='+json.dumps(result,separators=(',',':')));print(json.dumps(result,indent=2))
if __name__=='__main__':main()

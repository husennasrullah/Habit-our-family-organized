import urllib.request,zipfile,io,xml.etree.ElementTree as E,json,hashlib
from pathlib import Path
sources=[];data={}
for sex in ['boys','girls']:
 for kind,age,revision in [('wfa','0-to-5-years',{'boys':'97a05331_9','girls':'4c03b8db_7'}[sex]),('lhfa','0-to-2-years',{'boys':'30e044c_9','girls':'e9e66a95_11'}[sex]),('lhfa','2-to-5-years',{'boys':'17e5ad91_9','girls':'2ec187b9_11'}[sex])]:
  category='weight-for-age' if kind=='wfa' else 'length-height-for-age'
  url=f'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/{category}/{kind}_{sex}_{age}_zscores.xlsx?sfvrsn={revision}'
  blob=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':'https://www.who.int/'}),timeout=30).read()
  z=zipfile.ZipFile(io.BytesIO(blob));ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
  shared=[''.join(n.itertext()) for n in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)]
  rows=[]
  for row in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//s:row',ns):
   vals=[]
   for c in row.findall('s:c',ns):
    v=c.find('s:v',ns)
    if v is not None:vals.append(shared[int(v.text)] if c.get('t')=='s' else float(v.text))
   rows.append(vals)
  print(sex,kind,age,rows[0],len(rows)-1)
  # Store exact rounded table -2 SD, median, +2 SD, with month value. No fabricated values.
  header=rows[0];indices=[header.index(x) for x in ['Month','SD2neg','SD0','SD2']]
  data[f'{sex}_{kind}_{age}']=[[int(r[indices[0]]),*[r[i] for i in indices[1:]]] for r in rows[1:] if len(r)==len(header)]
  sources.append({'key':f'{sex}_{kind}_{age}','url':url,'sha256':hashlib.sha256(blob).hexdigest(),'header':header})
Path('frontend/lib/data/who-growth.json').write_text(json.dumps(data,separators=(',',':'))+'\n')
Path('docs/data/who-growth-sources.json').write_text(json.dumps({'retrieved':'2026-11-13','columns':['month','minus2sd','median','plus2sd'],'sources':sources},indent=2)+'\n')

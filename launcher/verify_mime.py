"""Use Windows curl to verify the packaged SPA asset contract."""
import argparse
import json
import re
import subprocess
from pathlib import Path
from urllib.request import urlopen

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://127.0.0.1:8766')
args=parser.parse_args()
html=urlopen(args.url+'/').read().decode('utf8')
script=re.search(r'src="(main-[^"]+\.js)"',html).group(1)
style=re.search(r'href="(styles-[^"]+\.css)"',html).group(1)
css=urlopen(args.url+'/'+style).read().decode('utf8')
font=re.search(r'url\(["\']?(?:\./)?([^"\')]+\.woff2)',css).group(1)
checks=[('/',{'text/html'},200),(script,{'text/javascript','application/javascript'},200),(style,{'text/css'},200),('assets/i18n/fr.json',{'application/json'},200),('assets/i18n/ar.json',{'application/json'},200),(font,{'font/woff2'},200),('missing-acceptance.js',{'text/html'},404)]
results=[]
for path,types,status in checks:
    output=subprocess.check_output(['curl.exe','--silent','--show-error','--output','NUL','--write-out','%{http_code} %{content_type}',args.url+'/'+path.lstrip('/')],text=True).strip()
    code,mime=output.split(' ',1)
    passed=int(code)==status and mime.split(';')[0] in types
    results.append({'path':path,'status':int(code),'mime':mime,'passed':passed})
destination=Path(__file__).resolve().parent.parent/'docs'/'packaged-mime.json'
destination.write_text(json.dumps(results,indent=2)+'\n',encoding='utf8')
print(json.dumps(results,indent=2))
if not all(row['passed'] for row in results):
    raise SystemExit(1)

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { parseTemplate } from '@angular/compiler';

const root=path.resolve('src/app');
const fr=JSON.parse(fs.readFileSync('src/assets/i18n/fr.json','utf8'));
const ar=JSON.parse(fs.readFileSync('src/assets/i18n/ar.json','utf8'));
const flatten=(value,prefix='')=>Object.entries(value).flatMap(([key,value])=>typeof value==='object'?flatten(value,prefix+key+'.'):[prefix+key]);
const keys=new Set(flatten(fr));
const errors=[];
for(const key of new Set([...keys,...flatten(ar)]))if(!keys.has(key)||!flatten(ar).includes(key))errors.push('Missing translation: '+key);
for(const [language,tree] of [['fr',fr],['ar',ar]])if(JSON.stringify(tree).includes('??'))errors.push(language+' contains replacement characters');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(dir,item.name)):[path.join(dir,item.name)]);
function inspect(template,file){
 const parsed=parseTemplate(template,file);
 const visit=(node,parent='')=>{
  if(node.constructor.name==='Text'&&node.value.trim()&&parent!=='mat-icon'&&/[A-Za-z\u0600-\u06ff]/.test(node.value))errors.push(file+': hard-coded text: '+node.value.trim());
  if(node.attributes)for(const attr of node.attributes)if(['placeholder','aria-label','title'].includes(attr.name)&&attr.value&&!(node.name==='app-page-header'&&keys.has(attr.value)))errors.push(file+': hard-coded '+attr.name+': '+attr.value);
  for(const child of node.children||[])visit(child,node.name||parent);
  for(const branch of node.branches||[])visit(branch,parent);
  if(node.empty)visit(node.empty,parent);
 };
 for(const node of parsed.nodes||[])visit(node);
 for(const match of template.matchAll(/'([a-zA-Z][\w]*(?:\.[\w]+)+)'\s*\|\s*transloco/g))if(!keys.has(match[1]))errors.push(file+': unknown key '+match[1]);
}
for(const file of walk(root)){
 const text=fs.readFileSync(file,'utf8');
 if(file.endsWith('.html'))inspect(text,file);
 if(file.endsWith('.ts')){
  const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
  const visit=node=>{if(ts.isPropertyAssignment(node)&&node.name.getText(source)==='template'&&(ts.isStringLiteral(node.initializer)||ts.isNoSubstitutionTemplateLiteral(node.initializer)))inspect(node.initializer.text,file);ts.forEachChild(node,visit);};visit(source);
  if(/window\.(prompt|alert)\(/.test(text))errors.push(file+': native untranslated prompt');
 }
}
console.log(errors.join('\n')||`Translation checks passed: ${keys.size} keys in each language; templates contain no literal UI text.`);
process.exitCode=errors.length?1:0;

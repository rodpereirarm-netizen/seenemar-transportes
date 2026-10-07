import json, sys, re, collections, datetime as dt, unicodedata
rows=json.load(open(sys.argv[1]))
D=lambda s: dt.datetime.fromisoformat(s) if isinstance(s,str) and re.match(r'\d{4}-\d\d-\d\d',s) else None
REF=dt.datetime(2026,10,7)
def norm(s):
    if s is None: return None
    s=unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().upper()
    s=re.sub(r'\s*-?\s*ID\s*[\d\.\-]+\.?;?','',s); s=re.sub(r'[;.\s]+$','',s.strip()); return re.sub(r'\s+',' ',s)
ph=lambda v: v is None or (isinstance(v,str) and (v.strip()=='' or re.fullmatch(r'[\s\*xX]+',v) or v.strip() in('N/C','* * *')))
fields=['secretaria','numero','contratada','objeto','unidade','quant','v_unit','v_mensal','v_anual','v_total','proc_mae','fat2023','fat2024','fat2025','fat2026','inicio','prazo','termino','doc_base','inicio_vig_ref','garantia','obs','apost_situacao','portaria','fiscal_pres','fiscal1','fiscal2','fiscal_sub','gestor','gestor_sub','dt_assin','dt_doerj','dt_pncp','siafe']
print("N rows", len(rows))
# completeness: real value / placeholder / empty
for f in fields:
    c=collections.Counter()
    for r in rows:
        v=r[f]
        if v is None or (isinstance(v,str) and v.strip()==''): c['vazio']+=1
        elif isinstance(v,str) and v.strip()=='N/C': c['N/C']+=1
        elif isinstance(v,str) and (re.fullmatch(r'[\s\*xX]+',v) or v.strip() in ('* * *','Nº')): c['placeholder']+=1
        else: c['ok']+=1
    print(f"{f:16s}", dict(c))
print()
for k in ['secretaria','doc_base','inicio_vig_ref','garantia','apost_situacao','siafe','unidade']:
    print(k, collections.Counter((r[k].strip() if isinstance(r[k],str) else r[k]) for r in rows))
print()
# publication checks
for r in rows:
    a,dj,pn,ini=D(r['dt_assin']),D(r['dt_doerj']),D(r['dt_pncp']),D(r['inicio'])
    msgs=[]
    if a and ini and ini<a: msgs.append(f"inicio<assin ({(a-ini).days}d)")
    if a and dj and dj<a: msgs.append(f"DOERJ<assin {(a-dj).days}d")
    if a and pn and pn<a: msgs.append(f"PNCP<assin {(a-pn).days}d")
    if a and dj and (dj-a).days>20: msgs.append(f"DOERJ +{(dj-a).days}d")
    if a and pn and (pn-a).days>20: msgs.append(f"PNCP +{(pn-a).days}d")
    if ini and dj and ini<dj and r['inicio_vig_ref'] and 'DOERJ' in str(r['inicio_vig_ref']): msgs.append("inicio antes da publicação DOERJ referida")
    if ini and pn and r['inicio_vig_ref'] and 'PNCP' in str(r['inicio_vig_ref']) and ini!=pn: msgs.append(f"ref PNCP mas inicio!=pncp ({(ini-pn).days}d)")
    if ini and dj and r['inicio_vig_ref'] and 'DOERJ' in str(r['inicio_vig_ref']) and ini!=dj: msgs.append(f"ref DOERJ mas inicio!=doerj ({(ini-dj).days}d)")
    if ini and a and r['inicio_vig_ref'] and 'ASSINATURA' in str(r['inicio_vig_ref']) and ini!=a: msgs.append(f"ref ASSIN mas inicio!=assin ({(ini-a).days}d)")
    print(r['row'], (r['contratada'] or '').strip()[:16], 'assin',a and a.date(),'doerj',dj and dj.date(),'pncp',pn and pn.date(),'ini',ini and ini.date(),'ref',r['inicio_vig_ref'],'|',msgs)
print()
# people
roles=['fiscal_pres','fiscal1','fiscal2','fiscal_sub','gestor','gestor_sub']
people=collections.defaultdict(lambda: collections.Counter()); raw=collections.defaultdict(set)
for r in rows:
    names=[]
    for ro in roles:
        v=r[ro]
        if ph(v): continue
        n=norm(v); people[n][ro]+=1; raw[n].add(v.strip()); names.append((ro,n))
    nn=[n for _,n in names]
    dup=[n for n,c in collections.Counter(nn).items() if c>1]
    if dup: print("same person multiple roles row",r['row'],dup,[ro for ro,n in names if n in dup])
for n in sorted(people): print(f"{n:45s} {sum(people[n].values()):2d} {dict(people[n])} variants={len(raw[n])}")
print()
# fiscal coverage for active contracts
for r in rows:
    t=D(r['termino']); 
    fis=[r[x] for x in ['fiscal_pres','fiscal1','fiscal2'] if not ph(r[x])]
    print(r['row'],(r['contratada'] or '').strip()[:15],'vig' if t and t>=REF else ('venc' if t else 'sem_term'),'nfiscais',len(fis),'sub',not ph(r['fiscal_sub']),'gestor',not ph(r['gestor']),'gsub',not ph(r['gestor_sub']),'port',r['portaria'])
# contractors normalized
print(collections.Counter(norm(r['contratada']) for r in rows).most_common(8))
print(collections.Counter(norm(r['numero']) for r in rows if r['numero']).most_common(5))
print(sorted(set(str(r['proc_mae']) for r in rows)))

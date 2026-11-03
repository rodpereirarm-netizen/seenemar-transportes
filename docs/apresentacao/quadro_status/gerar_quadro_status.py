import sys, re, copy, datetime
import openpyxl
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree
from PIL import ImageFont

XLSX, BOOK, OUT, FS = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])

NAVY = RGBColor(0x16, 0x28, 0x48); GOLD = RGBColor(0x8A, 0x6A, 0x2B)
INK = RGBColor(0x22, 0x22, 0x22); ZEBRA = RGBColor(0xEE, 0xF2, 0xF7)
LINE = "D5DBE6"; MUTED = RGBColor(0x5B, 0x6B, 0x86); WHITE = RGBColor(255, 255, 255)

def paras(v):
    if v is None: return []
    if isinstance(v, datetime.datetime): return [v.strftime("%d/%m/%Y")]
    s = str(v).replace("\xa0", " ").replace("\t", " ")
    return [re.sub(r"\s+", " ", l).strip() for l in s.split("\n") if l.strip()]

def clean(v, sep=" "):
    if v is None: return ""
    if isinstance(v, datetime.datetime): return v.strftime("%d/%m/%Y")
    s = str(v).replace("\xa0", " ").replace("\t", " ")
    lines = [re.sub(r"\s+", " ", l).strip() for l in s.split("\n")]
    return sep.join(l for l in lines if l)

ws = openpyxl.load_workbook(XLSX).active
rows = []
for r in range(2, ws.max_row + 1):
    pl = clean(ws[f"A{r}"].value)
    if not pl: continue
    lei = clean(ws[f"H{r}"].value)
    data = clean(ws[f"G{r}"].value)
    rows.append(dict(pl=pl, autor=paras(ws[f"B{r}"].value), ementa=paras(ws[f"C{r}"].value),
                     com=paras(ws[f"D{r}"].value), status=paras(ws[f"E{r}"].value),
                     rel=paras(ws[f"F{r}"].value), data=data, lei=paras(lei.replace(" /", "/"))))

# ---------- presentation based on the book (theme + layout) ----------
prs = Presentation(BOOK)
lst = prs.slides._sldIdLst
for s in list(lst):
    prs.part.drop_rel(s.rId); lst.remove(s)
layout = [l for l in prs.slide_layouts if l.name == "DEFAULT"][0]
SW, SH = prs.slide_width, prs.slide_height
L = 777240; W = SW - 2 * L

def textbox(slide, x, y, w, h, runs, anchor=MSO_ANCHOR.TOP, align=PP_ALIGN.LEFT):
    tb = slide.shapes.add_textbox(Emu(int(x)), Emu(int(y)), Emu(int(w)), Emu(int(h)))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]; p.alignment = align
    for text, size, bold, italic, color, font, spc in runs:
        r = p.add_run(); r.text = text
        f = r.font; f.size = Pt(size); f.bold = bold; f.italic = italic; f.color.rgb = color
        if font: f.name = font
        if spc: r._r.get_or_add_rPr().set("spc", str(spc))
    return tb

cols = [("Projeto de Lei", "pl", 0.07), ("Autor", "autor", 0.10), ("Ementa", "ementa", 0.165),
        ("Comissões Distribuídas", "com", 0.19), ("Status", "status", 0.16),
        ("Relação / Setor", "rel", 0.18), ("Data", "data", 0.06), ("Lei", "lei", 0.085)]
widths = [int(W * c[2]) for c in cols]; widths[-1] = W - sum(widths[:-1])
CENTER = {"pl", "data", "lei"}
MARG_LR, MARG_TB = 45720, 22860

fonts = {False: ImageFont.truetype("/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf", 100),
         True: ImageFont.truetype("/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf", 100)}
def nlines_one(text, width_emu, size, bold=False):
    avail_pt = (width_emu - 2 * MARG_LR) / 12700 * 0.96
    sc = size / 100.0; sp = fonts[bold].getlength(" ") * sc
    n = 1; cur = 0.0
    for w in text.split(" "):
        wl = fonts[bold].getlength(w) * sc
        while wl > avail_pt:  # very long token breaks
            if cur: n += 1
            wl -= avail_pt; cur = 0; n += 1
        if cur == 0: cur = wl
        elif cur + sp + wl <= avail_pt: cur += sp + wl
        else: n += 1; cur = wl
    return n
def nlines(ps, w, size, bold=False):
    if isinstance(ps, str): ps = [ps] if ps else []
    return max(1, sum(nlines_one(p, w, size, bold) for p in ps))

LH = 1.2 * FS * 12700
def row_h(lines): return int(lines * LH + 2 * MARG_TB + 10000)

TOP = 1330000; BOTTOM = 6900000  # table must end above this
hdr_h = row_h(1) + 30000
heights = []
for r in rows:
    heights.append(row_h(max(nlines(r[k], widths[j], FS, k in ("pl", "lei")) for j, (_, k, _) in enumerate(cols))))

# paginate (greedy for page count, then balanced)
def paginate(cap):
    pages, cur, used = [], [], hdr_h
    for i, h in enumerate(heights):
        if cur and used + h > cap:
            pages.append(cur); cur, used = [], hdr_h
        cur.append(i); used += h
    pages.append(cur); return pages
CAP = BOTTOM - TOP
n = len(paginate(CAP))
f = 1.0
while True:
    target = min(CAP, sum(heights) / n + hdr_h)
    pages = paginate(target * f)
    if len(pages) <= n: break
    f += 0.02

def set_border(cell, side, color=None, w=6350):
    tcPr = cell._tc.get_or_add_tcPr()
    tag = qn(f"a:ln{side}")
    for e in tcPr.findall(tag): tcPr.remove(e)
    ln = etree.SubElement(tcPr, tag, w=str(w if color else 0), cap="flat", cmpd="sng", algn="ctr")
    if color:
        sf = etree.SubElement(ln, qn("a:solidFill")); etree.SubElement(sf, qn("a:srgbClr"), val=color)
    else:
        etree.SubElement(ln, qn("a:noFill"))
    for f in tcPr.findall(qn("a:solidFill")) + tcPr.findall(qn("a:noFill")):
        tcPr.remove(f); tcPr.append(f)
    # borders must precede fill in schema order
    order = [qn("a:lnL"), qn("a:lnR"), qn("a:lnT"), qn("a:lnB")]
    lns = [e for t in order for e in tcPr.findall(t)]
    for e in lns: tcPr.remove(e)
    for k, e in enumerate(lns): tcPr.insert(k, e)

def fill_cell(cell, paras_runs, bg, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.MIDDLE):
    cell.margin_left = cell.margin_right = Emu(MARG_LR)
    cell.margin_top = cell.margin_bottom = Emu(MARG_TB)
    cell.vertical_anchor = anchor
    tf = cell.text_frame; tf.word_wrap = True
    for k, runs in enumerate(paras_runs):
        p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
        p.alignment = align
        for text, size, bold, color in runs:
            r = p.add_run(); r.text = text
            r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color
    if bg is None: cell.fill.background()
    else: cell.fill.solid(); cell.fill.fore_color.rgb = bg
    for side in "LRT": set_border(cell, side)
    set_border(cell, "B", LINE)

n_pl = len(rows); n_lei = sum(1 for r in rows if r["lei"])
HS = FS + 0.5
for pg, idxs in enumerate(pages):
    slide = prs.slides.add_slide(layout)
    label = "PROJETOS DE LEI EM TRAMITAÇÃO" + ("" if pg == 0 else "  ·  CONTINUAÇÃO")
    textbox(slide, L, 700000, W * 0.7, 200000, [(label, 10, True, False, GOLD, None, 200)], MSO_ANCHOR.MIDDLE)
    textbox(slide, L + W * 0.7, 700000, W * 0.3, 200000,
            [(f"{pg+1} / {len(pages)}", 9, True, False, GOLD, None, 100)], MSO_ANCHOR.MIDDLE, PP_ALIGN.RIGHT)
    textbox(slide, L, 930000, W * 0.6, 300000, [("Quadro Status Simplificado", 14, True, False, NAVY, "Cambria", 0)])
    textbox(slide, L + W * 0.6, 930000, W * 0.4, 300000,
            [(f"{n_pl}", 14, True, False, GOLD, "Cambria", 0), ("  projetos de lei    ", 9, False, False, MUTED, None, 0),
             (f"{n_lei}", 14, True, False, GOLD, "Cambria", 0), ("  convertidos em lei", 9, False, False, MUTED, None, 0)],
            MSO_ANCHOR.TOP, PP_ALIGN.RIGHT)
    hs = [hdr_h] + [heights[i] for i in idxs]
    gf = slide.shapes.add_table(len(idxs) + 1, len(cols), Emu(L), Emu(TOP), Emu(W), Emu(sum(hs)))
    tbl = gf.table
    tbl._tbl.tblPr.set("firstRow", "0"); tbl._tbl.tblPr.set("bandRow", "0")
    for j, w in enumerate(widths): tbl.columns[j].width = Emu(w)
    for k, h in enumerate(hs): tbl.rows[k].height = Emu(h)
    for j, (name, key, _) in enumerate(cols):
        fill_cell(tbl.cell(0, j), [[(name, HS, True, WHITE)]], NAVY,
                  align=PP_ALIGN.CENTER if key in CENTER else PP_ALIGN.LEFT)
    for k, i in enumerate(idxs, start=1):
        r = rows[i]; bg = ZEBRA if k % 2 == 0 else None
        for j, (_, key, _) in enumerate(cols):
            v = r[key]; ps = v if isinstance(v, list) else ([v] if v else [])
            if key == "pl":   runs = [[(p, FS, True, NAVY)] for p in ps]
            elif key == "lei": runs = [[(p, FS, True, GOLD)] for p in ps]
            else:             runs = [[(p, FS, False, INK)] for p in ps]
            if not runs: runs = [[("—", FS, False, MUTED)]]
            fill_cell(tbl.cell(k, j), runs, bg,
                      align=PP_ALIGN.CENTER if key in CENTER else PP_ALIGN.LEFT,
                      anchor=MSO_ANCHOR.MIDDLE if key in CENTER else MSO_ANCHOR.TOP)
    textbox(slide, L, 6990000, W, 160000,
            [("Fonte: Quadro Status Simplificado – aba “Pl´s Tramitação”. Transcrição integral da planilha.",
              8, False, True, MUTED, None, 0)], MSO_ANCHOR.MIDDLE)
    print("slide", pg + 1, "rows", len(idxs), "table bottom cm", round((TOP + sum(hs)) / 360000, 2))
prs.save(OUT)

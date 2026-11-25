# 25/11/2026 (PCP): trava a capacidade da Carga vs Capacidade em 90% da nominal (pedido do Edvaldo).
# P7/P4 = kg/h nominal da P.P.C.P. × 90% × horas; pintura = kg/h × horas (100%, como antes). Produtividade real não é mais usada.
# Uso: python -X utf8 aplicar_cap90.py "C:\...\conciliacao\ppcp_web.py"   (backup .antes_cap90_20261125)
import shutil, sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
if "FATOR_CAPACIDADE" in s:
    sys.exit("já aplicado")
shutil.copy2(p, p + ".antes_cap90_20261125")
def troca(a, b):
    global s
    if s.count(a) != 1:
        sys.exit("ancora nao encontrada (ou repetida): " + a[:90])
    s = s.replace(a, b)
troca('BASE_CAPACIDADE = "real"', '# 25/11/2026 (PCP): TRAVADO pelo Edvaldo: capacidade = 90% da nominal (kg/h da P.P.C.P. × 0,90). Não usar produtividade real.\nBASE_CAPACIDADE = "nominal"\nFATOR_CAPACIDADE = 0.90')
troca('nominal = {"P7": kgh["P7"] * aprov, "P4": kgh["P4"] * aprov, "Pintura": pint_kgh}',
      'nominal = {"P7": kgh["P7"] * FATOR_CAPACIDADE, "P4": kgh["P4"] * FATOR_CAPACIDADE, "Pintura": pint_kgh}')
troca('    usa_real = BASE_CAPACIDADE == "real" and real_kgh',
      '    assert BASE_CAPACIDADE == "nominal" and FATOR_CAPACIDADE == 0.90, "capacidade travada em 90% da nominal (Edvaldo, 25/11/2026)"\n    usa_real = BASE_CAPACIDADE == "real" and real_kgh')
troca('        linhas[k]["base"] = "real" if (usa_real and k != "Pintura") else "nominal"',
      '        linhas[k]["base"] = "real" if (usa_real and k != "Pintura") else "nominal"\n        linhas[k]["kgh_bruto"] = round(kgh[k], 1) if k in ("P7", "P4") else round(pint_kgh, 1)\n        linhas[k]["fator"] = FATOR_CAPACIDADE if k in ("P7", "P4") else 1.0')
troca('"Capacidade nominal da P.P.C.P. (kg/h × aproveitamento; pintura 100%)."',
      '"Capacidade P7/P4 = 90%% da nominal da P.P.C.P. (P7 %.0f × 0,90 = %.0f kg/h; P4 %.0f × 0,90 = %.0f kg/h); pintura %.0f kg/h (100%%)." % (kgh["P7"], nominal["P7"], kgh["P4"], nominal["P4"], pint_kgh)')
compile(s, p, "exec")
open(p, "w", encoding="utf-8").write(s)
print("OK: capacidade travada em 90% da nominal em", p)

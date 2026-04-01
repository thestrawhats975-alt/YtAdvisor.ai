import py_compile, sys
files = ["api_models.py", "analyst_agent.py", "strategist_agent.py", "optimizer_agent.py", "llm_service.py", "main.py"]
ok = True
for f in files:
    try:
        py_compile.compile(f, doraise=True)
        print(f"OK: {f}")
    except py_compile.PyCompileError as e:
        print(f"ERROR: {f}: {e}")
        ok = False
if ok:
    print("ALL FILES COMPILE OK")
else:
    print("SOME FILES HAVE ERRORS")

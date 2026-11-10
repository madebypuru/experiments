# Builds PROMPT.md, the single copy-paste prompt for any chatbot, from SKILL.md and FORMAT.md,
# so the two never drift apart. Run: python3 build-prompt.py
import re, pathlib
here = pathlib.Path(__file__).parent
skill = (here / 'SKILL.md').read_text()
skill = re.sub(r'^---.*?---\n', '', skill, flags=re.S).strip()
skill = skill.replace('The file format is in `FORMAT.md`; read it first.', 'The file format is described in full below.')
skill = skill.replace('(see FORMAT.md section 3)', '(see "Roles" below)').replace('(FORMAT.md section 3)', '')
fmt = (here / 'FORMAT.md').read_text().strip()
head = """You are composing a scene for Paint, a watercolour painting tool. Read everything below, then wait for the scene I describe. For each scene I describe, reply with one complete SVG file in this format and nothing else: no explanation, no code fences.

"""
out = head + skill + '\n\n---\n\n' + fmt + '\n'
(here / 'PROMPT.md').write_text(out)
(here / 'PROMPT.txt').write_text(out)  # same text; .txt displays in any browser
print('PROMPT.md and PROMPT.txt', len(out), 'chars')

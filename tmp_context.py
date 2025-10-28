from pathlib import Path
path = Path('components/admin/PagesManager.jsx')
text = path.read_bytes()
for offset in [1192, 15336, 44220]:
    start = max(0, offset-20)
    end = min(len(text), offset+40)
    print(offset, text[start:end])

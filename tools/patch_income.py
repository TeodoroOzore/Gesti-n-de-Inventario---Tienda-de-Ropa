p = r'app\static\js\income.js'
with open(p, 'r', encoding='utf-8') as f:
    s = f.read()
old1 = "const tbody = document.querySelector('#incomeTable tbody');"
new1 = "const tbody = document.getElementById('incomeTable');"
old2 = "const productId = document.getElementById('productSelect').value;"
new2 = "const productId = parseInt(document.getElementById('productSelect').value);"
if old1 in s or old2 in s:
    s = s.replace(old1, new1)
    s = s.replace(old2, new2)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)
    print('patched')
else:
    print('nothing to patch')

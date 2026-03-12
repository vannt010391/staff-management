f = '/var/www/workhub/backend/config/settings.py'
txt = open(f, 'r').read()

old = "DEBUG = os.getenv('DEBUG', 'True') == 'False'"
new = "DEBUG = os.getenv('DEBUG', 'False') == 'True'"

if old in txt:
    open(f, 'w').write(txt.replace(old, new, 1))
    print('FIXED: DEBUG logic corrected')
else:
    print('NOT FOUND - checking existing DEBUG lines:')
    for i, line in enumerate(txt.splitlines(), 1):
        if 'DEBUG' in line and 'getenv' in line:
            print(f'  Line {i}: {repr(line)}')

import os
import re

def replace_currency(directory):
    # Regex : un chiffre suivi de zéro ou plusieurs espaces, puis 'F'
    # On capture le chiffre pour le garder
    pattern = re.compile(r'(\d)\s*F\b')
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.ts', '.tsx')):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Remplacement par 'chiffre XOF'
                new_content = pattern.sub(r'\1 XOF', content)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {file_path}")

if __name__ == "__main__":
    src_dir = os.path.abspath("/home/bellox/Projets/GestionStock/expo-mobile/src")
    replace_currency(src_dir)

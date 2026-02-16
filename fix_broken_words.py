import os
import re

def fix_broken_words(directory):
    # Matches 'XOF' followed immediately by a letter (likely a word that was broken)
    # e.g., XOFlatList -> FlatList
    # Note: We need to handle the space that was before XOF.
    # If it was " FlatList", it became " XOFlatList".
    # So we replace "XOF" with "F" when followed by a letter.
    pattern = re.compile(r'XOF([a-zA-Z])')
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.ts', '.tsx', '.json')):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = pattern.sub(r'F\1', content)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed: {file_path}")

if __name__ == "__main__":
    src_dir = os.path.abspath("/home/bellox/Projets/GestionStock/expo-mobile/src")
    fix_broken_words(src_dir)

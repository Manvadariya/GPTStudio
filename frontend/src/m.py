import os

def is_text_file(filepath):
    # Returns True if the file is likely to be a text file
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            f.read(2048)
        return True
    except Exception:
        return False

def main(root_folder='.', out_file='structure.txt'):
    with open(out_file, 'w', encoding='utf-8') as outf:
        outf.write("structure\n\n")
        for dirpath, _, filenames in os.walk(root_folder):
            for fname in filenames:
                relpath = os.path.relpath(os.path.join(dirpath, fname), root_folder)
                outf.write(f"-----\n{relpath}\n")
                path = os.path.join(dirpath, fname)
                if is_text_file(path):
                    try:
                        with open(path, 'r', encoding='utf-8') as fin:
                            content = fin.read()
                        outf.write(content + "\n")
                    except Exception as e:
                        outf.write(f"[Could not read file: {e}]\n")
                else:
                    outf.write("[Binary file or not displayable]\n")

if __name__ == "__main__":
    main('.', 'structure.txt')

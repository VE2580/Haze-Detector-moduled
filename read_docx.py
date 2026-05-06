#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import os

docx_path = r'd:\Code\Haze2\雾霾探测系统设计-韦娟.docx'
output_file = r'd:\Code\Haze2\docx_content.txt'

with open(output_file, 'w', encoding='utf-8') as f:
    if not os.path.exists(docx_path):
        f.write(f"File not found: {docx_path}\n")
        f.write("\nFiles in d:\\Code\\Haze2:\n")
        for file in os.listdir(r'd:\Code\Haze2'):
            f.write(f"  {file}\n")
    else:
        try:
            with ZipFile(docx_path) as z:
                doc = ET.fromstring(z.read('word/document.xml'))
                ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                
                f.write("=" * 80 + "\n")
                f.write("Word Document Content\n")
                f.write("=" * 80 + "\n\n")
                
                # 获取所有段落
                for para in doc.findall('.//w:p', ns):
                    para_text = []
                    for text_elem in para.findall('.//w:t', ns):
                        if text_elem.text:
                            para_text.append(text_elem.text)
                    if para_text:
                        f.write(''.join(para_text) + '\n')
                    else:
                        f.write('\n')
        except Exception as e:
            f.write(f"Error reading document: {e}\n")
            import traceback
            f.write(traceback.format_exc())

print("Done. Content written to", output_file)

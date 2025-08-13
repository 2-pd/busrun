# coding: utf-8

import os
import glob
import json
import base64

def embed_icons (mes, dir_path):
    mes("アイコン画像をファイルに埋め込み", is_heading=True)
    
    extension_list = ["webp", "png", "gif", "jpeg", "jpg"]
    icons_dir_path = dir_path + "/vehicle_icons"
    files = []
    
    if not os.path.isdir(icons_dir_path):
        mes("フォルダ vehicle_icons が存在しません", True)
        return
    
    mes("ファイルの一覧を取得しています...")
    
    for extension in extension_list:
        files += glob.glob(icons_dir_path + "/*." + extension)
    
    files.sort()
    
    mes(str(len(files)) + "件の画像ファイルが検出されました")
    
    vehicle_icons = {}
    
    for file_name in files:
        file_base_name = os.path.basename(file_name)
        mes("・" + file_base_name + " を埋め込んでいます...")
        
        if file_base_name.endswith(".webp"):
            mime_type = "image/webp"
        elif file_base_name.endswith(".png"):
            mime_type = "image/png"
        elif file_base_name.endswith(".gif"):
            mime_type = "image/gif"
        elif file_base_name.endswith(".jpeg") or file_base_name.endswith(".jpg"):
            mime_type = "image/jpeg"
        
        try:
            img_f = open(file_name, "rb")
            img_data = img_f.read()
        except:
            mes(file_base_name + " の読み込みに失敗しました", True)
            return
        
        icon_id = file_base_name[0:file_base_name.rfind(".")]
        
        vehicle_icons[icon_id] = "data:" + mime_type + ";base64," + base64.b64encode(img_data).decode()
    
    mes("vehicle_icons.json を作成しています...")
    
    try:
        with open(dir_path + "/vehicle_icons.json", "w", encoding="utf-8") as json_f:
            json.dump(vehicle_icons, json_f, ensure_ascii=False, separators=(',', ':'))
    except:
        mes("vehicle_icons.json の保存に失敗しました", True)
    else:
        mes("処理が完了しました")

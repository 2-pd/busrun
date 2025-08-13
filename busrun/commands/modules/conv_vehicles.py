#!/usr/bin/env python3
# coding: utf-8

import csv
import json

def conv_vehicles (mes, main_dir):
    mes("車両一覧表の変換", is_heading=True)
    
    mes("vehicles.csvを読み込んでいます...")
    
    with open(main_dir + "/vehicles.csv", "r", encoding="utf-8-sig") as csv_f:
        csv_reader = csv.reader(csv_f)
        vehicles_data = [data_row for data_row in csv_reader]
    
    mes("データを変換しています...")
    
    json_data = { "vehicles" : {}, "offices" : {}, "office_names" : [] }
    
    for vehicle_data in vehicles_data:
        vehicle_name = vehicle_data[0].strip()
        
        if len(vehicle_name) == 0:
            continue
        
        if vehicle_name.startswith("# "):
            office_name = vehicle_name[2:].strip()
            
            mes("・" + office_name + " のデータ処理を開始します...")
            
            json_data["offices"][office_name] = { "vehicle_categories" : [] }
            json_data["office_names"].append(office_name)
        elif vehicle_name.startswith("## "):
            category_name = vehicle_name[3:].strip()
            
            mes("  - " + category_name + " のデータを処理しています...")
            
            json_data["offices"][office_name]["vehicle_categories"].append({ "category_name" : category_name, "vehicle_names" : [] })
        else:
            if vehicle_name in json_data["vehicles"]:
                mes("同一の車両識別名が複数の車両に設定されています: " + vehicle_name, True)
                continue
            
            mes("    - " + vehicle_name + " のデータを処理しています...")
            
            json_data["vehicles"][vehicle_name] = { "icon_id" : vehicle_data[1].strip(), "registration_number" : vehicle_data[2].strip(), "model_name" : vehicle_data[3].strip(), "model_year" : int(vehicle_data[4]), "office_name" : office_name }
            json_data["offices"][office_name]["vehicle_categories"][-1]["vehicle_names"].append(vehicle_name)
            
            if len(vehicle_data) >= 6:
                notes = vehicle_data[5].strip()
                
                if len(notes) >= 1:
                    json_data["vehicles"][vehicle_name]["notes"] = notes
    
    mes("vehicles.jsonを作成しています...")
    try:
        with open(main_dir + "/vehicles.json", "w", encoding="utf-8-sig") as json_f:
            json.dump(json_data, json_f, ensure_ascii=False, separators=(',', ':'))
    except PermissionError:
        mes("vehicles.jsonの書き込み権限がありません", True)
    except:
        mes("vehicles.jsonの作成に失敗しました", True)
    else:
        mes("処理が完了しました")

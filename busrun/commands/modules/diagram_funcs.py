# coding: utf-8

import time
import json

class diagram:
    def __init__ (self, main_dir, mes=None):
        if mes is None:
            self.mes = self.print_error
        else:
            self.mes = mes
        
        self.main_dir = main_dir
        self.diagram_revisions = None
        self.diagram_info = {}
    
    def print_error (self, log_text, is_error=None):
        print("【エラー】" + str(log_text))
    
    def get_date_string (self, ts=None):
        if ts is None:
            ts = int(time.time())
        
        return time.strftime("%Y-%m-%d", time.localtime(ts - 14400))
    
    def get_diagram_revision (self, date_string=None):
        if self.diagram_revisions is None:
            try:
                with open(self.main_dir + "/diagram_revisions.txt", "r", encoding="utf-8-sig") as diagram_revisions_f:
                    self.diagram_revisions = [line.rstrip() for line in diagram_revisions_f.readlines()]
            except:
                self.mes("diagram_revisions.txtの読み込みに失敗しました", True)
                
                return None
        
        if date_string is None:
            date_string = self.get_date_string()
        
        for diagram_revision in self.diagram_revisions:
            if diagram_revision < date_string:
                return diagram_revision
        
        return None
    
    def load_diagram_info (self, diagram_revision=None):
        if diagram_revision is None:
            diagram_revision = self.get_diagram_revision()
            
            if diagram_revision is None:
                return False
        
        try:
            with open(self.main_dir + "/" + diagram_revision + "/diagram_info.json", "r", encoding="utf-8-sig") as json_f:
                self.diagram_info[diagram_revision] = json.load(json_f)
        except:
            self.mes("diagram_info.jsonの読み込みに失敗しました", True)
            return False
        else:
            return True
    
    def get_service_id (self, date_string=None):
        if date_string is None:
            date_string = self.get_date_string()
        
        diagram_revision = self.get_diagram_revision(date_string)
        
        if diagram_revision is None:
            return None, None
        
        if diagram_revision not in self.diagram_info:
            if not self.load_diagram_info(self.get_diagram_revision(date_string)):
                return diagram_revision, None
        
        if date_string in self.diagram_info[diagram_revision]["calendar_dates"]:
            return diagram_revision, self.diagram_info[diagram_revision]["calendar_dates"][date_string]
        
        day_index = int(time.strftime("%w", time.strptime(date_string, "%Y-%m-%d")))
        
        for service_info in self.diagram_info[diagram_revision]["calendar"]:
            if service_info["implementation_days"][day_index] and service_info["start_date"] < date_string and service_info["end_date"] > date_string:
                return diagram_revision, service_info["service_id"]
        
        return diagram_revision, None

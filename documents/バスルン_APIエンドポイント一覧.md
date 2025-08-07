--------------------------------------------------------------------------------

  路線バス運用情報アプリ「バスルン」設計案    ページ(4)

--------------------------------------------------------------------------------

# APIエンドポイント

## instance_info.php
バスルンのインスタンス情報を取得する

### 引数
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC、省略可能)

### 応答
**タイムスタンプが省略されるか、main.iniの変更日時がタイムスタンプより新しかった場合** :  
{  
    "instance_name" : インスタンスの表示名,  
    "introduction_text" : インスタンスの紹介文(未設定なら省略),  
    "manual_url" : ユーザーマニュアルのURL(未設定なら省略)
}  
  
※上記の他、**Last-Modified**レスポンスヘッダーにインスタンス情報の最終更新日時が出力される  
  
**main.iniの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」


## agencies.php
agencies.jsonを取得する

### 引数
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**agencies.jsonの変更日時がタイムスタンプより新しかった場合** :  
agencies.jsonの内容を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーにagencies.jsonの最終更新日時が出力される  
  
**agencies.jsonの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## agency_info.php
指定した事業者のagency_info.jsonを取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**agency_info.jsonの変更日時がタイムスタンプより新しかった場合** :  
agency_info.jsonの内容を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーにagency_info.jsonの最終更新日時が出力される  
  
**agency_info.jsonの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## vehicle_icons.php
指定した事業者のvehicle_icons.jsonを取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**vehicle_icons.jsonの変更日時がタイムスタンプより新しかった場合** :  
vehicle_icons.jsonの内容を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーにvehicle_icons.jsonの最終更新日時が出力される  
  
**vehicle_icons.jsonの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## vehicles.php
指定した事業者のvehicles.jsonを取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**vehicles.jsonの変更日時がタイムスタンプより新しかった場合** :  
vehicles.jsonの内容を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーにvehicles.jsonの最終更新日時が出力される  
  
**vehicles.jsonの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## diagram_revisions.php
指定した事業者のダイヤ改正識別名一覧を取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**diagram_revisions.txtの変更日時がタイムスタンプより新しかった場合** :  
diagram_revisions.txtの各行の文字列を要素とする配列をJSON化した文字列を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーにdiagram_revisions.txtの最終更新日時が出力される  
  
**diagram_revisions.txtの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## route_info.php
指定した事業者の指定したダイヤ改正時点での路線・停留所情報を取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["diagram_revision"]** : ダイヤ改正識別名  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**route_info.jsonの変更日時がタイムスタンプより新しかった場合** :  
route_info.jsonの内容を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーにroute_info.jsonの最終更新日時が出力される  
  
**route_info.jsonの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## diagram_info.php
指定した事業者の指定したダイヤ改正識別名のダイヤ情報を取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["diagram_revision"]** : ダイヤ改正識別名  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**diagram_info.jsonの変更日時がタイムスタンプより新しかった場合** :  
diagram_info.jsonの内容を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーにdiagram_info.jsonの最終更新日時が出力される  
  
**diagram_info.jsonの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## operation_table.php
指定した事業者・ダイヤの運用表を取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["diagram_revision"]** : ダイヤ改正識別名  
**$_POST["service_id"]** : ダイヤ識別名  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**運用表JSONファイルの変更日時がタイムスタンプより新しかった場合** :  
運用表JSONファイルの内容を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーに運用表JSONファイルの最終更新日時が出力される  
  
**運用表JSONファイルの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**運用表JSONファイルが存在しなかった場合** :  
文字列「DATA_NOT_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## timetable.php
指定した事業者・ダイヤの時刻表を取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["diagram_revision"]** : ダイヤ改正識別名  
**$_POST["service_id"]** : ダイヤ識別名  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**時刻表JSONファイルの変更日時がタイムスタンプより新しかった場合** :  
時刻表JSONファイルの内容を返す  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーに時刻表JSONファイルの最終更新日時が出力される  
  
**時刻表JSONファイルの変更日時がタイムスタンプ以前だった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文


## operation_data.php
指定した事業者の指定した日付の運用情報全体を取得する

### 引数
**$_POST["agency_id"]** : 事業者識別名  
**$_POST["date"]** : YYYY-MM-DD形式の日付  
**$_POST["last_modified_timestamp"]** : タイムスタンプ(UTC)

### 応答
**タイムスタンプの時刻より後に運用情報が更新された車両行路があった場合** :  
{  
    "タイムスタンプの時刻より後に情報が更新された車両行路識別名" : {  
        "vehicle_name" : 車両識別名,  
        "relieved_vehicles" : 差し替え前の車両の車両識別名を充当順に配列で(差し替えがなければ省略)  
    }...  
}  
▲クライアント端末からAccept-Encodingヘッダーが送信されていた場合、このデータは自動的にgzip圧縮される  
  
※上記の他、**Last-Modified**レスポンスヘッダーに当該日の運用情報の最終更新日時が出力される  
  
**タイムスタンプの時刻より後に運用情報が更新された車両行路がなかった場合** :  
文字列「NO_UPDATES_AVAILABLE」  
  
**エラーの場合** :  
文字列「ERROR: 」とそれに続くエラー内容文

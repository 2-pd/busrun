<?php
/* _/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
 *
 *   バスルン
 *
 * _/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
 * 
 * LICENSE
 * 
 *   このソフトウェアは、無権利創作宣言に基づき著作権放棄されています。
 *   営利・非営利を問わず、自由にご利用いただくことが可能です。
 * 
 *     https://www.2pd.jp/license/
 * 
 *   異なるライセンスの下で配布する際は名称(下記、BUSRUN_APP_NAMEの値)を変更し、区別可能としてください。
 *
 */

define("BUSRUN_APP_NAME", "バスルン");
define("BUSRUN_APP_INFO_URL", "https://create.2pd.jp/apps/busrun/");
define("BUSRUN_REPOSITORY_URL", "https://fossil.2pd.jp/busrun/");
define("BUSRUN_LICENSE_TEXT", "このアプリケーションは無権利創作宣言に準拠して著作権放棄されています。");

include "./version.php";

if (empty($_SERVER["PATH_INFO"]) || $_SERVER["PATH_INFO"] === "/") {
    $path_info_str = "/";
    $page_title = BUSRUN_APP_NAME;
    $page_description = "路線バスファン向けの車両運用情報アプリ　当日中の各車両運行予定を素早く確認可能です。";
    $agency_root = "#";
} elseif (str_starts_with($_SERVER["PATH_INFO"], "/agency_")) {
    $path_info = explode("/", $_SERVER["PATH_INFO"]);
    
    $agency_id = basename(substr($path_info[1], 7));
    $agency_info_path = "data/".$agency_id."/agency_info.json";
    $path_info_str = "/agency_".$agency_id."/";
    $agency_root = $path_info_str;
    
    if (file_exists($agency_info_path)) {
        $agency_info = json_decode(file_get_contents($agency_info_path), TRUE);
        
        if (empty($path_info[2])) {
            $page_title = $agency_info["agency_name"]."の車両運用情報 | ".BUSRUN_APP_NAME;
            $page_description = $agency_info["agency_name"]."の本日の各車両運行状況・運行予定です。";
        } else {
            switch ($path_info[2]) {
                case "timetable":
                    $path_info_str .= "timetable/";
                    
                    if (empty($path_info[3])) {
                        $page_title = $agency_info["agency_name"]."の車両運用情報付き時刻表 | ".BUSRUN_APP_NAME;
                        $page_description = "本日の".$agency_info["agency_name"]."の使用車両予測付き停留所別時刻表です。";
                    } else {
                        $diagram_revisions_path = "data/".$agency_id."/diagram_revisions.txt";
                        
                        if (!file_exists($diagram_revisions_path)) {
                            header("Location: /", TRUE, 302);
                            exit;
                        }
                        
                        $diagram_revisions = file($diagram_revisions_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                        
                        $today = date("Y-m-d");
                        foreach ($diagram_revisions as $diagram_revision) {
                            if ($diagram_revision < $today) {
                                $stop_info_path = "data/".$agency_id."/".$diagram_revision."/stop_info.json";
                                
                                goto diagram_revision_found;
                            }
                        }
                        
                        header("Location: /", TRUE, 302);
                        exit;
                        
                        diagram_revision_found:
                        
                        if (!file_exists($stop_info_path)) {
                            header("Location: /", TRUE, 302);
                            exit;
                        }
                        
                        $stop_info = json_decode(file_get_contents($stop_info_path), TRUE);
                        
                        if (!array_key_exists($path_info[3], $stop_info["stops"])) {
                            header("Location: ".$path_info_str, TRUE, 301);
                            exit;
                        }
                        
                        $path_info_str .= urlencode($path_info[3])."/";
                        
                        $page_title = $agency_info["agency_name"]." ".$stop_info["stops"][$path_info[3]]["stop_name"]."の車両運用情報付き時刻表 | ".BUSRUN_APP_NAME;
                        $page_description = "本日の".$agency_info["agency_name"]." ".$stop_info["stops"][$path_info[3]]["stop_name"]."停留所の発着車両予想です。";
                    }
                    
                    break;
                
                case "operation_data":
                    $path_info_str .= "operation_data/";
                    $page_title = $agency_info["agency_name"]."の運用履歴データ | ".BUSRUN_APP_NAME;
                    $page_description = $agency_info["agency_name"]."における本日及び過去の車両運用履歴です。";
                    
                    break;
                
                case "vehicles":
                    $path_info_str .= "vehicles/";
                    
                    if (empty($path_info[3])) {
                        $page_title = $agency_info["agency_name"]."の車両一覧表 | ".BUSRUN_APP_NAME;
                        $page_description = $agency_info["agency_name"]."で現在運用されている路線バス車両の一覧表です。";
                    } else {
                        $vehicles_path = "data/".$agency_id."/vehicles.json";
                        
                        if (!file_exists($vehicles_path)) {
                            header("Location: /", TRUE, 302);
                            exit;
                        }
                        
                        $vehicles = json_decode(file_get_contents($vehicles_path), TRUE);
                        
                        if (!array_key_exists($path_info[3], $vehicles["vehicles"])) {
                            header("Location: ".$path_info_str, TRUE, 301);
                            exit;
                        }
                        
                        $path_info_str .= urlencode($path_info[3])."/";
                        
                        $page_title = $agency_info["agency_name"]." ".$path_info[3]."号車の車両情報・運用 | ".BUSRUN_APP_NAME;
                        $page_description = $agency_info["agency_name"]."で運用されている".$path_info[3]."号車(".$vehicles["vehicles"][$path_info[3]]["registration_number"].")の車両情報・運用状況です。";
                    }
                    
                    break;
                
                default:
                    header("Location: ".$path_info_str, TRUE, 301);
                    exit;
            }
        }
    } else {
        header("Location: /", TRUE, 301);
        exit;
    }
} else {
    header("Location: /", TRUE, 301);
    exit;
}
?><!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,interactive-widget=resizes-content">
<?php
print "    <title>".htmlspecialchars($page_title)."</title>\n";

$root_url = "http".(empty($_SERVER["HTTPS"]) ? "" : "s")."://".$_SERVER["HTTP_HOST"];
$page_description = addslashes($page_description);

print "    <link rel=\"stylesheet\" href=\"/assets.css?v=".BUSRUN_VERSION."\">\n";
print "    <script>\n";
print "        const BUSRUN_APP_NAME = \"".BUSRUN_APP_NAME."\";\n";
print "        const BUSRUN_VERSION = \"".BUSRUN_VERSION."\";\n";
print "        const BUSRUN_APP_INFO_URL = \"".BUSRUN_APP_INFO_URL."\";\n";
print "        const BUSRUN_REPOSITORY_URL = \"".BUSRUN_REPOSITORY_URL."\";\n";
print "        const BUSRUN_LICENSE_TEXT = \"".BUSRUN_LICENSE_TEXT."\";\n";
print "    </script>\n";
print "    <script src=\"/main.js?v=".BUSRUN_VERSION."\" defer=\"defer\"></script>\n";
?>
    <link rel="manifest" href="/manifest.json">
<?php
print "    <link rel=\"canonical\" href=\"".$root_url.$path_info_str."\">\n";
print "    <meta name=\"description\" content=\"".$page_description."\">\n";
?>
</head>
<body>
</body>
</html>

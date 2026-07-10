# Sauvegarde quotidienne de la base PostgreSQL de la plateforme IEPP.
# À placer dans le Planificateur de tâches Windows pour une exécution automatique.

$Date = Get-Date -Format "yyyy-MM-dd_HHmm"
$BackupDir = "C:\Sauvegardes\iepp-platform"
$BackupFile = "$BackupDir\iepp_db_$Date.sql"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Adapter le chemin de pg_dump.exe selon votre installation PostgreSQL
$env:PGPASSWORD = "votre_mot_de_passe"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -d iepp_db -F c -f $BackupFile

# Conserve seulement les 30 dernières sauvegardes
Get-ChildItem $BackupDir -Filter "*.sql" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 30 |
    Remove-Item

Write-Host "Sauvegarde terminée : $BackupFile"
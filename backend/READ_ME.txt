Instrucțiuni pentru configurarea proiectului
1. Clonează proiectul de pe GitHub

2 Setup PostgreSQL
Name: WEB_DB (sau ce vrei tu)
Host: localhost
Port: 5432
Username: postgres
Password: _________ (eu am pus matei)
Database: postgres

3. Configurația corectă în backend/config.php
<?php
$host = 'localhost';
$dbname = 'postgres';
$username = 'postgres';
$password = ________

4. Creare tabele în baza de date
pgAdmin - server - database -
click dreapta pe postgres - querry tool
copaiaza si ruleaza continutul din creare_tabele_web.sql

5. Rulare script populare carti
Accesează în browser: http://localhost:9000/backend/populate_books.php
Ar trebui să vezi: "Books populated successfully!" sau mesaj similar
E posibil sa dureze cateva secunde, sunt mutle carti, dar asta se intampla doar o data

6. Verificare exsitenta carti
pgAdmin->Database->Schemas->Tables->View/Edit Data

7. Verificare functionalitate
Pagina principala se gaseste la adresa
http://localhost:9000/frontend/mainPage/index.html
Ar trebui sa se pota naviga, sa se creeze un cont si sa te logezi/deconectezi


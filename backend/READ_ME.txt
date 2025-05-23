Instrucțiuni pentru configurarea proiectului
1. Clonează proiectul de pe GitHub
git clone <linkul-tau-de-repo>  

2. Instalează PostgreSQL și pgAdmin (dacă nu ai deja)

    Descarcă PostgreSQL
    Instalează și asigură-te că știi parola userului postgres.

3. Instalează XAMPP 

    Descarcă XAMPP
    Instalează și pornește Apache din XAMPP Control Panel.

4. Creează baza de date în pgAdmin

    Deschide pgAdmin și conectează-te la serverul local.
    Click dreapta pe „Databases” → Create → Database...
    
5. Importă structura bazei de date

    Deschide Query Tool pe baza de date creată.
    Deschide fișierul schema.sql din proiect.
    Copiază și lipește conținutul în Query Tool, apoi apasă „Run” (F5).

6. Configurează scriptul de populare

    Deschide fișierul populate_books.php din proiect.
    Completează la început datele de conectare la baza de date:

    php

    Copy Code
    $host = 'localhost';  
    $db   = 'proiect_lectura';  
    $user = 'postgres';  
    $pass = 'PAROLA_TA_DE_POSTGRES';  

    Salvează fișierul.

7. Rulează scriptul de populare

    Copiază populate_books.php în folderul htdocs din XAMPP (ex: C:\xampp\htdocs\).
    Asigură-te că Apache este pornit în XAMPP.
    Accesează în browser:
    http://localhost/populate_books.php
    Așteaptă să se termine popularea (poate dura câteva minute).

8. Verifică datele în pgAdmin

    În pgAdmin, dă click dreapta pe tabelele books, authors, book_authors → View/Edit Data → All Rows.
    Verifică dacă datele au fost inserate.
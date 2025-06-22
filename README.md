# T-WEB-2025

Repo cu proiectul la disciplina Tehnologii Web  
Studenți: Manolache-Mărtin Corina & Tablan Matei-Christian  
Grupa: A1  
Profesor: Vârlan Cosmin  

BoW (Books on Web) - System Requirements Specification
1. Introducere
   1.1 Scopul aplicației
   BoW este o aplicație web destinată utilizatorilor individuali sau grupurilor (e.g., clase școlare, cluburi de lectură) pentru a gestiona progresul lecturilor și a exprima opinii sau adnotări referitoare la cărțile citite.

1.2 Domeniul aplicației
Aplicația oferă management complet al cărților parcurse, organizare pe diverse criterii, statistici exportabile, recomandări de biblioteci și un flux de știri RSS pentru anunțuri importante.

2. Descriere generală
   2.1 Perspective sistem
   BoW este o platformă web care interacționează cu utilizatorii printr-o interfață intuitivă și accesibilă. Integrarea cu API-uri externe (Google Books API și Open Library API) oferă informații detaliate despre cărți.

2.2 Funcționalități principale
Înregistrarea progresului în lectură (pagini citite, capitole, etc.)

Exprimarea opiniilor, recenziilor și adnotărilor personale

Organizarea cărților pe criterii: categorie, autor(i), editură, an, ediție

Legături între cărți înrudite

Generarea și exportul statisticilor în formate deschise: minimal, CSV, DocBook

Recomandarea bibliotecilor publice din proximitate (simulată prin serviciu web)

Flux de știri RSS cu anunțuri legate de lecturi și noutăți

Bonus: integrare cu Google Books API și Open Library API pentru date suplimentare despre cărți

3. Cerințe detaliate
   3.1 Cerințe funcționale
   RF1: Sistemul trebuie să permită utilizatorilor să marcheze progresul lecturii pentru fiecare carte.

RF2: Utilizatorii pot adăuga opinii și adnotări pentru cărțile citite.

RF3: Cărțile pot fi organizate după autor, categorie, editură, an, ediție.

RF4: Sistemul trebuie să sugereze biblioteci publice din proximitate dacă o carte nu este disponibilă.

RF5: Aplicația generează statistici de lectură exportabile în format minimal, CSV și DocBook.

RF6: Sistemul oferă un flux RSS pentru anunțuri relevante.

RF7 (Bonus): Integrare cu Google Books API și Open Library API pentru completarea informațiilor despre cărți.

3.2 Cerințe nefuncționale
CNF1: Interfața utilizator trebuie să fie responsivă și accesibilă pe desktop și dispozitive mobile.

CNF2: Timpul de răspuns al interfeței să fie sub 2 secunde pentru acțiunile uzuale.

CNF3: Datele utilizatorilor trebuie stocate securizat.

CNF4: Sistemul trebuie să suporte simultan cel puțin 100 de utilizatori activi.

4. Interacțiunea cu utilizatorul
   Utilizatorii vor accesa platforma prin browser web.

Vor putea vedea și modifica progresul lecturilor, adăuga recenzii și vizualiza recomandări.

Navigarea va fi intuitivă, cu meniuri clare pentru categorii și filtre.

Notificările și fluxul RSS vor ține utilizatorii la curent cu noutățile.

5. Referințe
   IEEE System Requirements Specification Template: [link spre document]

Google Books API: https://developers.google.com/books

Open Library API: https://openlibrary.org/developers/api

Inspirație: Goodreads, Hardcover, The StoryGraph
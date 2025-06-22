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
Înregistrarea progresului în lectură.

Exprimarea opiniilor, recenziilor personale.

Organizarea cărților pe criterii precum categorie, autor(i), editură, an, ediție.

Generarea și exportul statisticilor în formate deschise: CSV, JSON, XML

Recomandarea bibliotecilor publice din proximitate (via Overpass API by OpenStreetMap).

Flux de știri RSS cu anunțuri legate de lecturi și noutăți

Bonus: integrare cu Google Books API pentru informații suplimentare.

3. Cerințe detaliate
   
C1: Sistemul trebuie să permită utilizatorilor să marcheze progresul lecturii pentru fiecare carte.

C2: Utilizatorii pot adăuga opinii și adnotări pentru cărțile citite.

C3: Cărțile pot fi organizate după autor, categorie, editură, an și ediție.

C4: Sistemul trebuie să sugereze biblioteci publice din proximitate dacă o carte nu este disponibilă.

C5: Aplicația trebuie să genereze statistici exportabile în format minimal, CSV și DocBook.

C6: Sistemul oferă un flux RSS pentru anunțuri relevante privind lecturile.

C7 (Bonus): Integrarea cu Google Books API și Open Library API pentru date suplimentare despre cărți.


4. Interacțiunea cu utilizatorul

Utilizatorii vor accesa platforma prin browser web.

Vor putea vedea și modifica progresul lecturilor, adăuga recenzii și vizualiza recomandări.

Navigarea va fi intuitivă, cu meniuri clare pentru categorii și filtre.

Notificările și fluxul RSS vor ține utilizatorii la curent cu noutățile.

5. Referințe

IEEE System Requirements Specification Template: https://ieeexplore.ieee.org/document/502838

Google Books API: https://developers.google.com/books

Open Library API: https://openlibrary.org/developers/api

Inspirație: Goodreads, Hardcover, The StoryGraph
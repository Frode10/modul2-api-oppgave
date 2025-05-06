const produktliste = document.getElementById("produktliste");
const searchInput = document.getElementById("search");
const kategoriFilterEl = document.getElementById("kategoriFilter");

let alleProdukter = [];
let aktivKategori = "";

const hentAlleProdukter = async () => {
    let page = 1;
    let samlet = [];
    let ferdig = false;

    while (!ferdig) {
        const res = await fetch(
            `https://matkammeret.com/wp-json/wp/v2/produkter?per_page=100&page=${page}`
        );
        if (!res.ok) break;

        const produkter = await res.json();
        if (produkter.length === 0) {
            ferdig = true;
        } else {
            samlet = samlet.concat(produkter);
            page++;
        }
    }

    return samlet;
};

const renderKategorier = (liste) => {
    const kategorierSet = new Set();
    liste.forEach((p) => {
        if (p.acf && p.acf.hovedkategori) {
            kategorierSet.add(p.acf.hovedkategori);
        }
    });
    const kategorier = Array.from(kategorierSet).sort();

    kategoriFilterEl.innerHTML = "";

    const nullKnapp = document.createElement("button");
    nullKnapp.textContent = "Alle";
    nullKnapp.classList.toggle("aktiv", aktivKategori === "");
    nullKnapp.addEventListener("click", () => {
        aktivKategori = "";
        renderKategorier(alleProdukter);
        visProdukter(alleProdukter);
    });
    kategoriFilterEl.appendChild(nullKnapp);

    kategorier.forEach((kat) => {
        const btn = document.createElement("button");
        btn.textContent = kat;
        btn.classList.toggle("aktiv", kat === aktivKategori);
        btn.addEventListener("click", () => {
            aktivKategori = kat;
            renderKategorier(alleProdukter);
            visProdukter(alleProdukter);
        });
        kategoriFilterEl.appendChild(btn);
    });
};

const visProdukter = (liste) => {
    const søkeord = searchInput.value.toLowerCase();
    const filtrert = liste.filter(({ title, acf }) => {
        const tittel = (title?.rendered || "").toLowerCase();
        const varenr = (acf?.varenr ?? "").toString().toLowerCase();
        const kategori = acf?.hovedkategori || "";
        const matcherSøk = tittel.includes(søkeord) || varenr.includes(søkeord);
        const matcherKategori = !aktivKategori || kategori === aktivKategori;
        return matcherSøk && matcherKategori;
    });

    produktliste.innerHTML = "";
    if (filtrert.length === 0) {
        produktliste.innerHTML = "<li>Ingen treff.</li>";
        return;
    }

    filtrert.forEach(({ title, acf }) => {
        const varenr = acf?.varenr || "Ingen varenr";
        const bildeUrl = acf?.bilde?.url || "";
        const bildeAlt = acf?.bilde?.alt || title.rendered;
        const levlogo = acf?.levlogo?.url || "";

        const li = document.createElement("li");
        li.innerHTML = `
        ${bildeUrl ? `<img src="${bildeUrl}" alt="${bildeAlt}">` : ""}
        <strong>${title.rendered}</strong>
        <p>Varenr: ${varenr}</p>
        ${
            levlogo
                ? `<img src="${levlogo}" alt="Leverandørlogo" class="levlogo">`
                : ""
        }
    `;
        produktliste.appendChild(li);
    });
};

searchInput.addEventListener("input", () => {
    visProdukter(alleProdukter);
});

hentAlleProdukter().then((produkter) => {
    alleProdukter = produkter;
    visProdukter(alleProdukter);
    renderKategorier(alleProdukter);
});
